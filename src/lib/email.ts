import nodemailer from 'nodemailer';
import type { Order } from '@/types';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOrderConfirmationEmail(
  order: Order,
  userEmail: string
): Promise<void> {
  const itemsHtml = order.items
    ?.map(
      (item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #f3f4f6;">
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="${item.image}" alt="${item.title}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;" />
          <div>
            <p style="font-weight:600;color:#111827;margin:0;">${item.title}</p>
            ${item.size ? `<p style="color:#6b7280;font-size:12px;margin:0;">Size: ${item.size}</p>` : ''}
            ${item.color ? `<p style="color:#6b7280;font-size:12px;margin:0;">Color: ${item.color}</p>` : ''}
          </div>
        </div>
      </td>
      <td style="padding:12px;border-bottom:1px solid #f3f4f6;text-align:center;color:#6b7280;">${item.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;font-family:'Inter',Arial,sans-serif;background:#f9fafb;">
  <div style="max-width:600px;margin:32px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px;text-align:center;">
      <h1 style="color:white;font-size:28px;font-weight:800;margin:0;">eYuvaShop</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Order Confirmed! 🎉</p>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 8px;">Thank you for your order!</h2>
      <p style="color:#6b7280;margin:0 0 24px;">
        Hi there! Your order <strong style="color:#f97316;">#${order.order_number}</strong> has been placed successfully.
        We'll notify you when it's shipped.
      </p>
      <!-- Order Details Box -->
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#6b7280;font-size:14px;">Order Number</span>
          <strong style="color:#f97316;">#${order.order_number}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#6b7280;font-size:14px;">Order Date</span>
          <span style="color:#374151;">${new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#6b7280;font-size:14px;">Payment Status</span>
          <span style="color:#16a34a;font-weight:600;">✓ Paid</span>
        </div>
      </div>
      <!-- Items Table -->
      <h3 style="color:#111827;font-size:16px;font-weight:600;margin:0 0 12px;">Order Items</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">Product</th>
            <th style="padding:10px 12px;text-align:center;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">Qty</th>
            <th style="padding:10px 12px;text-align:right;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <!-- Price Summary -->
      <div style="border-top:2px solid #f3f4f6;padding-top:16px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#6b7280;">Subtotal</span>
          <span>₹${order.subtotal.toFixed(2)}</span>
        </div>
        ${order.discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#16a34a;">Discount</span><span style="color:#16a34a;">-₹${order.discount.toFixed(2)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#6b7280;">Shipping</span>
          <span>${order.shipping === 0 ? '<span style="color:#16a34a;">FREE</span>' : `₹${order.shipping.toFixed(2)}`}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:700;margin-top:12px;border-top:1px solid #f3f4f6;padding-top:12px;">
          <span>Total</span>
          <span style="color:#f97316;">₹${order.total.toFixed(2)}</span>
        </div>
      </div>
      <!-- CTA -->
      <div style="text-align:center;margin-top:32px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}" 
           style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
          Track Your Order
        </a>
      </div>
    </div>
    <!-- Footer -->
    <div style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        © 2024 eYuvaShop. All rights reserved.<br />
        If you have any questions, contact us at <a href="mailto:support@eyuvashop.com" style="color:#f97316;">support@eyuvashop.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"eYuvaShop" <${process.env.SMTP_FROM}>`,
    to: userEmail,
    subject: `Order Confirmed #${order.order_number} – eYuvaShop`,
    html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<void> {
  await transporter.sendMail({
    from: `"eYuvaShop" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: 'Reset your eYuvaShop password',
    html: `
      <div style="max-width:480px;margin:32px auto;font-family:Arial,sans-serif;">
        <h2>Reset Your Password</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}" style="display:inline-block;background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
