import { json } from '@remix-run/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function action({ request }: ActionFunctionArgs) {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature')!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    const event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      
      if (userId) {
        await addCreditsToUser(userId, session.amount_total! / 100);
      }
    }

    return json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return json({ error: 'Webhook error' }, { status: 400 });
  }
}

async function addCreditsToUser(userId: string, amount: number) {
  // Implement your credit addition logic here
  console.log(`Adding ${amount} credits to user ${userId}`);
}
