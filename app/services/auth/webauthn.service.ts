import { createHash, createPublicKey, randomBytes, verify } from 'node:crypto';

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

  verifyAuthentication(
    credential: PublicKeyCredentialJSON,
    expectedChallenge: string,
    expectedOrigin: string,
    expectedRpId: string,
    credentialPublicKeyPem: string,
    previousSignCount: number,
  ) {
    if (!credential.response.authenticatorData || !credential.response.signature) {
      return { verified: false as const };
    }

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
      return { verified: false as const };
    }

    const authData = fromBase64Url(credential.response.authenticatorData);

    if (authData.length < 37) {
      return { verified: false as const };
    }

    const rpIdHashFromAuthData = authData.subarray(0, 32);
    const expectedRpIdHash = createHash('sha256').update(expectedRpId).digest();

    if (!rpIdHashFromAuthData.equals(expectedRpIdHash)) {
      return { verified: false as const };
    }

    const flags = authData.readUInt8(32);
    const userPresent = (flags & 0x01) !== 0;
    const userVerified = (flags & 0x04) !== 0;

    if (!userPresent || !userVerified) {
      return { verified: false as const };
    }

    const newSignCount = authData.readUInt32BE(33);

    if (newSignCount <= previousSignCount) {
      return { verified: false as const };
    }

    const clientDataHash = createHash('sha256').update(clientDataJsonBuffer).digest();
    const signedPayload = Buffer.concat([authData, clientDataHash]);
    const signature = fromBase64Url(credential.response.signature);
    const publicKey = createPublicKey(credentialPublicKeyPem);
    const signatureValid = verify('sha256', signedPayload, publicKey, signature);

    if (!signatureValid) {
      return { verified: false as const };
    }

    return { verified: true as const, newSignCount };
  }
}
