/**
 * Input validation utilities for frontend
 * Matches backend validation for consistency
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface MultiValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  if (typeof email !== 'string') {
    return { isValid: false, error: 'Email must be a string' };
  }

  email = email.trim();
  if (!email) {
    return { isValid: false, error: 'Email cannot be empty' };
  }

  if (email.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
export function validatePassword(password: string): ValidationResult {
  if (typeof password !== 'string') {
    return { isValid: false, error: 'Password must be a string' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one digit' };
  }

  if (!/[^\w\s]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }

  return { isValid: true };
}

/**
 * Validate display name
 * Requirements:
 * - 2-100 characters
 * - Only letters, numbers, spaces, hyphens
 */
export function validateDisplayName(name: string): ValidationResult {
  if (typeof name !== 'string') {
    return { isValid: false, error: 'Display name must be a string' };
  }

  name = name.trim();
  if (name.length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters' };
  }

  if (name.length > 100) {
    return { isValid: false, error: 'Display name must be 100 characters or less' };
  }

  const nameRegex = /^[a-zA-Z0-9\s\-']+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, error: 'Display name can only contain letters, numbers, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true };
}

/**
 * Validate bankroll amount
 * Requirements:
 * - Non-negative number
 * - Maximum $1,000,000
 */
export function validateBankroll(amount: number): ValidationResult {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { isValid: false, error: 'Bankroll must be a valid number' };
  }

  if (amount < 0) {
    return { isValid: false, error: 'Bankroll cannot be negative' };
  }

  if (amount > 1_000_000) {
    return { isValid: false, error: 'Bankroll exceeds maximum allowed ($1,000,000)' };
  }

  return { isValid: true };
}

/**
 * Validate betting odds (American format)
 */
export function validateOdds(odds: number): ValidationResult {
  if (typeof odds !== 'number' || isNaN(odds)) {
    return { isValid: false, error: 'Odds must be a valid number' };
  }

  if (!(-1000 <= odds && odds <= 10000)) {
    return { isValid: false, error: 'Odds must be between -1000 and 10000' };
  }

  if (odds === 0) {
    return { isValid: false, error: 'Odds cannot be zero' };
  }

  return { isValid: true };
}

/**
 * Sanitize and limit string input
 */
export function sanitizeString(text: string, maxLength: number = 500): string {
  if (typeof text !== 'string') {
    return '';
  }

  // Remove leading/trailing whitespace
  text = text.trim();

  // Limit length
  text = text.substring(0, maxLength);

  // Remove control characters (0-31 and 127) without regex
  let cleaned = '';
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code >= 32 && code !== 127) {
      cleaned += text[i];
    }
  }

  text = cleaned;

  return text;
}

/**
 * Validate complete signup data
 */
export function validateSignupData(
  email: string,
  password: string,
  displayName: string
): MultiValidationResult {
  const errors: string[] = [];

  const emailResult = validateEmail(email);
  if (!emailResult.isValid) {
    errors.push(emailResult.error!);
  }

  const passwordResult = validatePassword(password);
  if (!passwordResult.isValid) {
    errors.push(passwordResult.error!);
  }

  const nameResult = validateDisplayName(displayName);
  if (!nameResult.isValid) {
    errors.push(nameResult.error!);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate bet placement data
 */
export function validateBetData(
  gameId: string,
  side: 'fav' | 'dog',
  amount: number,
  odds: number
): MultiValidationResult {
  const errors: string[] = [];

  if (typeof gameId !== 'string' || !gameId) {
    errors.push('Invalid game ID');
  }

  if (side !== 'fav' && side !== 'dog') {
    errors.push("Side must be either 'fav' or 'dog'");
  }

  const amountResult = validateBankroll(amount);
  if (!amountResult.isValid) {
    errors.push(`Invalid bet amount: ${amountResult.error}`);
  }

  const oddsResult = validateOdds(odds);
  if (!oddsResult.isValid) {
    errors.push(`Invalid odds: ${oddsResult.error}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
