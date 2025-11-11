// netlify/functions/submission-created.js
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

export async function handler(event) {
  try {
    const payload = JSON.parse(event.body);
    const data = payload && payload.payload && payload.payload.data ? payload.payload.data : {};

    const toEmail = (data.email || '').trim();
    const name = (data.name || '').trim();
    if (!toEmail) {
      console.log('No email field on submission, skipping auto-reply.');
      return { statusCode: 200, body: 'No email provided, skipped.' };
    }

    const templatePath = path.join(process.cwd(), 'email_template.html');
    let html = fs.readFileSync(templatePath, 'utf8');
    const fill = (s) => s
      .replace(/{{name}}/g, name || 'there')
      .replace(/{{phone}}/g, data.phone || '')
      .replace(/{{email}}/g, toEmail)
      .replace(/{{address}}/g, data.address || '')
      .replace(/{{city}}/g, data.city || '')
      .replace(/{{zip}}/g, data.zip || '')
      .replace(/{{window}}/g, data.window || '')
      .replace(/{{notes}}/g, data.notes || '');
    html = fill(html);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.FROM_EMAIL || 'neatfleetbooking@gmail.com';
    const fromName = process.env.FROM_NAME || 'Neat Fleet Laundry';
    const subject = 'We received your pickup request — Neat Fleet Laundry';

    const { data: sent, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [toEmail],
      subject,
      html
    });

    if (error) {
      console.error('Resend error:', error);
      return { statusCode: 500, body: 'Failed to send auto-reply.' };
    }

    console.log('Auto-reply sent:', sent && sent.id);
    return { statusCode: 200, body: 'Auto-reply sent.' };
  } catch (e) {
    console.error('Function error:', e);
    return { statusCode: 500, body: 'Function error.' };
  }
}
