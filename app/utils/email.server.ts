import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendBugReport({ email, subject, message }: { email: string; subject: string; message: string }) {
  try {
    await transporter.sendMail({
      from: `"Smack Support" <${process.env.SMTP_FROM}>`,
      to: process.env.SMTP_TO,
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
