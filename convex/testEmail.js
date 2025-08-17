"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";

export const testEmail = action({
  args: {
    to: v.string(),
    subject: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if required environment variables are set
    if (!process.env.GMAIL_USER) {
      console.error("GMAIL_USER environment variable is not set");
      return { 
        success: false, 
        error: "GMAIL_USER environment variable is not configured. Please add GMAIL_USER=your-email@gmail.com to your .env.local file." 
      };
    }

    if (!process.env.GMAIL_APP_PASSWORD) {
      console.error("GMAIL_APP_PASSWORD environment variable is not set");
      return { 
        success: false, 
        error: "GMAIL_APP_PASSWORD environment variable is not configured. Please add GMAIL_APP_PASSWORD=your-16-character-app-password to your .env.local file." 
      };
    }

    // Create Gmail transporter with more robust configuration
    const transporter = nodemailer.createTransport({
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
      
      // Provide more specific error messages
      let errorMessage = error.message;
      
      if (error.code === 'EAUTH') {
        errorMessage = "Gmail authentication failed. Please check your GMAIL_USER and GMAIL_APP_PASSWORD. Make sure 2FA is enabled and you're using an App Password, not your regular password.";
      } else if (error.code === 'ECONNECTION') {
        errorMessage = "Connection to Gmail failed. Please check your internet connection and try again.";
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = "Connection to Gmail timed out. Please try again.";
      } else if (error.message.includes('Invalid login')) {
        errorMessage = "Invalid Gmail credentials. Please check your GMAIL_USER and GMAIL_APP_PASSWORD.";
      } else if (error.message.includes('verify')) {
        errorMessage = "SMTP configuration verification failed. Please check your Gmail settings and App Password.";
      }
      
      return { success: false, error: errorMessage };
    }
  },
});