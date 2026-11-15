/**
 * Normalises a Swiss mobile number to E.164 (+417XXXXXXXX).
 * Accepts "+41 79 123 45 67", "0041791234567", "079 123 45 67", "41791234567".
 * Only mobile ranges (075–079) are accepted because landlines cannot receive SMS.
 */
export function normalizeSwissMobile(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  else if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `41${digits.slice(1)}`;

  if (!/^\d+$/.test(digits)) return null;
  if (!digits.startsWith('41')) return null;

  const national = digits.slice(2).replace(/^0/, '');
  return /^7[5-9]\d{7}$/.test(national) ? `+41${national}` : null;
}

export function maskPhone(phone: string): string {
  return phone.length === 12 ? `+41 ${phone.slice(3, 5)} ••• •• ${phone.slice(-2)}` : phone;
}
