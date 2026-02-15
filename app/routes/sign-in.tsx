import { SignIn } from '@clerk/remix';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

function hasConfiguredClerkKey(key?: string): boolean {
  if (!key) {
    return false;
  }

  if (key.includes('your_clerk_publishable_key')) {
    return false;
  }

  return /^pk_(test|live)_/.test(key);
}

export function loader(_args: LoaderFunctionArgs) {
  const key = process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;
  return json({ clerkReady: hasConfiguredClerkKey(key) });
}

export default function SignInPage() {
  const { clerkReady } = useLoaderData<typeof loader>();

  return (
    <div className="flex items-center justify-center min-h-screen bg-smack-elements-background-depth-1">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-smack-elements-textPrimary mb-2">Welcome to Smack AI</h1>
          <p className="text-smack-elements-textSecondary">Sign in to access your AI development environment</p>
        </div>

        {clerkReady ? (
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
        ) : (
          <div className="rounded-lg border border-smack-elements-borderColor bg-smack-elements-background-depth-2 p-4 text-sm text-smack-elements-textSecondary">
            Authentication is not configured yet. Set real Clerk keys in <code>.env.local</code>:
            <div className="mt-2 font-mono text-xs">CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY</div>
          </div>
        )}
      </div>
    </div>
  );
}
