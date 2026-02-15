import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

export type TempSession = {
  id: string;
  userId: string;
  expiresAt: number;
};

export type VerificationCodeRecord = {
  userId: string;
  codeHash: string;
  expiresAt: number;
  usedAt?: number;
  failedAttempts: number;
  lastFailedAt?: number;
  lockUntil?: number;
};

export type Step2TokenRecord = {
  token: string;
  userId: string;
  expiresAt: number;
};

export type AuthChallengeRecord = {
  challenge: string;
  userId: string;
  expiresAt: number;
  usedAt?: number;
};

type AuthUser = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  passkeys: Array<{ credentialId: string; publicKeyPem: string; signCount: number }>;
};

type OpaqueTokenRecord = {
  token: string;
  userId: string;
  type: 'access' | 'refresh';
  expiresAt: number;
  createdAt: number;
  revokedAt?: number;
  replacedByToken?: string;
};

const users = new Map<string, AuthUser>();
const usersByUsername = new Map<string, AuthUser>();
const tempSessions = new Map<string, TempSession>();
const verificationCodes = new Map<string, VerificationCodeRecord[]>();
const step2Tokens = new Map<string, Step2TokenRecord>();
const authChallenges = new Map<string, AuthChallengeRecord[]>();
const opaqueTokens = new Map<string, OpaqueTokenRecord>();

const cleanupInterval = 60_000;
let cleanupStarted = false;

function makePasswordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  const digest = scryptSync(password, salt, 64).toString('hex');

  return `${salt}:${digest}`;
}

function verifyPassword(passwordHash: string, plainText: string) {
  const [salt, expectedDigest] = passwordHash.split(':');

  if (!salt || !expectedDigest) {
    return false;
  }

  const digest = scryptSync(plainText, salt, 64).toString('hex');
  const left = Buffer.from(expectedDigest, 'hex');
  const right = Buffer.from(digest, 'hex');

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function hashCode(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function ensureSeedUser() {
  const username = process.env.THREE_STEP_DEMO_USERNAME || 'admin';
  const email = process.env.THREE_STEP_DEMO_EMAIL || 'admin@example.com';
  const password = process.env.THREE_STEP_DEMO_PASSWORD || 'ChangeMe#12345';

  if (usersByUsername.has(username)) {
    return;
  }

  const user: AuthUser = {
    id: `usr_${randomUUID()}`,
    username,
    email,
    passwordHash: makePasswordHash(password),
    passkeys: [],
  };

  users.set(user.id, user);
  usersByUsername.set(user.username, user);
}

function pruneExpired() {
  const now = Date.now();

  for (const [id, session] of tempSessions) {
    if (session.expiresAt <= now) {
      tempSessions.delete(id);
    }
  }

  for (const [token, record] of step2Tokens) {
    if (record.expiresAt <= now) {
      step2Tokens.delete(token);
    }
  }

  for (const [userId, records] of verificationCodes) {
    verificationCodes.set(
      userId,
      records.filter((record) => record.expiresAt > now),
    );
  }

  for (const [userId, records] of authChallenges) {
    authChallenges.set(
      userId,
      records.filter((record) => record.expiresAt > now),
    );
  }

  for (const [token, record] of opaqueTokens) {
    if (record.expiresAt <= now || record.revokedAt) {
      opaqueTokens.delete(token);
    }
  }
}

function startCleanupLoop() {
  if (cleanupStarted) {
    return;
  }

  cleanupStarted = true;
  setInterval(pruneExpired, cleanupInterval).unref();
}

ensureSeedUser();
startCleanupLoop();

export const authStore = {
  findUserByUsername(username: string) {
    return usersByUsername.get(username) || null;
  },

  findUserById(userId: string) {
    return users.get(userId) || null;
  },

  verifyPassword(passwordHash: string, password: string) {
    return verifyPassword(passwordHash, password);
  },

  createTempSession(userId: string, ttlMs = 10 * 60 * 1000) {
    const id = randomUUID();
    tempSessions.set(id, { id, userId, expiresAt: Date.now() + ttlMs });

    return id;
  },

  getTempSession(sessionId: string) {
    const session = tempSessions.get(sessionId);

    if (!session || session.expiresAt <= Date.now()) {
      return null;
    }

    return session;
  },

  saveVerificationCode(userId: string, code: string, ttlMs = 5 * 60 * 1000) {
    const record: VerificationCodeRecord = {
      userId,
      codeHash: hashCode(code),
      expiresAt: Date.now() + ttlMs,
      failedAttempts: 0,
    };
    const current = verificationCodes.get(userId) || [];
    verificationCodes.set(userId, [record, ...current].slice(0, 5));
  },

  verifyLatestCode(userId: string, code: string) {
    const records = verificationCodes.get(userId) || [];
    const now = Date.now();
    const latest = records.find((record) => !record.usedAt && record.expiresAt > now);

    if (!latest) {
      return { ok: false as const, reason: 'missing' as const };
    }

    if (latest.lockUntil && latest.lockUntil > now) {
      return { ok: false as const, reason: 'locked' as const, lockUntil: latest.lockUntil };
    }

    const valid = latest.codeHash === hashCode(code);

    if (valid) {
      latest.usedAt = now;
      latest.failedAttempts = 0;

      return { ok: true as const };
    }

    latest.failedAttempts += 1;
    latest.lastFailedAt = now;

    if (latest.failedAttempts >= 5) {
      latest.lockUntil = now + 15 * 60 * 1000;
      latest.usedAt = now;

      return { ok: false as const, reason: 'max_attempts' as const, lockUntil: latest.lockUntil };
    }

    if (latest.failedAttempts >= 3) {
      latest.lockUntil = now + latest.failedAttempts * 1000;
    }

    return { ok: false as const, reason: 'invalid' as const, lockUntil: latest.lockUntil };
  },

  createStep2Token(userId: string, ttlMs = 10 * 60 * 1000) {
    const token = randomBytes(32).toString('hex');
    step2Tokens.set(token, { token, userId, expiresAt: Date.now() + ttlMs });

    return token;
  },

  verifyStep2Token(token: string) {
    const record = step2Tokens.get(token);

    if (!record || record.expiresAt <= Date.now()) {
      return null;
    }

    return record.userId;
  },

  saveAuthChallenge(userId: string, challenge: string, ttlMs = 5 * 60 * 1000) {
    const record: AuthChallengeRecord = {
      challenge,
      userId,
      expiresAt: Date.now() + ttlMs,
    };
    const current = authChallenges.get(userId) || [];
    authChallenges.set(userId, [record, ...current].slice(0, 5));
  },

  consumeAuthChallenge(userId: string, challenge: string) {
    const records = authChallenges.get(userId) || [];
    const now = Date.now();
    const target = records.find((record) => !record.usedAt && record.expiresAt > now && record.challenge === challenge);

    if (!target) {
      return false;
    }

    target.usedAt = now;

    return true;
  },

  findPasskeyByCredentialId(userId: string, credentialId: string) {
    const user = users.get(userId);

    if (!user) {
      return null;
    }

    return user.passkeys.find((passkey) => passkey.credentialId === credentialId) || null;
  },

  updatePasskeySignCount(userId: string, credentialId: string, signCount: number) {
    const user = users.get(userId);

    if (!user) {
      return false;
    }

    const passkey = user.passkeys.find((candidate) => candidate.credentialId === credentialId);

    if (!passkey) {
      return false;
    }

    passkey.signCount = signCount;

    return true;
  },

  issueOpaqueTokenPair(userId: string, accessTtlMs = 15 * 60 * 1000, refreshTtlMs = 30 * 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const accessToken = randomBytes(32).toString('base64url');
    const refreshToken = randomBytes(48).toString('base64url');

    opaqueTokens.set(accessToken, {
      token: accessToken,
      userId,
      type: 'access',
      expiresAt: now + accessTtlMs,
      createdAt: now,
    });

    opaqueTokens.set(refreshToken, {
      token: refreshToken,
      userId,
      type: 'refresh',
      expiresAt: now + refreshTtlMs,
      createdAt: now,
    });

    return { accessToken, refreshToken };
  },

  verifyOpaqueToken(token: string, expectedType: 'access' | 'refresh') {
    const record = opaqueTokens.get(token);

    if (!record || record.type !== expectedType || record.expiresAt <= Date.now() || record.revokedAt) {
      return null;
    }

    return { userId: record.userId, type: record.type };
  },

  rotateRefreshToken(token: string, ttlMs = 30 * 24 * 60 * 60 * 1000) {
    const record = opaqueTokens.get(token);

    if (!record || record.type !== 'refresh' || record.expiresAt <= Date.now() || record.revokedAt) {
      return null;
    }

    const nextToken = randomBytes(48).toString('base64url');
    const now = Date.now();
    record.revokedAt = now;
    record.replacedByToken = nextToken;

    opaqueTokens.set(nextToken, {
      token: nextToken,
      userId: record.userId,
      type: 'refresh',
      expiresAt: now + ttlMs,
      createdAt: now,
    });

    return nextToken;
  },
};
