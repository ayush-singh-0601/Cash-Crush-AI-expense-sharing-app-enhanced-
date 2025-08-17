# Email Setup Guide - Fix Send Reminder Buttons

## Problem
The "Send Reminder" buttons on the group page and personal page are not working because the email service is not configured.

## Solution
You need to set up Gmail SMTP by following these steps:

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to Security
3. Enable 2-Step Verification

### Step 2: Generate App Password
1. Go to Google Account settings
2. Navigate to Security → 2-Step Verification
3. Scroll down to "App passwords"
4. Click "Generate app password"
5. Select "Mail" and your device
6. Copy the 16-character password

### Step 3: Create Environment File
1. In your project root directory, create a file called `.env.local`
2. Add these lines to the file:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```
3. Replace the values with your actual Gmail credentials

### Step 4: Restart Your Development Server
1. Stop your current development server (Ctrl+C)
2. Run `npm run dev` again

## Example .env.local file:
```env
GMAIL_USER=myapp@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

## Important Notes:
- Use your Gmail address (not username)
- Use the App Password (16 characters), NOT your regular Gmail password
- Make sure there are no spaces around the `=` sign
- The `.env.local` file should be in your project root directory
- Never commit this file to version control (it's already in .gitignore)

## Testing
After setup, try clicking the "Send Reminder" button again. You should see:
1. A dialog opens with reminder options
2. You can select reminder type (Normal, Urgent, Funny)
3. Add custom messages if desired
4. Click "Send Reminder" to send the email

## Troubleshooting
If you still have issues:
1. Check the browser console for error messages
2. Verify your Gmail credentials are correct
3. Make sure 2FA is enabled on your Google account
4. Ensure you're using an App Password, not your regular password
5. Check that the `.env.local` file is in the correct location

## Security
- The `.env.local` file is automatically ignored by Git
- Your Gmail credentials are stored locally only
- App Passwords are more secure than regular passwords
- You can revoke App Passwords anytime from your Google Account
