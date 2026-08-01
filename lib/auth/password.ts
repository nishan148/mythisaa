export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_REQUIREMENTS =
  "Use 8+ characters with uppercase, lowercase, a number, and a symbol.";

const PASSWORD_SYMBOL = /[!@#$%^&*()_+\-=\[\]{};'\\:"|<>?,./`~]/;

export function validatePassword(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) return PASSWORD_REQUIREMENTS;
  if (!/[a-z]/.test(password)) return PASSWORD_REQUIREMENTS;
  if (!/[A-Z]/.test(password)) return PASSWORD_REQUIREMENTS;
  if (!/[0-9]/.test(password)) return PASSWORD_REQUIREMENTS;
  if (!PASSWORD_SYMBOL.test(password)) return PASSWORD_REQUIREMENTS;

  return null;
}