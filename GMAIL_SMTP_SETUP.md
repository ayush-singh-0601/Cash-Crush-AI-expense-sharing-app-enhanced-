# Gmail SMTP Setup Guide

## Why Gmail SMTP?
- **Completely free**: 500 emails/day limit
- **No domain required**: Uses your Gmail account
- **Reliable**: Gmail's infrastructure
- **Simple setup**: No API keys needed

## Setup Steps

### 1. Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

### 2. Generate App Password
1. Go to Google Account settings
2. Navigate to Security → 2-Step Verification
3. Scroll down to "App passwords"
4. Click "Generate app password"
5. Select "Mail" and your device
6. Copy the 16-character password

### 3. Environment Variables
Add these to your `.env` file:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

### 4. Install Dependencies
```bash
npm install nodemailer
npm uninstall @sendgrid/mail resend
```

### 5. Code Changes Made
✅ **Updated `convex/email.js`** - Now uses Gmail SMTP with Node.js runtime
✅ **Updated `lib/inngest/client.js`** - Removed SendGrid, added nodemailer
✅ **Updated `lib/inngest/payment-reminders.js`** - Removed API key parameter
✅ **Updated `lib/inngest/spending-insights.js`** - Removed API key parameter
✅ **Updated `package.json`** - Replaced SendGrid with nodemailer
✅ **Added Node.js runtime** - Fixed nodemailer compatibility issues

## Important: Node.js Runtime

The email functions now use the Node.js runtime (`"use node"` directive) because:
- Nodemailer requires Node.js built-in modules (stream, crypto)
- Convex functions need explicit Node.js runtime for these modules
- This ensures compatibility with Gmail SMTP

## Testing Your Setup

### 1. Test Email Function
```javascript
// Test in your app
await convex.action(api.testEmail.testEmail, {
  to: "test@example.com"
});
```

### 2. Check Gmail Settings
- Make sure "Less secure app access" is OFF
- Use App Password, not your regular password
- Check Gmail's "Sent" folder to verify emails

## Troubleshooting

### Common Issues:

1. **"Invalid login" error**
   - Make sure you're using App Password, not regular password
   - Ensure 2FA is enabled

2. **"Authentication failed"**
   - Double-check your Gmail username and App Password
   - Make sure the App Password is for "Mail" service

3. **"Could not resolve stream/crypto" error**
   - ✅ **FIXED**: Added `"use node"` directive to email functions
   - This was a Convex runtime compatibility issue

4. **Emails not sending**
   - Check your internet connection
   - Verify Gmail account is not suspended
   - Check daily email limits (500/day)

5. **Emails going to spam**
   - This is normal for new Gmail accounts
   - Recipients should mark as "Not Spam"
   - Consider using a dedicated Gmail account for your app

## Security Best Practices

1. **Use App Passwords**: Never use your regular Gmail password
2. **Environment Variables**: Store credentials in `.env` file
3. **Rate Limiting**: Respect Gmail's 500 emails/day limit
4. **Monitoring**: Check Gmail's "Sent" folder regularly

## Production Considerations

1. **Dedicated Gmail Account**: Create a separate Gmail account for your app
2. **Domain Verification**: Consider verifying your domain with Gmail
3. **Monitoring**: Set up alerts for email failures
4. **Backup Plan**: Consider having a backup email service

## Alternative Gmail Setup (if needed)

If you prefer to use a different Gmail account or have issues:

```javascript
// In convex/email.js
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});
```

## Migration Complete!

Your app now uses Gmail SMTP instead of Resend/SendGrid. The email functionality will work exactly the same:
- Payment reminders
- Spending insights
- Any other email features

Just make sure to set up your Gmail App Password and environment variables! 