import { Inngest } from "inngest";
import nodemailer from "nodemailer";

export const inngest = new Inngest({
  id: "cashcrush",
  name: "Cash Crush",
});

// Create Gmail transporter with more robust configuration
export const gmailTransporter = nodemailer.createTransport({
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
