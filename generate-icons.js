const fs = require('fs');
const path = require('path');

// SVG content for the UniQVerse icon
const svgContent = `<svg width="SIZE" height="SIZE" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Gradient Definitions -->
  <defs>
    <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8B5CF6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#EC4899;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F59E0B;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#EF4444;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background Circle -->
  <circle cx="256" cy="256" r="240" fill="url(#mainGradient)" stroke="#FFFFFF" stroke-width="8"/>
  
  <!-- Letter "U" -->
  <path d="M170 180 L170 280 C170 320 200 350 240 350 L272 350 C312 350 342 320 342 280 L342 180" 
        stroke="#FFFFFF" stroke-width="24" stroke-linecap="round" fill="none"/>
  
  <!-- Unique diamond accent -->
  <polygon points="256,120 280,144 256,168 232,144" fill="url(#accentGradient)"/>
  
  <!-- Three dots representing uniqueness/variety -->
  <circle cx="200" cy="380" r="8" fill="#FFFFFF"/>
  <circle cx="256" cy="390" r="8" fill="#FFFFFF"/>
  <circle cx="312" cy="380" r="8" fill="#FFFFFF"/>
  
  <!-- Subtle shine effect -->
  <ellipse cx="200" cy="200" rx="40" ry="80" fill="#FFFFFF" opacity="0.2" transform="rotate(-30 200 200)"/>
</svg>`;

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG files for each size (browsers can render these efficiently)
iconSizes.forEach(size => {
  const sizedSvgContent = svgContent.replace(/SIZE/g, size.toString());
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, sizedSvgContent);
  console.log(`Created ${filename}`);
});

// Also create a general favicon.ico placeholder note
const readmeContent = `# UniQVerse Icons

This directory contains the PWA icons for UniQVerse.

## Icon Sizes Generated:
${iconSizes.map(size => `- ${size}x${size} - icon-${size}x${size}.svg`).join('\n')}

## To generate PNG files from SVG:
You can use online converters or tools like:
1. GIMP (open SVG, export as PNG)
2. Inkscape command line
3. Online SVG to PNG converters
4. ImageMagick: convert icon.svg -resize 192x192 icon-192x192.png

## Colors Used:
- Primary Gradient: #6366F1 → #8B5CF6 → #EC4899
- Accent Gradient: #F59E0B → #EF4444
- White: #FFFFFF
`;

fs.writeFileSync(path.join(iconsDir, 'README.md'), readmeContent);

console.log('✅ All icon files generated successfully!');
console.log('📁 Location:', iconsDir);
console.log('📝 Generated README.md with instructions');
