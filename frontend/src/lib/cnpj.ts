import { onlyDigits } from '@/lib/format'

const LENGTH = 14
const FIRST_CHECK_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const SECOND_CHECK_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

function checkDigit(digits: string, weights: number[]): number {
  const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0)
  const remainder = sum % 11

  return remainder < 2 ? 0 : 11 - remainder
}

export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value)

  if (digits.length !== LENGTH) {
    return false
  }
  if (new Set(digits).size === 1) {
    return false
  }

  return (
    checkDigit(digits, FIRST_CHECK_WEIGHTS) === Number(digits[12])
    && checkDigit(digits, SECOND_CHECK_WEIGHTS) === Number(digits[13])
  )
}
