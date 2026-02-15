import { randomInt } from 'node:crypto';
import { env } from '~/config/env.server';
import { authStore } from '~/services/auth/in-memory-auth-store.server';
import { WebAuthnService } from '~/services/auth/webauthn.service';
import { EmailService } from '~/services/auth/email.service';

type VerifyPasskeyInput = {
  id: string;
  type: 'public-key';
  response: {
    clientDataJSON: string;
    authenticatorData?: string;
    signature?: string;
    userHandle?: string | null;
  };
};

export class AuthLockError extends Error {
  code = 'AUTH_LOCKED' as const;

  constructor(message: string) {
    super(message);
    this.name = 'AuthLockError';
  }
}

export class ThreeStepAuthService {
  private _webauthn = new WebAuthnService();
  private _email = new EmailService();

  async authenticateStep1(username: string, password: string): Promise<{ sessionId: string; userId: string }> {
    try {
      const user = authStore.findUserByUsername(username);

      if (!user) {
        throw new Error('Invalid credentials');
      }

      const validPassword = authStore.verifyPassword(user.passwordHash, password);

      if (!validPassword) {
        throw new Error('Invalid credentials');
      }

      const sessionId = authStore.createTempSession(user.id);

      return { sessionId, userId: user.id };
    } catch (error) {
      console.error('Three-step auth step1 failed:', error);
      throw error;
    }
  }

  async sendEmailCode(sessionId: string): Promise<void> {
    try {
      const session = authStore.getTempSession(sessionId);

      if (!session) {
        throw new Error('Invalid or expired session');
      }

      const user = authStore.findUserById(session.userId);

      if (!user) {
        throw new Error('User not found');
      }

      const code = String(randomInt(100000, 999999));
      authStore.saveVerificationCode(user.id, code);

      await this._email.sendVerificationCode(user.email, code);
    } catch (error) {
      console.error('Three-step auth step2 send failed:', error);
      throw error;
    }
  }

  async verifyEmailCode(sessionId: string, code: string): Promise<{ step2Token: string }> {
    try {
      const session = authStore.getTempSession(sessionId);

      if (!session) {
        throw new Error('Invalid or expired session');
      }

      const verification = authStore.verifyLatestCode(session.userId, code);

      if (!verification.ok) {
        if (verification.reason === 'locked' || verification.reason === 'max_attempts') {
          throw new AuthLockError('Verification is temporarily locked due to too many attempts');
        }

        throw new Error('Invalid or expired code');
      }

      const step2Token = authStore.createStep2Token(session.userId);

      return { step2Token };
    } catch (error) {
      console.error('Three-step auth step2 verify failed:', error);
      throw error;
    }
  }

  async initiatePasskeyAuth(step2Token: string): Promise<{ challenge: string; options: unknown }> {
    try {
      const userId = authStore.getStep2TokenUserId(step2Token);

      if (!userId) {
        throw new Error('Invalid step2 token');
      }

      const challenge = this._webauthn.generateChallenge();
      const rpId = new URL(env.APP_URL || 'http://localhost:5173').hostname;
      const options = this._webauthn.generateAuthenticationOptions(challenge, rpId);

      authStore.saveAuthChallenge(userId, challenge);

      return { challenge, options };
    } catch (error) {
      console.error('Three-step auth step3 initiate failed:', error);
      throw error;
    }
  }

  async verifyPasskey(
    step2Token: string,
    credential: VerifyPasskeyInput,
    expectedOrigin: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const userId = this._requireStep2Token(step2Token);
      const clientData = this._consumeAuthChallenge(userId, credential.response.clientDataJSON);
      const passkey = this._requirePasskey(userId, credential.id);

      const rpId = new URL(env.APP_URL || 'http://localhost:5173').hostname;
      const verification = this._webauthn.verifyAuthentication(
        credential,
        clientData.challenge,
        expectedOrigin || env.APP_URL || 'http://localhost:5173',
        rpId,
        passkey.publicKeyPem,
        passkey.signCount,
      );

      if (!verification.verified) {
        throw new Error('Passkey verification failed');
      }

      if (typeof verification.newSignCount === 'number') {
        authStore.updatePasskeySignCount(userId, credential.id, verification.newSignCount);
      }

      const { accessToken, refreshToken } = authStore.issueOpaqueTokenPair(userId);

      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Three-step auth step3 verify failed:', error);
      throw error;
    }
  }

  private _requireStep2Token(step2Token: string): string {
    const userId = authStore.verifyStep2Token(step2Token);

    if (!userId) {
      throw new Error('Invalid step2 token');
    }

    return userId;
  }

  private _consumeAuthChallenge(userId: string, clientDataJson: string): { challenge: string } {
    const normalized = clientDataJson
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(clientDataJson.length / 4) * 4, '=');
    const clientDataJsonBuffer = Buffer.from(normalized, 'base64');
    const clientData = JSON.parse(clientDataJsonBuffer.toString('utf8')) as { challenge: string };
    const challengeUsed = authStore.consumeAuthChallenge(userId, clientData.challenge);

    if (!challengeUsed) {
      throw new Error('Invalid or expired challenge');
    }

    return clientData;
  }

  private _requirePasskey(userId: string, credentialId: string) {
    const passkey = authStore.findPasskeyByCredentialId(userId, credentialId);

    if (!passkey) {
      throw new Error('No matching passkey registered');
    }

    return passkey;
  }
}
