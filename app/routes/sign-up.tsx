import { SignUp } from '@clerk/remix';

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-smack-elements-background-depth-1">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-smack-elements-textPrimary mb-2">Create Your Account</h1>
          <p className="text-smack-elements-textSecondary">Join Smack AI and start building with autonomous AI</p>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-smack-elements-background-depth-2 shadow-xl',
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
