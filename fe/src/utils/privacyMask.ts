/**
 * Mask a phone number: 0901234567 → 090***567
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.length < 7) return phone;
  return `${cleaned.slice(0, 3)}***${cleaned.slice(-3)}`;
}

/**
 * Mask an email: john.doe@gmail.com → joh***@gmail.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const atIdx = email.indexOf("@");
  if (atIdx < 1) return email;
  const localPart = email.slice(0, atIdx);
  const domain = email.slice(atIdx);
  if (localPart.length <= 3) {
    return `${localPart.charAt(0)}***${domain}`;
  }
  return `${localPart.slice(0, 3)}***${domain}`;
}

/**
 * Conditionally mask phone based on workstation settings
 */
export function displayPhone(
  phone: string | null | undefined,
  maskedPhone: string | null | undefined,
  hidePhoneNumber: boolean
): string {
  if (hidePhoneNumber) {
    return maskedPhone || maskPhone(phone);
  }
  return phone || maskedPhone || "—";
}

/**
 * Conditionally mask email based on workstation settings
 */
export function displayEmail(
  email: string | null | undefined,
  maskedEmail: string | null | undefined,
  hideEmail: boolean
): string {
  if (hideEmail) {
    return maskedEmail || maskEmail(email);
  }
  return email || maskedEmail || "—";
}
