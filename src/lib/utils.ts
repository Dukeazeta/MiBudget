// Money utilities
export const formatMoney = (cents: number, currencyCode = 'USD'): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  });
  return formatter.format(cents / 100);
};

// Get currency symbol
export const getCurrencySymbol = (currencyCode: string): string => {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'NGN': '₦',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
  };
  return symbols[currencyCode] || currencyCode;
};

export const parseMoney = (amount: string): number => {
  // Remove currency symbols and parse to float, then convert to cents
  const cleaned = amount.replace(/[^\d.-]/g, '');
  const dollars = parseFloat(cleaned) || 0;
  return Math.round(dollars * 100);
};

// Re-export date utilities from dateUtils
export {
  DAYS_OF_WEEK,
  getDayOfWeek,
  isRevealDay,
  getNextRevealDay,
  formatDate,
  now as nowTimestamp,
} from './dateUtils';

// Generate UUID v4
export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Get current timestamp in milliseconds (keep for backward compatibility)
export const now = (): number => Date.now();

// Balance calculation helper
export const calculateBalance = (transactions: Array<{ amount_cents: number; type: string }>, initialBalanceCents: number = 0): number => {
  return transactions.reduce((total, transaction) => {
    switch (transaction.type) {
      case 'income':
      case 'adjustment':
        return total + transaction.amount_cents;
      case 'expense':
        return total - transaction.amount_cents;
      case 'transfer':
        return total; // Transfers don't affect total balance
      default:
        return total;
    }
  }, initialBalanceCents);
};
