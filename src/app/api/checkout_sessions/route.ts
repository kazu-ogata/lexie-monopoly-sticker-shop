import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2025-01-27.acacia' as any,
});

export async function POST(req: NextRequest) {
  try {
    const { items, email, userId, paymentMethod, isDirect } = await req.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image_url ? [item.image_url] : [],
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: item.quantity,
    }));

    // Enable Cash App or Venmo if selected, Cards/Apple Pay are included automatically
    const paymentMethodTypes: string[] = ['card'];
    if (paymentMethod === 'cashapp') {
      paymentMethodTypes.push('cashapp');
    }
    if (paymentMethod === 'venmo') {
      paymentMethodTypes.push('venmo');
    }

    const cancelUrl = isDirect
      ? `${req.headers.get('origin')}/checkout?mode=direct`
      : `${req.headers.get('origin')}/checkout`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      customer_email: email,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId || '',
        paymentMethod: paymentMethod,
        ign: items[0]?.ign || '',
        inviteLink: items[0]?.inviteLink || '',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Stripe Error:', err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}