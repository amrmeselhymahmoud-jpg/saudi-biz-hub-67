/**
 * Utility functions for safe formatting of values
 */

/**
 * Safely format a number with toLocaleString
 * @param value - The value to format (can be number, string, null, or undefined)
 * @param locale - The locale to use (default: 'ar-SA')
 * @param options - Intl.NumberFormatOptions
 * @returns Formatted string or default value
 */
export function safeToLocaleString(
  value: number | string | null | undefined,
  locale: string = 'ar-SA',
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '0';
  }

  return numValue.toLocaleString(locale, options);
}

/**
 * Safely format a date with toLocaleString
 * @param value - The date value (can be Date, string, null, or undefined)
 * @param locale - The locale to use (default: 'ar-SA')
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string or default value
 */
export function safeToLocaleDateString(
  value: Date | string | null | undefined,
  locale: string = 'ar-SA',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) {
    return '-';
  }

  try {
    const date = typeof value === 'string' ? new Date(value) : value;

    if (isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString(locale, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * Safely format a date and time with toLocaleString
 * @param value - The date value (can be Date, string, null, or undefined)
 * @param locale - The locale to use (default: 'ar-SA')
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date and time string or default value
 */
export function safeToLocaleTimeString(
  value: Date | string | null | undefined,
  locale: string = 'ar-SA',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) {
    return '-';
  }

  try {
    const date = typeof value === 'string' ? new Date(value) : value;

    if (isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleString(locale, options);
  } catch (error) {
    console.error('Error formatting date time:', error);
    return '-';
  }
}

/**
 * Format currency in SAR
 * @param value - The amount to format
 * @returns Formatted currency string with SAR
 */
export function formatCurrency(value: number | string | null | undefined): string {
  const formatted = safeToLocaleString(value, 'ar-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${formatted} ر.س`;
}

/**
 * Format percentage
 * @param value - The percentage value to format
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${value.toFixed(2)}%`;
}

/**
 * Check if a value is a valid number
 * @param value - The value to check
 * @returns True if the value is a valid number
 */
export function isValidNumber(value: any): boolean {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && isFinite(num);
}
