export class EmailService {
  async sendVerificationCode(to: string, code: string) {
    /*
     * Fallback transport for dev/runtime environments without nodemailer installed.
     * Keeps auth flow functional while still surfacing the one-time code in logs.
     */
    console.log(`[ThreeStepAuth] Verification code for ${to}: ${code}`);
  }
}
