/**
 * Formats a file size in bytes to a human-readable string.
 * Uses standard decimal/binary units with localized Brazilian Portuguese formatting.
 *
 * @param {number|null|undefined} bytes - File size in bytes
 * @param {number} [decimals=1] - Number of decimal places
 * @returns {string} e.g. "0 B", "373 KB", "1.3 MB", "25 MB"
 */
export function formatFileSize(bytes, decimals = 1) {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes <= 0) {
    return '0 B';
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unitIndex = Math.min(i, sizes.length - 1);
  const value = bytes / Math.pow(k, unitIndex);

  // If value has no decimal part or is whole integer, avoid trailing zeroes like .0
  const formatted =
    value % 1 === 0 ? value.toFixed(0) : parseFloat(value.toFixed(dm)).toString();

  return `${formatted} ${sizes[unitIndex]}`;
}

/**
 * Returns a category identifier for a file based on MIME type or extension.
 *
 * @param {File|Object} file
 * @returns {'image' | 'pdf' | 'spreadsheet' | 'document' | 'archive' | 'generic'}
 */
export function getFileCategory(file) {
  if (!file) return 'generic';
  const type = file.type || '';
  const name = file.name || '';
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (
    type.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)
  ) {
    return 'image';
  }
  if (type === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  if (
    type.includes('spreadsheet') ||
    type.includes('excel') ||
    type === 'text/csv' ||
    ['csv', 'xlsx', 'xls'].includes(ext)
  ) {
    return 'spreadsheet';
  }
  if (
    type.includes('word') ||
    type.includes('document') ||
    ['doc', 'docx', 'txt', 'rtf'].includes(ext)
  ) {
    return 'document';
  }
  if (
    type.includes('zip') ||
    type.includes('tar') ||
    type.includes('compressed') ||
    ['zip', 'rar', '7z', 'gz'].includes(ext)
  ) {
    return 'archive';
  }
  return 'generic';
}
