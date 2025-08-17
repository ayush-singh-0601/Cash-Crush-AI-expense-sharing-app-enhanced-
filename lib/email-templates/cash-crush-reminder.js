// Cash Crush Email Template - Professional reminder template similar to Splitwise
export const createCashCrushReminderTemplate = ({
  recipientName,
  senderName,
  amount,
  description,
  isGroup = false,
  groupName = '',
  reminderType = 'normal',
  logoBase64 = null // Optional base64 logo data
}) => {
  const formatAmount = (amt) => `₹${parseFloat(amt).toFixed(2)}`;
  
  // Use provided base64 logo or fallback to emoji
  const logoSrc = logoBase64;
  
  // Cash Crush brand colors and styling
  const brandColor = '#10B981'; // Emerald green
  const darkBg = '#1F2937';
  const lightBg = '#F9FAFB';
  
  const baseTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Reminder - Cash Crush</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f5f5f5;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, ${brandColor} 0%, #059669 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .logo {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          font-size: 32px;
          font-weight: bold;
        }
        .logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 16px;
        }
        .brand-name {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .tagline {
          font-size: 14px;
          opacity: 0.9;
          margin: 5px 0 0 0;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          color: #374151;
          margin-bottom: 20px;
        }
        .message {
          font-size: 16px;
          color: #6B7280;
          margin-bottom: 30px;
          line-height: 1.7;
        }
        .amount-card {
          background: ${lightBg};
          border: 2px solid ${brandColor};
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          margin: 30px 0;
        }
        .amount {
          font-size: 36px;
          font-weight: 800;
          color: ${brandColor};
          margin: 0;
        }
        .amount-label {
          font-size: 14px;
          color: #6B7280;
          margin-top: 5px;
        }
        .description {
          background: #F3F4F6;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid ${brandColor};
        }
        .description-label {
          font-size: 12px;
          color: #6B7280;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 5px;
        }
        .description-text {
          font-size: 14px;
          color: #374151;
          margin: 0;
        }
        .cta-button {
          display: inline-block;
          background: ${brandColor};
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          transition: all 0.2s;
        }
        .cta-button:hover {
          background: #059669;
          transform: translateY(-1px);
        }
        .footer {
          background: ${darkBg};
          padding: 30px;
          text-align: center;
          color: #9CA3AF;
        }
        .footer-message {
          font-size: 14px;
          margin-bottom: 20px;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-link {
          display: inline-block;
          margin: 0 10px;
          color: #6B7280;
          text-decoration: none;
        }
        .divider {
          height: 1px;
          background: #E5E7EB;
          margin: 30px 0;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 8px;
          }
          .header, .content, .footer {
            padding: 20px;
          }
          .amount {
            font-size: 28px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo">
            ${logoSrc ? `<img src="${logoSrc}" alt="Cash Crush Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 16px;" />` : '💰'}
          </div>
          <h1 class="brand-name">Cash Crush</h1>
          <p class="tagline">Smart expense sharing made simple</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <div class="greeting">Hi ${recipientName},</div>
          
          ${getMessageContent(reminderType, senderName, isGroup, groupName)}
          
          <!-- Amount Card -->
          <div class="amount-card">
            <div class="amount">${formatAmount(amount)}</div>
            <div class="amount-label">${isGroup ? 'Group balance' : 'Amount owed'}</div>
          </div>
          
          ${description ? `
          <div class="description">
            <div class="description-label">What this is for</div>
            <p class="description-text">${description}</p>
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <div style="text-align: center;">
            <a href="#" class="cta-button">Visit Cash Crush now</a>
          </div>
          
          <p style="font-size: 14px; color: #6B7280; text-align: center; margin-top: 20px;">
            ${getFooterMessage(reminderType)}
          </p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p class="footer-message">Have a great day! –The Cash Crush Team</p>
          
          <div class="social-links">
            <a href="#" class="social-link">Help Center</a>
            <a href="#" class="social-link">Privacy Policy</a>
            <a href="#" class="social-link">Unsubscribe</a>
          </div>
          
          <p style="font-size: 12px; margin-top: 20px;">
            This email was sent by Cash Crush. If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return baseTemplate;
};

function getMessageContent(reminderType, senderName, isGroup, groupName) {
  switch (reminderType) {
    case 'urgent':
      return `
        <div class="message">
          <strong>This is an urgent reminder!</strong><br>
          ${senderName} has been waiting for this payment${isGroup ? ` from the ${groupName} group` : ''}. 
          Please settle this balance as soon as possible to keep things smooth between friends.
        </div>
      `;
    
    case 'funny':
      return `
        <div class="message">
          ${senderName} is wondering where their money went! 🕵️‍♂️<br><br>
          Did it go on a vacation without telling anyone? Did it join a witness protection program? 
          We may never know, but we do know it needs to come back home${isGroup ? ` to settle the ${groupName} group balance` : ''}! 😄
        </div>
      `;
    
    case 'polite':
      return `
        <div class="message">
          ${senderName} wanted to send you a gentle reminder about your outstanding balance${isGroup ? ` in the ${groupName} group` : ''}. 
          No rush at all – just wanted to make sure it didn't slip through the cracks! 
          Settle up whenever it's convenient for you.
        </div>
      `;
    
    default: // normal
      return `
        <div class="message">
          You have an outstanding balance${isGroup ? ` in the ${groupName} group` : ` with ${senderName}`}. 
          Here's a friendly reminder to help keep track of your shared expenses.
        </div>
      `;
  }
}

function getFooterMessage(reminderType) {
  switch (reminderType) {
    case 'urgent':
      return 'Thanks for taking care of this quickly! Your friends appreciate it.';
    case 'funny':
      return 'Remember: Friends don\'t let friends forget about money! 💸';
    case 'polite':
      return 'Thanks for being awesome about settling up! 🌟';
    default:
      return 'Thanks for using Cash Crush to keep track of shared expenses!';
  }
}

// Export different reminder types
export const reminderTypes = {
  normal: 'Friendly Reminder',
  urgent: 'Urgent Reminder', 
  funny: 'Funny Reminder',
  polite: 'Polite Reminder'
};
