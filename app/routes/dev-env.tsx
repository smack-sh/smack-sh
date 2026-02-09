import { LocalDev } from '~/features/dev-env/LocalDev';

export default function DevEnvPage() {
  return (
    <div className="min-h-screen bg-smack-elements-background-depth-1">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <LocalDev />
      </div>
    </div>
  );
}
