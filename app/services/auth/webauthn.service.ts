import { randomBytes } from 'node:crypto';

type PublicKeyCredentialResponseJSON = {
  clientDataJSON: string;
  authenticatorData?: string;
  signature?: string;
  userHandle?: string | null;
};

type PublicKeyCredentialJSON = {
  id: string;
  type: 'public-key';
  response: PublicKeyCredentialResponseJSON;
};

function toBase64Url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromBase64Url(value: string) {
  const padded = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64');
}

export class WebAuthnService {
  generateChallenge() {
    return toBase64Url(randomBytes(32));
  }

  generateAuthenticationOptions(challenge: string, rpId: string) {
    return {
      challenge,
      timeout: 60_000,
      rpId,
      userVerification: 'required' as const,
      allowCredentials: [],
    };
  }

  verifyAuthentication(credential: PublicKeyCredentialJSON, expectedChallenge: string, expectedOrigin: string) {
    const clientDataJsonBuffer = fromBase64Url(credential.response.clientDataJSON);
    const clientData = JSON.parse(clientDataJsonBuffer.toString('utf8')) as {
      type: string;
      challenge: string;
      origin: string;
    };

    if (clientData.type !== 'webauthn.get') {
      return { verified: false };
    }

    if (clientData.challenge !== expectedChallenge) {
      return { verified: false };
    }

    if (clientData.origin !== expectedOrigin) {
      return { verified: false };
    }

    return { verified: true };
  }
}
