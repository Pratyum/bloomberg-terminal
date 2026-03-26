// Time period utilities for Bloomberg Terminal clone

/**
 * Get the start date for a specific time period from today
 * @param days Number of days to go back
 * @returns Date object for the start date
 */
export function getStartDateFromPeriod(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Get the start of the current year
 * @returns Date object for January 1st of the current year
 */
export function getYearStartDate(): Date {
  const date = new Date();
  date.setMonth(0); // January
  date.setDate(1); // 1st day
  date.setHours(0, 0, 0, 0); // Start of day
  return date;
}

/**
 * Format a date as YYYY-MM-DD
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Calculate Year-to-Date (YTD) percentage change
 * @param currentValue Current value
 * @param startOfYearValue Value at the start of the year
 * @returns Percentage change as a number
 */
export function calculateYTDChange(currentValue: number, startOfYearValue: number): number {
  if (startOfYearValue === 0) return 0;
  return ((currentValue - startOfYearValue) / startOfYearValue) * 100;
}
