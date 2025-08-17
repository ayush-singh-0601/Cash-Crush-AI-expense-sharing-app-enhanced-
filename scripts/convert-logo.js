// Simple script to convert your logo to base64
const fs = require('fs');
const path = require('path');

function convertLogoToBase64() {
  try {
    // Path to your logo
    const logoPath = path.join(__dirname, '..', 'public', 'Gemini_Generated_Image_njpic8njpic8njpi.png');
    
    console.log('Looking for logo at:', logoPath);
    
    // Check if file exists
    if (!fs.existsSync(logoPath)) {
      console.error('❌ Logo file not found at:', logoPath);
      console.log('Please make sure your logo file is in the public folder');
      return;
    }
    
    // Read and convert to base64
    const imageBuffer = fs.readFileSync(logoPath);
    const base64String = imageBuffer.toString('base64');
    const dataUri = `data:image/png;base64,${base64String}`;
    
    console.log('✅ Logo converted successfully!');
    console.log('📋 Copy this base64 string:');
    console.log('─'.repeat(50));
    console.log(dataUri);
    console.log('─'.repeat(50));
    
    // Also save to a file for easy copying
    const outputPath = path.join(__dirname, 'logo-base64.txt');
    fs.writeFileSync(outputPath, dataUri);
    console.log(`💾 Base64 string also saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error converting logo:', error.message);
  }
}

// Run the conversion
convertLogoToBase64();
