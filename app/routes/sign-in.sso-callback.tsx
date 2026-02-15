import { AuthenticateWithRedirectCallback } from '@clerk/remix';

export default function SignInSsoCallbackPage() {
  return <AuthenticateWithRedirectCallback signInUrl="/sign-in" signUpUrl="/sign-up" />;
}
