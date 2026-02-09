import { json } from '@remix-run/node';
import Stripe from 'stripe';
import { requireAuth } from '~/utils/auth.server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireAuth({ request });
  const { priceId } = await request.json();

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
    success_url: `${process.env.APP_URL}/dashboard?payment=success`,
    cancel_url: `${process.env.APP_URL}/pricing?payment=cancelled`,
    metadata: {
      userId,
    },
  });

  return json({ sessionId: session.id });
}
