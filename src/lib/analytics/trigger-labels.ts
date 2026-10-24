export function triggerLabel(trigger?: string | null): string {
  if (!trigger) return "Unknown";
  switch (trigger.toLowerCase()) {
    case "qr":
      return "QR Code";
    case "direct":
      return "Direct";
    case "link":
      return "Short Link";
    default:
      return trigger.charAt(0).toUpperCase() + trigger.slice(1);
  }
}
