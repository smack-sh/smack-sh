import { SignIn } from '@clerk/remix';

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-smack-elements-background-depth-1">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-smack-elements-textPrimary mb-2">Welcome to Smack AI</h1>
          <p className="text-smack-elements-textSecondary">Sign in to access your AI development environment</p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-smack-elements-background-depth-2 shadow-xl',
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}
