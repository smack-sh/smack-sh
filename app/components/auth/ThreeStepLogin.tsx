'use client';

import { useState } from 'react';

type PublicKeyCredentialRequestOptionsJSON = {
  challenge: string;
  timeout?: number;
  rpId?: string;
  userVerification?: UserVerificationRequirement;
  allowCredentials?: Array<{
    id: string;
    type: PublicKeyCredentialType;
    transports?: AuthenticatorTransport[];
  }>;
};

function base64UrlToUint8Array(value: string): Uint8Array {
  const padded = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }

  return bytes;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function normalizeOptions(options: PublicKeyCredentialRequestOptionsJSON): PublicKeyCredentialRequestOptions {
  return {
    ...options,
    challenge: base64UrlToUint8Array(options.challenge),
    allowCredentials: options.allowCredentials?.map((credential) => ({
      ...credential,
      id: base64UrlToUint8Array(credential.id),
    })),
  };
}

export function ThreeStepLogin() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [step2Token, setStep2Token] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStep1 = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const step1Res = await fetch('/api/auth/step1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const step1Data = (await step1Res.json()) as { sessionId?: string; error?: string };

      if (!step1Res.ok || !step1Data.sessionId) {
        throw new Error(step1Data.error || 'Step 1 failed');
      }

      setSessionId(step1Data.sessionId);

      const sendRes = await fetch('/api/auth/step2/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: step1Data.sessionId }),
      });
      const sendData = (await sendRes.json()) as { error?: string };

      if (!sendRes.ok) {
        throw new Error(sendData.error || 'Failed to send email code');
      }

      setStep(2);
    } catch (err) {
      console.error('Three-step login step1 error:', err);
      setError(err instanceof Error ? err.message : 'Unable to start authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const verifyRes = await fetch('/api/auth/step2/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, code }),
      });
      const verifyData = (await verifyRes.json()) as { step2Token?: string; error?: string };

      if (!verifyRes.ok || !verifyData.step2Token) {
        throw new Error(verifyData.error || 'Invalid code');
      }

      setStep2Token(verifyData.step2Token);
      setStep(3);
    } catch (err) {
      console.error('Three-step login step2 error:', err);
      setError(err instanceof Error ? err.message : 'Unable to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async () => {
    if (!window.PublicKeyCredential) {
      setError('This browser does not support passkeys.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const initiateRes = await fetch('/api/auth/step3/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step2Token }),
      });
      const initiateData = (await initiateRes.json()) as {
        options?: PublicKeyCredentialRequestOptionsJSON;
        error?: string;
      };

      if (!initiateRes.ok || !initiateData.options) {
        throw new Error(initiateData.error || 'Unable to start passkey auth');
      }

      const credential = (await navigator.credentials.get({
        publicKey: normalizeOptions(initiateData.options),
      })) as PublicKeyCredential | null;

      if (!credential || !credential.response) {
        throw new Error('No passkey credential received');
      }

      const assertionResponse = credential.response as AuthenticatorAssertionResponse;
      const payload = {
        step2Token,
        credential: {
          id: credential.id,
          type: credential.type,
          response: {
            clientDataJSON: arrayBufferToBase64Url(assertionResponse.clientDataJSON),
            authenticatorData: arrayBufferToBase64Url(assertionResponse.authenticatorData),
            signature: arrayBufferToBase64Url(assertionResponse.signature),
            userHandle: assertionResponse.userHandle ? arrayBufferToBase64Url(assertionResponse.userHandle) : null,
          },
        },
      };

      const verifyRes = await fetch('/api/auth/step3/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const verifyData = (await verifyRes.json()) as {
        accessToken?: string;
        refreshToken?: string;
        error?: string;
      };

      if (!verifyRes.ok || !verifyData.accessToken || !verifyData.refreshToken) {
        throw new Error(verifyData.error || 'Passkey verification failed');
      }

      localStorage.setItem('accessToken', verifyData.accessToken);
      localStorage.setItem('refreshToken', verifyData.refreshToken);
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Three-step login step3 error:', err);
      setError(err instanceof Error ? err.message : 'Unable to verify passkey');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-smack-elements-background-depth-1 px-4">
      <div className="max-w-md w-full bg-smack-elements-background-depth-2 border border-smack-elements-borderColor rounded-lg p-6 space-y-4">
        <h1 className="text-xl font-semibold text-smack-elements-textPrimary">Three-Step Authentication</h1>
        <p className="text-sm text-smack-elements-textSecondary">
          Demo user: <code>{'admin / ChangeMe#12345'}</code> (override with THREE_STEP_DEMO_* env vars)
        </p>

        {error && <div className="text-sm p-2 rounded bg-red-500/10 text-red-500">{error}</div>}

        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-3">
            <input
              name="username"
              placeholder="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              className="w-full p-2 border border-smack-elements-borderColor rounded bg-smack-elements-background-depth-3"
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full p-2 border border-smack-elements-borderColor rounded bg-smack-elements-background-depth-3"
            />
            <button disabled={loading} type="submit" className="w-full p-2 rounded bg-accent-600 text-white">
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-3">
            <input
              name="code"
              placeholder="6-digit email code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              className="w-full p-2 border border-smack-elements-borderColor rounded bg-smack-elements-background-depth-3 text-center text-xl"
            />
            <button
              disabled={loading || code.length !== 6}
              type="submit"
              className="w-full p-2 rounded bg-accent-600 text-white"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {step === 3 && (
          <button disabled={loading} onClick={handleStep3} className="w-full p-2 rounded bg-accent-600 text-white">
            {loading ? 'Verifying passkey...' : 'Authenticate with Passkey'}
          </button>
        )}
      </div>
    </div>
  );
}
