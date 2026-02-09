export function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  /*
   * Handle negative or zero bytes explicitly if desired, though the loop handles it gracefully.
   * For file sizes, it's typically expected to be non-negative.
   */
  if (bytes < 0) {
    /*
     * Or throw an error, or return 'Invalid Size', depending on requirements.
     * For now, let's process its absolute value and then add the sign back if needed,
     * or just let it proceed, which results in "-X.Y B".
     * For this simple fix, we'll assume the current behavior for negative is acceptable,
     * or if we strictly mean "file size", it implies non-negative.
     * Given no specific instruction, the current logic for negative numbers is consistent.
     */
  }

  /*
   * If bytes is 0, the loop won't run, and it will correctly return "0.0 B"
   * If bytes is negative, size will remain negative, and it will return "-X.Y B".
   */

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // Ensure 1 decimal place.
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
