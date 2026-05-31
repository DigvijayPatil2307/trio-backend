import nodemailer from "nodemailer";

export const sendInviteEmail = async (email: string, tripDestination: string, tripUrl: string): Promise<string | null> => {
  let transporter;
  
  // Only use real SMTP if all required fields are set AND they are not placeholder values
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";
  const isRealSmtp = process.env.SMTP_HOST 
    && smtpUser 
    && smtpPass
    && !smtpUser.includes("your-gmail")
    && !smtpPass.includes("your-gmail-app-password");

  const hasSmtpConfig = !!isRealSmtp;

  if (hasSmtpConfig) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate test SMTP service account from ethereal.email in dev mode
    try {
      console.log("[MAILER] Generating test Ethereal account...");
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (e) {
      console.log(`[MAIL SIMULATION] Offline fallback: SMTP not configured. Staging invite email to ${email} for trip to ${tripDestination}.`);
      return null;
    }
  }

  const mailOptions = {
    from: '"Trio Travel" <no-reply@trio.ai>',
    to: email,
    subject: `You're invited! Join the trip to ${tripDestination} on Trio`,
    text: `Hello! You've been invited as a travel companion for a trip to ${tripDestination}.\n\nClick the link below to view the itinerary:\n${tripUrl}\n\nHappy travels,\nTeam Trio`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; padding: 8px 12px; background-color: #4f46e5; color: white; font-weight: 800; border-radius: 8px; font-size: 16px; font-family: sans-serif;">tr</div>
          <h2 style="color: #1e293b; margin-top: 10px; font-family: sans-serif;">You're Invited to Travel!</h2>
        </div>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">Hello,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">You've been invited as a travel companion for an exciting trip to <strong>${tripDestination}</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${tripUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; display: inline-block; font-family: sans-serif;">View Trip Itinerary</a>
        </div>
        <p style="color: #64748b; font-size: 12px; border-top: 1px solid #cbd5e1; padding-top: 20px; margin-top: 30px; line-height: 1.4;">
          If the button above doesn't work, copy and paste this URL into your browser:<br/>
          <a href="${tripUrl}" style="color: #4f46e5; word-break: break-all;">${tripUrl}</a>
        </p>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
          &copy; 2026 Trio Travel. All rights reserved.
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[MAILER] Invitation sent to ${email}: Message ID: ${info.messageId}`);
  
  if (!hasSmtpConfig) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[MAILER] Ethereal Preview URL: ${previewUrl}`);
      return previewUrl;
    }
  }
  return null;
};
