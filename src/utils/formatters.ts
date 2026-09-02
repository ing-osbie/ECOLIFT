/**
 * Currency Formatter Utility for ECOLIFT
 * Formats monetary amounts consistently across Customer & Collector screens.
 */

export const DEFAULT_CURRENCY_SYMBOL = 'GH₵';

export function formatCurrency(
  amount: number,
  currencySymbol: string = DEFAULT_CURRENCY_SYMBOL
): string {
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${currencySymbol} ${formattedAmount}`;
}

export function formatCompactCurrency(
  amount: number,
  currencySymbol: string = DEFAULT_CURRENCY_SYMBOL
): string {
  return `${currencySymbol} ${amount.toFixed(0)}`;
}
