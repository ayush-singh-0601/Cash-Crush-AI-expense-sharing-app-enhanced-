// Utility to convert image to base64 for email embedding
import fs from 'fs';
import path from 'path';

export function getLogoAsBase64() {
  try {
    // Path to your logo image
    const logoPath = path.join(process.cwd(), 'public', 'Gemini_Generated_Image_njpic8njpic8njpi.png');
    
    // Check if file exists
    if (!fs.existsSync(logoPath)) {
      console.warn('Logo file not found, using emoji fallback');
      return null;
    }
    
    // Read the image file
    const imageBuffer = fs.readFileSync(logoPath);
    
    // Convert to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Return as data URI
    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    console.error('Error converting logo to base64:', error);
    return null;
  }
}

// Alternative: You can manually paste your base64 string here if the file reading doesn't work
export const LOGO_BASE64_FALLBACK = null; // Paste your base64 string here if needed
