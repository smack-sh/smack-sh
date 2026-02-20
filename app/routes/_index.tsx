import { json, type MetaFunction } from '@remix-run/cloudflare';
import { Link } from '@remix-run/react';
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/remix';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const meta: MetaFunction = () => {
  return [
    { title: 'Smack - AI App Builder' },
    { name: 'description', content: 'Build apps faster with AI-powered development tools' },
  ];
};

export const loader = () => json({});

export default function Index() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-smack-elements-background-depth-1">
      <BackgroundRays />
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 lg:px-12 py-4 border-b border-smack-elements-borderColor/30 backdrop-blur-sm">
        <div className="flex items-center gap-2 z-logo text-smack-elements-textPrimary">
          <div className="text-2xl font-semibold text-accent flex items-center">
            <img src="/logo-light-styled.png" alt="Smack" className="w-[90px] inline-block dark:hidden" />
            <img src="/logo-dark-styled.png" alt="Smack" className="w-[90px] inline-block hidden dark:block" />
          </div>
        </div>
        
        <div className="flex items-center gap-4 lg:gap-6">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-smack-elements-textSecondary hover:text-accent transition-colors font-medium">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-6 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-600 transition-all font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link 
              to="/chat" 
              className="px-6 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-600 transition-all font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Go to Chat
            </Link>
          </SignedIn>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <h1 className="text-5xl lg:text-7xl font-bold text-smack-elements-textPrimary mb-6 animate-fade-in">
            Build Apps <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-600">Faster</span> with AI
          </h1>
          
          <p className="text-xl lg:text-2xl text-smack-elements-textSecondary max-w-3xl mx-auto animate-fade-in animation-delay-200">
            Smack is your AI-powered development companion. Create, deploy, and manage applications with the help of advanced AI models.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 animate-fade-in animation-delay-400">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="px-8 py-4 bg-accent text-white rounded-xl hover:bg-accent-600 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1">
                  Start Building Now
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="px-8 py-4 bg-smack-elements-background-depth-2 text-smack-elements-textPrimary rounded-xl hover:bg-smack-elements-background-depth-3 transition-all font-semibold text-lg border border-smack-elements-borderColor hover:border-accent/50">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link 
                to="/chat"
                className="px-8 py-4 bg-accent text-white rounded-xl hover:bg-accent-600 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1"
              >
                Go to Chat
              </Link>
            </SignedIn>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-24 animate-fade-in animation-delay-600">
          <div className="p-8 bg-smack-elements-background-depth-2 rounded-xl border border-smack-elements-borderColor hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 group">
            <div className="i-ph:code-bold text-4xl text-accent mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold text-smack-elements-textPrimary mb-2">
              AI-Powered Coding
            </h3>
            <p className="text-smack-elements-textSecondary">
              Generate code, fix bugs, and build features with intelligent AI assistance using Gemini models.
            </p>
          </div>

          <div className="p-8 bg-smack-elements-background-depth-2 rounded-xl border border-smack-elements-borderColor hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 group">
            <div className="i-ph:rocket-launch-bold text-4xl text-accent mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold text-smack-elements-textPrimary mb-2">
              Quick Deploy
            </h3>
            <p className="text-smack-elements-textSecondary">
              Deploy your applications instantly to popular platforms with seamless integrations.
            </p>
          </div>

          <div className="p-8 bg-smack-elements-background-depth-2 rounded-xl border border-smack-elements-borderColor hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 group">
            <div className="i-ph:stack-bold text-4xl text-accent mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold text-smack-elements-textPrimary mb-2">
              Full Stack Support
            </h3>
            <p className="text-smack-elements-textSecondary">
              Work with React Native, Django, and popular frontend frameworks all in one place.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-smack-elements-borderColor/50 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-smack-elements-textSecondary">
          <p>&copy; 2024 Smack. Built for developers, by developers.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-accent transition-colors">Privacy</a>
            <a href="#" className="hover:text-accent transition-colors">Terms</a>
            <a href="#" className="hover:text-accent transition-colors">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
