import nodemailer from 'nodemailer';
import { env } from '~/config/env.server';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export async function sendBugReport({ email, subject, message }: { email: string; subject: string; message: string }) {
  try {
    await transporter.sendMail({
      from: `"Smack Support" <${env.SMTP_FROM || env.SMTP_USER}>`,
      to: env.SMTP_TO || env.SMTP_USER,
      subject: `[BUG] ${subject}`,
      text: `From: ${email}\n\n${message}`,
      html: `
        <div>
          <p><strong>From:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send bug report:', error);
    return { error: 'Failed to send bug report' };
  }
}
