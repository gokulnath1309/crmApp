"use node";

declare const process: { env: Record<string, string | undefined> };

import nodemailer from "nodemailer";
import { action } from "./_generated/server";
import { v } from "convex/values";

// Validate and retrieve SMTP credentials from environment variables
const getTransporter = () => {
  const email = process.env.SMTP_EMAIL;
  const password = process.env.SMTP_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "SMTP_EMAIL or SMTP_PASSWORD environment variable is missing on Convex backend. " +
      "Please set them on the Convex Dashboard under Settings > Environment Variables."
    );
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: password,
    },
  });
};

export const sendTestEmail = action({
  args: {
    to: v.string(),
  },
  handler: async (_ctx, args) => {
    const { to } = args;
    console.info(`[sendTestEmail] Preparing to send test email to: ${to}`);

    let transporter;
    try {
      transporter = getTransporter();
    } catch (err) {
      console.error(`[sendTestEmail] Transporter init error:`, err);
      throw err;
    }

    try {
      const info = await transporter.sendMail({
        from: `"CRM Pro" <${process.env.SMTP_EMAIL}>`,
        to,
        subject: "CRM Pro Test Email",
        text: "Hello from CRM Pro. Nodemailer is configured correctly.",
      });

      console.info(`[sendTestEmail] Nodemailer sendMail Response:`, info);
      console.info(`[sendTestEmail] Test email sent successfully. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`[sendTestEmail] Fatal error sending test email:`, error);
      throw new Error(error instanceof Error ? error.message : "Internal error sending test email");
    }
  },
});

export const sendOtpEmail = action({
  args: {
    email: v.string(),
    otp: v.string(),
  },
  handler: async (_ctx, args) => {
    const { email, otp } = args;
    console.info(`[sendOtpEmail] Preparing to send OTP verification code to: ${email}`);
    // Log OTP for development validation purposes
    console.info(`[sendOtpEmail] [DEV ONLY] OTP Code: ${otp}`);

    let transporter;
    try {
      transporter = getTransporter();
    } catch (err) {
      console.error(`[sendOtpEmail] Transporter init error:`, err);
      throw err;
    }

    try {
      const info = await transporter.sendMail({
        from: `"CRM Pro" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: "CRM Pro Email Verification Code",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 24px; font-weight: bold; color: #4f46e5; letter-spacing: -0.5px;">CRM Pro</span>
            </div>
            <h2 style="color: #0f172a; margin-bottom: 12px; font-size: 20px; text-align: center; font-weight: 700;">Verify your email</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.5; text-align: center; margin-bottom: 24px;">
              Use the verification code below to complete your login or registration:
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; margin: 24px 0; color: #1e1b4b; font-family: monospace;">
              ${otp}
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center; margin-top: 24px;">
              This code will expire in 5 minutes.
            </p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.4;">
              If you did not request this verification code, please ignore this email.
            </p>
          </div>
        `,
      });

      console.info(`[sendOtpEmail] OTP email sent successfully. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`[sendOtpEmail] Fatal error sending OTP email:`, error);
      throw new Error(error instanceof Error ? error.message : "Internal error sending OTP email");
    }
  },
});

export const sendPasswordResetEmail = action({
  args: {
    email: v.string(),
    name: v.string(),
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const { email, name, token } = args;
    console.info(`[sendPasswordResetEmail] Sending reset email to: ${email}`);

    // Build the reset URL — use localhost for dev, can be changed to an env var for prod
    const baseUrl = process.env.SITE_URL ?? "http://localhost:5173";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    let transporter;
    try {
      transporter = getTransporter();
    } catch (err) {
      console.error(`[sendPasswordResetEmail] Transporter init error:`, err);
      throw err;
    }

    try {
      const info = await transporter.sendMail({
        from: `"CRM Pro" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: "CRM Pro Password Reset",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 28px;">
              <span style="font-size: 26px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px;">CRM Pro</span>
            </div>
            <h2 style="color: #0f172a; margin-bottom: 12px; font-size: 22px; text-align: center; font-weight: 700;">Reset your password</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 28px;">
              Hi ${name}, we received a request to reset your CRM Pro password. Click the button below to choose a new password.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 12px; text-decoration: none; letter-spacing: 0.2px; box-shadow: 0 4px 14px rgba(79,70,229,0.4);">
                Reset Password
              </a>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.6; text-align: center; margin: 20px 0 8px;">
              Or copy and paste this link in your browser:
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; word-break: break-all; font-size: 12px; color: #4f46e5; font-family: monospace; text-align: center; margin-bottom: 24px;">
              ${resetUrl}
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-bottom: 4px;">
              ⏰ This link expires in <strong>15 minutes</strong>.
            </p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.5;">
              If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
            </p>
          </div>
        `,
      });

      console.info(`[sendPasswordResetEmail] Reset email sent. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`[sendPasswordResetEmail] Fatal error:`, error);
      throw new Error(error instanceof Error ? error.message : "Internal error sending reset email");
    }
  },
});

export const checkResendConfig = action({
  args: {},
  handler: async () => {
    const email = process.env.SMTP_EMAIL;
    const password = process.env.SMTP_PASSWORD;
    if (!email || !password) {
      return {
        configured: false,
        keyPresent: false,
        message: "SMTP_EMAIL or SMTP_PASSWORD is missing from environment variables.",
      };
    }
    return {
      configured: true,
      keyPresent: true,
      keyPrefix: email.substring(0, 4) + "...",
      keyLength: email.length,
      message: "SMTP is configured.",
    };
  },
});

export const sendInvitationEmail = action({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.string(),
    department: v.optional(v.string()),
    managerName: v.optional(v.string()),
    companyName: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const { email, name, role, department, managerName, companyName, token } = args;
    console.log("[sendInvitationEmail] Sending email payload:", { email, name, role, department, managerName, companyName, token });

    const company = companyName || "our company";
    const baseUrl = process.env.SITE_URL ?? "http://localhost:5173";
    const inviteUrl = `${baseUrl}/invite/${token}`;

    let transporter;
    try {
      transporter = getTransporter();
    } catch (err: any) {
      console.error(`[sendInvitationEmail] Transporter init error:`, err);
      throw new Error(`SMTP configuration error: ${err.message}`);
    }

    try {
      console.log(`[sendInvitationEmail] Invoking Nodemailer sendMail for ${email}...`);
      const info = await transporter.sendMail({
        from: `"CRM Pro" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: `You're invited to join ${company} on CRMPro`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 28px;">
              <span style="font-size: 26px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px;">CRM Pro</span>
            </div>
            <h2 style="color: #0f172a; margin-bottom: 12px; font-size: 22px; text-align: center; font-weight: 700;">You're Invited!</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 28px;">
              Hi ${name}, you have been invited to join the <strong>${company}</strong> workspace.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #475569;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a; width: 120px;">Role:</td>
                  <td style="padding: 6px 0;">${role}</td>
                </tr>
                ${department ? `
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">Department:</td>
                  <td style="padding: 6px 0;">${department}</td>
                </tr>
                ` : ""}
                ${managerName ? `
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">Manager:</td>
                  <td style="padding: 6px 0;">${managerName}</td>
                </tr>
                ` : ""}
              </table>
            </div>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 12px; text-decoration: none; letter-spacing: 0.2px; box-shadow: 0 4px 14px rgba(79,70,229,0.4);">
                Accept Invitation
              </a>
            </div>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.5;">
              If you did not expect this invitation, please ignore this email.
            </p>
          </div>
        `,
      });

      console.log("[sendInvitationEmail] Nodemailer sendMail Response:", info);
      console.log(`[sendInvitationEmail] Email sent successfully! Msg ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId, smtpResponse: info.response };
    } catch (error: any) {
      console.error("[sendInvitationEmail] Nodemailer Exception:", error);
      throw error;
    }
  },
});
