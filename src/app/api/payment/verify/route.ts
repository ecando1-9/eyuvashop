import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyPaymentSignature } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // Verify Razorpay signature
    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update order status
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        payment_id: razorpay_payment_id,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select('*, items:order_items(*)')
      .single();

    if (error) throw error;

    // Get user email and send confirmation email
    if (order.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, first_name')
        .eq('id', order.user_id)
        .single();

      if (profile?.email) {
        // Fire and forget - don't await to keep response fast
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-order-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, userEmail: profile.email }),
        }).catch(console.error);
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Payment verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
