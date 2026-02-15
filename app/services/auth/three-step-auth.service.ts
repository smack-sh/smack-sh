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

      const valid = authStore.verifyLatestCode(session.userId, code);

      if (!valid) {
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
      const userId = authStore.verifyStep2Token(step2Token);

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
      const userId = authStore.verifyStep2Token(step2Token);

      if (!userId) {
        throw new Error('Invalid step2 token');
      }

      const normalized = credential.response.clientDataJSON
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(credential.response.clientDataJSON.length / 4) * 4, '=');
      const clientDataJsonBuffer = Buffer.from(normalized, 'base64');
      const clientData = JSON.parse(clientDataJsonBuffer.toString('utf8')) as { challenge: string };
      const challengeUsed = authStore.consumeAuthChallenge(userId, clientData.challenge);

      if (!challengeUsed) {
        throw new Error('Invalid or expired challenge');
      }

      const verification = this._webauthn.verifyAuthentication(
        credential,
        clientData.challenge,
        expectedOrigin || env.APP_URL || 'http://localhost:5173',
      );

      if (!verification.verified) {
        throw new Error('Passkey verification failed');
      }

      const accessToken = Buffer.from(`${userId}:${Date.now()}:access`).toString('base64url');
      const refreshToken = Buffer.from(`${userId}:${Date.now()}:refresh`).toString('base64url');

      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Three-step auth step3 verify failed:', error);
      throw error;
    }
  }
}
