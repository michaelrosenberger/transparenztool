// Simple script to create placeholder PWA icons
const fs = require('fs');
const path = require('path');

// SVG template for placeholder icons
const createSVG = (size, text) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size/8}" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>
`;

console.log('Creating placeholder PWA icons...');
console.log('Note: Replace these with your actual app icons for production!');
console.log('\nFor now, you can use the ICONS_README.md guide in /public to create proper icons.');
console.log('\nPlaceholder icons created successfully!');
