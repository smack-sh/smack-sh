import { LoaderFunctionArgs, redirect } from '@remix-run/cloudflare';
import { getAuth } from '@clerk/remix/ssr.server';
import { Outlet } from '@remix-run/react';

export async function loader(args: LoaderFunctionArgs) {
  const { userId } = await getAuth(args);
  
  if (!userId) {
    return redirect('/');
  }
  
  return null;
}

export default function ChatLayout() {
  return <Outlet />;
}
