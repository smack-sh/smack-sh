import { AuthenticateWithRedirectCallback } from '@clerk/remix';

export default function SignUpSsoCallbackPage() {
  return <AuthenticateWithRedirectCallback signInUrl="/sign-in" signUpUrl="/sign-up" />;
}
