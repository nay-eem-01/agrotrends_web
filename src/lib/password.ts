/**
 * How strong a password looks, 0–4: one point each for 8 or more characters, a capital letter, a number and a symbol
 * (the backend's own rule asks for all four). For the bar under the sign-up field; the backend still decides.
 */
export function passwordStrength(password: string): number {
  if (!password) return 0
  return [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length
}
