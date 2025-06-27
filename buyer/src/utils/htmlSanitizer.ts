/**
 * Sanitizes HTML content and fixes relative URLs to be absolute
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string with fixed URLs
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Replace relative URLs with absolute URLs
  // This regex finds href attributes that don't start with http, https, mailto, or #
  const fixedHtml = html.replace(
    /href=["'](?!(?:https?:|mailto:|#))([^"']+)["']/gi,
    (match, url) => {
      // If the URL doesn't start with http/https, add https://
      const cleanUrl = url.trim();
      if (cleanUrl.startsWith('//')) {
        return `href="https:${cleanUrl}"`;
      } else if (!cleanUrl.startsWith('http') && !cleanUrl.startsWith('mailto:')) {
        return `href="https://${cleanUrl}"`;
      }
      return match;
    }
  );

  // Ensure all links open in new tab for security
  const secureHtml = fixedHtml.replace(
    /<a\s+([^>]*href=["'][^"']*["'][^>]*)>/gi,
    (match, attributes) => {
      // Add target="_blank" and rel="noopener noreferrer" if not already present
      if (!attributes.includes('target=')) {
        attributes += ' target="_blank"';
      }
      if (!attributes.includes('rel=')) {
        attributes += ' rel="noopener noreferrer"';
      } else if (!attributes.includes('noopener')) {
        attributes = attributes.replace(/rel=["']([^"']*)["']/i, 'rel="$1 noopener noreferrer"');
      }
      return `<a ${attributes}>`;
    }
  );

  return secureHtml;
}