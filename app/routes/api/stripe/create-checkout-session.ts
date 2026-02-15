import { json, type ActionFunctionArgs } from '@remix-run/node';
import Stripe from 'stripe';
import { requireAuth } from '~/utils/auth.server';
import { env } from '~/config/env.server';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
});

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireAuth({ request });
  const payload = (await request.json()) as { priceId?: string };
  const { priceId } = payload;
  const appUrl = env.APP_URL || new URL(request.url).origin;

  if (!priceId) {
    return json({ error: 'Price ID is required' }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${appUrl}/dashboard?payment=success`,
    cancel_url: `${appUrl}/pricing?payment=cancelled`,
    metadata: {
      userId,
    },
  });

  return json({ sessionId: session.id });
}
