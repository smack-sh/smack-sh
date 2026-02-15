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

function parseClientData(clientDataJson: string) {
  const buffer = fromBase64Url(clientDataJson);
  const parsed = JSON.parse(buffer.toString('utf8')) as {
    type: string;
    challenge: string;
    origin: string;
  };

  return { buffer, parsed };
}

function isClientDataValid(
  clientData: { type: string; challenge: string; origin: string },
  expectedChallenge: string,
  expectedOrigin: string,
) {
  return (
    clientData.type === 'webauthn.get' &&
    clientData.challenge === expectedChallenge &&
    clientData.origin === expectedOrigin
  );
}

function parseAuthenticatorData(authenticatorData: string) {
  const authData = fromBase64Url(authenticatorData);

  if (authData.length < 37) {
    return null;
  }

  return authData;
}

function hasRequiredFlags(flags: number) {
  const userPresent = (flags & 0x01) !== 0;
  const userVerified = (flags & 0x04) !== 0;

  return userPresent && userVerified;
}

function verifyRpIdHash(authData: Buffer, expectedRpId: string) {
  const rpIdHashFromAuthData = authData.subarray(0, 32);
  const expectedRpIdHash = createHash('sha256').update(expectedRpId).digest();
  return rpIdHashFromAuthData.equals(expectedRpIdHash);
}

function verifyAssertionSignature(
  authData: Buffer,
  clientDataBuffer: Buffer,
  signatureBase64Url: string,
  credentialPublicKeyPem: string,
) {
  const clientDataHash = createHash('sha256').update(clientDataBuffer).digest();
  const signedPayload = Buffer.concat([authData, clientDataHash]);
  const signature = fromBase64Url(signatureBase64Url);
  const publicKey = createPublicKey(credentialPublicKeyPem);
  return verify('sha256', signedPayload, publicKey, signature);
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

    const { buffer: clientDataJsonBuffer, parsed: clientData } = parseClientData(credential.response.clientDataJSON);

    if (!isClientDataValid(clientData, expectedChallenge, expectedOrigin)) {
      return { verified: false as const };
    }

    const authData = parseAuthenticatorData(credential.response.authenticatorData);

    if (!authData) {
      return { verified: false as const };
    }

    if (!verifyRpIdHash(authData, expectedRpId)) {
      return { verified: false as const };
    }

    const flags = authData.readUInt8(32);

    if (!hasRequiredFlags(flags)) {
      return { verified: false as const };
    }

    const newSignCount = authData.readUInt32BE(33);

    if (newSignCount <= previousSignCount) {
      return { verified: false as const };
    }

    if (!verifyAssertionSignature(authData, clientDataJsonBuffer, credential.response.signature, credentialPublicKeyPem)) {
      return { verified: false as const };
    }

    return { verified: true as const, newSignCount };
  }
}
