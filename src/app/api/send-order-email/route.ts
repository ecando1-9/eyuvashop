import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail } from '@/lib/email';
import type { Order } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { orderId, userEmail } = await req.json();
    const supabase = await createClient();

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    await sendOrderConfirmationEmail(order as Order, userEmail);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
}
