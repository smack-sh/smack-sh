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
  passkeys: Array<{ credentialId: string }>;
};

const users = new Map<string, AuthUser>();
const usersByUsername = new Map<string, AuthUser>();
const tempSessions = new Map<string, TempSession>();
const verificationCodes = new Map<string, VerificationCodeRecord[]>();
const step2Tokens = new Map<string, Step2TokenRecord>();
const authChallenges = new Map<string, AuthChallengeRecord[]>();

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
    };
    const current = verificationCodes.get(userId) || [];
    verificationCodes.set(userId, [record, ...current].slice(0, 5));
  },

  verifyLatestCode(userId: string, code: string) {
    const records = verificationCodes.get(userId) || [];
    const now = Date.now();
    const latest = records.find((record) => !record.usedAt && record.expiresAt > now);

    if (!latest) {
      return false;
    }

    const valid = latest.codeHash === hashCode(code);

    if (valid) {
      latest.usedAt = now;
    }

    return valid;
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
};
