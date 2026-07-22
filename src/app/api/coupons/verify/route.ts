import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Coupon } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { code, orderTotal } = await req.json();
    const supabase = await createClient();

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return NextResponse.json({ success: false, error: 'Invalid or expired coupon code' });
    }

    const c = coupon as Coupon;

    // Check expiry
    if (c.expires_at && new Date(c.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'Coupon has expired' });
    }

    // Check max uses
    if (c.max_uses && c.used_count >= c.max_uses) {
      return NextResponse.json({ success: false, error: 'Coupon usage limit reached' });
    }

    // Check minimum order
    if (c.min_order && orderTotal < c.min_order) {
      return NextResponse.json({
        success: false,
        error: `Minimum order of ₹${c.min_order} required for this coupon`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (c.type === 'percent') {
      discount = Math.round((orderTotal * c.value) / 100);
    } else {
      discount = Math.min(c.value, orderTotal);
    }

    return NextResponse.json({ success: true, discount, coupon: c });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to verify coupon' }, { status: 500 });
  }
}
