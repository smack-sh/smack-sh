import { type LoaderFunctionArgs } from '@remix-run/cloudflare';
import RBAC from '~/features/auth/RBAC';
import { loader as rbacLoader } from '~/features/auth/RBAC.server';

export async function loader(args: LoaderFunctionArgs) {
  // Convert Cloudflare LoaderFunctionArgs to Node.js format for compatibility
  const nodeArgs = {
    request: args.request,
    params: args.params,
    context: args.context,
  };
  return rbacLoader(nodeArgs as any);
}

export default function RBACPage() {
  return (
    <div className="min-h-screen bg-smack-elements-background-depth-1">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <RBAC />
      </div>
    </div>
  );
}
