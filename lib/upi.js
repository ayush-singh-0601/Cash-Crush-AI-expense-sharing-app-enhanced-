/**
 * UPI utilities for payment integration
 */

/**
 * Generates a UPI payment URL
 * @param {Object} params - Payment parameters
 * @param {string} params.pa - The UPI ID (Payment Address) to send payment to
 * @param {string} params.pn - The name of the recipient (Payee Name)
 * @param {number|string} params.am - The payment amount
 * @param {string} params.cu - Currency (default: INR)
 * @param {string} params.tn - Transaction note
 * @returns {string} - The UPI payment URL
 */
export function generateUpiPaymentUrl(params) {
  // Support both new object format and legacy parameter format
  if (typeof params === 'string') {
    // Legacy format: generateUpiPaymentUrl(upiId, name, amount, note)
    const upiId = arguments[0];
    const name = arguments[1];
    const amount = arguments[2];
    const note = arguments[3] || "Settlement";
    
    return generateUpiPaymentUrl({
      pa: upiId,
      pn: name,
      am: amount,
      tn: note
    });
  }
  
  // New object format
  const { pa, pn, am, cu = "INR", tn = "Settlement" } = params;
  
  if (!am) return "";
  
  // Ensure amount is properly formatted
  const formattedAmount = parseFloat(am).toFixed(2);
  
  if (pa) {
    // Format with UPI ID: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
    return `upi://pay?pa=${pa}&pn=${encodeURIComponent(pn || "")}&am=${formattedAmount}&cu=${cu}&tn=${encodeURIComponent(tn)}`;
  } else {
    // Format without UPI ID: upi://pay?am=AMOUNT&cu=INR&tn=NOTE
    // This will open the UPI app and let the user enter the UPI ID manually
    return `upi://pay?am=${formattedAmount}&cu=${cu}&tn=${encodeURIComponent(tn + (pn ? " to " + pn : ""))}`;
  }
}

/**
 * Validates a UPI ID format
 * @param {string} upiId - The UPI ID to validate
 * @returns {boolean} - Whether the UPI ID is valid
 */
export function isValidUpiId(upiId) {
  if (!upiId) return false;
  
  // Basic UPI ID validation: username@provider
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  return upiRegex.test(upiId);
}

/**
 * Formats a UPI ID for display
 * @param {string} upiId - The UPI ID to format
 * @returns {string} - The formatted UPI ID
 */
export function formatUpiId(upiId) {
  if (!upiId) return "";
  
  // If the UPI ID is too long, truncate it for display
  if (upiId.length > 25) {
    const [username, provider] = upiId.split("@");
    if (username && provider) {
      const truncatedUsername = username.length > 15 
        ? `${username.substring(0, 12)}...` 
        : username;
      return `${truncatedUsername}@${provider}`;
    }
  }
  
  return upiId;
}