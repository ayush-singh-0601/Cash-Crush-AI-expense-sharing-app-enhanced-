"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";

export const sendTestEmail = action({
  args: {
    to: v.string(),
    subject: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Create Gmail transporter with more robust configuration
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000,     // 60 seconds
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: args.to,
      subject: args.subject || "Test Email from Cash Crush",
      html: args.message || "<h1>Test Email</h1><p>This is a test email from your expense sharing app!</p>",
    };

    try {
      // Verify transporter configuration
      await transporter.verify();
      console.log("SMTP transporter verified successfully");
      
      const result = await transporter.sendMail(mailOptions);
      console.log("Test email sent successfully:", result);
      return { success: true, id: result.messageId };
    } catch (error) {
      console.error("Failed to send test email:", error);
      return { success: false, error: error.message };
    }
  },
});