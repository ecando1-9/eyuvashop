import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { razorpay } from '@/lib/razorpay';
import { generateOrderNumber } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { items, subtotal, shipping, total, shipping_address, coupon_code, discount = 0 } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'No items provided' }, { status: 400 });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // in paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    const orderNumber = generateOrderNumber();

    // Create order in DB
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id || null,
        order_number: orderNumber,
        status: 'pending',
        payment_status: 'pending',
        razorpay_order_id: razorpayOrder.id,
        subtotal,
        discount,
        shipping,
        total,
        coupon_code,
        shipping_address,
      })
      .select()
      .single();

    if (error) throw error;

    // Insert order items
    await supabase.from('order_items').insert(
      items.map((item: Record<string, unknown>) => ({
        order_id: order.id,
        product_id: item.product_id,
        title: item.title,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      }))
    );

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber,
      razorpayOrder,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
