const { isValidUrl, isValidImageUrl, validateUrl } = require('../utils/urlValidator');

// Test isValidUrl function
console.log('Testing isValidUrl function:');
console.log('Valid URL (http): ', isValidUrl('http://example.com'));
console.log('Valid URL (https): ', isValidUrl('https://example.com/image.jpg'));
console.log('Valid URL (with query): ', isValidUrl('https://example.com/image?size=large'));
console.log('Invalid URL (no protocol): ', isValidUrl('example.com'));
console.log('Invalid URL (empty): ', isValidUrl(''));
console.log('Invalid URL (null): ', isValidUrl(null));

// Test isValidImageUrl function
console.log('\nTesting isValidImageUrl function:');
console.log('Valid image URL (jpg): ', isValidImageUrl('https://example.com/image.jpg'));
console.log('Valid image URL (png): ', isValidImageUrl('https://example.com/image.png'));
console.log('Valid image URL (webp): ', isValidImageUrl('https://example.com/image.webp'));
console.log('Valid image URL (with query): ', isValidImageUrl('https://example.com/image.jpg?size=large'));
console.log('Valid image URL (no extension): ', isValidImageUrl('https://example.com/image?format=jpg'));
console.log('Valid image URL (placeholder): ', isValidImageUrl('https://placehold.co/600x400'));
console.log('Valid image URL (placeholder with format): ', isValidImageUrl('https://placehold.co/600x400.png'));
console.log('Valid image URL (dimensions in path): ', isValidImageUrl('https://example.com/300x200'));
console.log('Valid image URL (known service): ', isValidImageUrl('https://cloudinary.com/image'));
console.log('Invalid image URL (html): ', isValidImageUrl('https://example.com/page.html'));
console.log('Invalid image URL (no protocol): ', isValidImageUrl('example.com/image.jpg'));

// Test validateUrl function
console.log('\nTesting validateUrl function:');
const validUrl = 'https://example.com/image.jpg';
const invalidUrl = 'example.com';
const validNonImageUrl = 'https://example.com/page.html';
const placeholderUrl = 'https://placehold.co/600x400';
const emptyUrl = '';

console.log(`Valid URL (${validUrl}): "${validateUrl(validUrl)}"`);
console.log(`Invalid URL (${invalidUrl}): "${validateUrl(invalidUrl)}"`);
console.log(`Valid URL, require image=true (${validUrl}): "${validateUrl(validUrl, true)}"`);
console.log(`Valid URL but not image, require image=true (${validNonImageUrl}): "${validateUrl(validNonImageUrl, true)}"`);
console.log(`Placeholder URL (${placeholderUrl}): "${validateUrl(placeholderUrl)}"`);
console.log(`Placeholder URL, require image=true (${placeholderUrl}): "${validateUrl(placeholderUrl, true)}"`);
console.log(`Empty URL (${emptyUrl}): "${validateUrl(emptyUrl)}"`);

// Debug the validateUrl function
console.log('\nDebugging validateUrl function:');
console.log('isValidUrl(validUrl):', isValidUrl(validUrl));
console.log('isValidImageUrl(validUrl):', isValidImageUrl(validUrl));
console.log('isValidUrl(invalidUrl):', isValidUrl(invalidUrl));
console.log('isValidImageUrl(validNonImageUrl):', isValidImageUrl(validNonImageUrl));
console.log('isValidUrl(placeholderUrl):', isValidUrl(placeholderUrl));
console.log('isValidImageUrl(placeholderUrl):', isValidImageUrl(placeholderUrl));
