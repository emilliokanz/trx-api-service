export default function generateReferenceId() {
  // Get the current date and time in YYYYMMDDHHmmss format
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'), // Months are zero-based
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');

  // Generate an 8-digit random alphanumeric string
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();

  // Combine the date part and random part
  return `${datePart}${randomPart}`;
}
