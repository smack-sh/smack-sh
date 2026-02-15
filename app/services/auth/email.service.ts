import { env } from '~/config/env.server';

export class EmailService {
  async sendVerificationCode(to: string, code: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    const transportEnabled = env.EMAIL_TRANSPORT_ENABLED === 'true';
    const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

    if (transportEnabled && smtpConfigured) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          host: env.SMTP_HOST,
          port: parseInt(env.SMTP_PORT || '587', 10),
          secure: false,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Smack Security" <${env.SMTP_FROM || env.SMTP_USER}>`,
          to,
          subject: 'Your verification code',
          text: `Your verification code is ${code}. It expires in 5 minutes.`,
        });

        return;
      } catch (error) {
        if (isProduction) {
          throw new Error('Email transport failed and cannot fallback in production');
        }

        console.error('Email transport unavailable, using dev fallback:', error);
      }
    }

    if (isProduction) {
      throw new Error('Email transport is not configured for production');
    }

    console.log(`[ThreeStepAuth][DEV ONLY] Verification code for ${to}: ${code}`);
  }
}
