"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import nodemailer from "nodemailer";

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    text: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("sendEmail function called with args:", args);
    
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

    console.log("Environment variables found:", {
      GMAIL_USER: process.env.GMAIL_USER,
      GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? "***" : "NOT SET"
    });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.to)) {
      return { 
        success: false, 
        error: "Invalid email address format" 
      };
    }

    try {
      // Create Gmail transporter with simpler configuration
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      };

      console.log("Attempting to send email...");
      const result = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result);
      return { success: true, id: result.messageId };
    } catch (error) {
      console.error("Failed to send email:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
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
      }
      
      return { success: false, error: errorMessage };
    }
  },
});
