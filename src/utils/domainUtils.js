// Domain utilities for tab organization
export const SUPPORTED_COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];
export const TLD_PATTERN = /\.(com|org|net|io|edu|gov|co|me|app|dev|us)(\.[a-z]{2})?$/;

/**
 * Extract the main domain name from a hostname
 * @param {string} hostname - The hostname to extract domain from
 * @returns {string} The main domain name
 */
export function getMainDomain(hostname) {
  try {
    const withoutTld = hostname.replace(TLD_PATTERN, '');
    const parts = withoutTld.split('.');
    return parts[parts.length - 1];
  } catch (error) {
    console.error('Error extracting domain:', error);
    return hostname;
  }
}

/**
 * Capitalize the first letter of a string
 * @param {string} string - The string to capitalize
 * @returns {string} The capitalized string
 */
export function capitalizeFirstLetter(string) {
  return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
}

/**
 * Get a random available color for tab groups
 * @param {Set} usedColors - Set of already used colors
 * @returns {string} A random available color
 */
export function getRandomAvailableColor(usedColors) {
  const availableColors = SUPPORTED_COLORS.filter(color => !usedColors.has(color));
  if (availableColors.length === 0) {
    return SUPPORTED_COLORS[Math.floor(Math.random() * SUPPORTED_COLORS.length)];
  }
  const selectedColor = availableColors[Math.floor(Math.random() * availableColors.length)];
  usedColors.add(selectedColor);
  return selectedColor;
}

/**
 * Check if a URL should be skipped from organization
 * @param {string} url - The URL to check
 * @returns {boolean} True if the URL should be skipped
 */
export function shouldSkipUrl(url) {
  return !url || 
         url.startsWith('chrome://') || 
         url.startsWith('edge://') || 
         url.startsWith('about:') ||
         url.startsWith('moz-extension:') ||
         url.startsWith('chrome-extension:');
} 