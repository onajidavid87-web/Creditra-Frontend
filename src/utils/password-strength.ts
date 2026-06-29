// utils/password-strength.ts

import { PasswordStrength } from '@/types/auth.types'

/**
 * Calculates a coarse-grained password strength rating from a raw password.
 *
 * The score is the sum of small heuristics: length >= 8, length >= 12, the
 * presence of lowercase, uppercase, digits, and non-alphanumeric characters.
 * Empty passwords are reported as `weak` rather than throwing.
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) return 'weak'
  
  let score = 0
  
  // Length check
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  
  // Character variety checks
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  
  if (score <= 2) return 'weak'
  if (score <= 4) return 'medium'
  return 'strong'
}

/**
 * Map a password strength rating to a Tailwind background utility class
 * used for the strength meter fill.
 */
export function getPasswordStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'bg-red-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'strong':
      return 'bg-green-500'
  }
}

/**
 * Map a password strength rating to a short, user-facing label that
 * accompanies the strength meter.
 */
export function getPasswordStrengthText(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'Weak password'
    case 'medium':
      return 'Medium strength'
    case 'strong':
      return 'Strong password'
  }
}