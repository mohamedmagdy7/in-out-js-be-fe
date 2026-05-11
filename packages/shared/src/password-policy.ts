export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// Single source of truth for the create-password policy.
// Used on both sides — server-side validation in zod schemas and
// client-side validation in forms.
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[\S]{8,128}$/;

export const PASSWORD_REQUIREMENTS =
  "Must be 8+ characters with an uppercase letter, a lowercase letter, a number, and a special character.";

/**
 * Validate a candidate password. Returns null when it passes,
 * otherwise a short human-friendly error message describing the first
 * unmet rule. Use this for create / reset flows, NOT for login —
 * login validates against the stored hash, not the policy.
 */
export function validatePassword(value: string): string | null {
  if (typeof value !== "string" || value.length === 0) {
    return "Password is required";
  }
  if (/\s/.test(value)) {
    return "Password must not contain spaces";
  }
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Must be at most ${PASSWORD_MAX_LENGTH} characters`;
  }
  if (!/[a-z]/.test(value)) {
    return "Must include a lowercase letter";
  }
  if (!/[A-Z]/.test(value)) {
    return "Must include an uppercase letter";
  }
  if (!/\d/.test(value)) {
    return "Must include a number";
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    return "Must include a special character";
  }
  return null;
}
