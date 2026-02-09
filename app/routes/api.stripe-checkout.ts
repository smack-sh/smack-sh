import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import Stripe from 'stripe';

export const action = async ({ request, context }: ActionFunctionArgs) => {
  try {
    const stripeSecretKey = (context?.cloudflare?.env as any)?.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return json({ error: 'STRIPE_SECRET_KEY is not set in environment variables' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const { priceId } = await request.json();

    if (!priceId) {
      return json({ error: 'priceId is required' }, { status: 400 });
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
      success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/cancel`,
    });

    return json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 },
    );
  }
};
