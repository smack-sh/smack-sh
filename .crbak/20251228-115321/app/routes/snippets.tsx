import { SnippetManager } from '~/features/snippets/SnippetManager';

export default function SnippetsPage() {
  return (
    <div className="min-h-screen bg-smack-elements-background-depth-1">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <SnippetManager />
      </div>
    </div>
  );
}
