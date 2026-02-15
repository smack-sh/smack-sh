import { AuthenticateWithRedirectCallback } from '@clerk/remix';

export default function SsoCallbackPage() {
  return <AuthenticateWithRedirectCallback signInUrl="/sign-in" signUpUrl="/sign-up" />;
}
