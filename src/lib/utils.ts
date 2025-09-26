// Money utilities
export const formatMoney = (cents: number, currencyCode = 'USD'): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  });
  return formatter.format(cents / 100);
};

export const parseMoney = (amount: string): number => {
  // Remove currency symbols and parse to float, then convert to cents
  const cleaned = amount.replace(/[^\d.-]/g, '');
  const dollars = parseFloat(cleaned) || 0;
  return Math.round(dollars * 100);
};

// Date utilities
export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const getDayOfWeek = (date: Date = new Date()): number => {
  return date.getDay(); // 0=Sunday, 6=Saturday
};

export const isRevealDay = (revealDay: number, timezone?: string): boolean => {
  const now = timezone 
    ? new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))
    : new Date();
  return getDayOfWeek(now) === revealDay;
};

export const getNextRevealDay = (revealDay: number, timezone?: string): Date => {
  const now = timezone
    ? new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))
    : new Date();
  
  const currentDay = getDayOfWeek(now);
  const daysUntilReveal = (revealDay - currentDay + 7) % 7;
  const nextReveal = new Date(now);
  nextReveal.setDate(now.getDate() + (daysUntilReveal === 0 ? 7 : daysUntilReveal));
  return nextReveal;
};

// Generate UUID v4
export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Get current timestamp in milliseconds
export const now = (): number => Date.now();

// Balance calculation helper
export const calculateBalance = (transactions: Array<{ amount_cents: number; type: string }>): number => {
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
  }, 0);
};