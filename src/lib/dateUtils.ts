import { format, formatDistanceToNow, isToday, isYesterday, isSameWeek, parseISO } from 'date-fns';

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday', 
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const DAYS_OF_WEEK_SHORT = [
  'Sun',
  'Mon',
  'Tue', 
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

/**
 * Get the current day of the week (0=Sunday, 6=Saturday)
 */
export const getDayOfWeek = (date: Date = new Date()): number => {
  return date.getDay();
};

/**
 * Check if today is the reveal day
 */
export const isRevealDay = (revealDay: number, timezone?: string): boolean => {
  const now = timezone 
    ? new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))
    : new Date();
  return getDayOfWeek(now) === revealDay;
};

/**
 * Get the next reveal day date
 */
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

/**
 * Format date for display in different contexts
 */
/**
 * Helper function to safely parse and validate dates
 */
const safeParseDate = (dateString: string | Date): Date | null => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateString);
      return null;
    }
    return date;
  } catch (error) {
    console.warn('Failed to parse date:', dateString, error);
    return null;
  }
};

export const formatDate = {
  /**
   * Format for transaction lists: "Today", "Yesterday", or "Jan 15, 2024"
   */
  relative: (dateString: string | Date): string => {
    const date = safeParseDate(dateString);
    if (!date) return 'Invalid date';
    
    try {
      if (isToday(date)) {
        return 'Today';
      } else if (isYesterday(date)) {
        return 'Yesterday';
      } else if (isSameWeek(date, new Date())) {
        return format(date, 'EEEE'); // Day name: "Monday"
      } else {
        return format(date, 'MMM d, yyyy'); // "Jan 15, 2024"
      }
    } catch (error) {
      console.warn('Failed to format date:', dateString, error);
      return 'Invalid date';
    }
  },

  /**
   * Format for headers: "Today", "Yesterday", or "Monday, January 15, 2024"
   */
  header: (dateString: string | Date): string => {
    const date = safeParseDate(dateString);
    if (!date) return 'Invalid date';
    
    try {
      if (isToday(date)) {
        return 'Today';
      } else if (isYesterday(date)) {
        return 'Yesterday';
      } else {
        return format(date, 'EEEE, MMMM d, yyyy'); // "Monday, January 15, 2024"
      }
    } catch (error) {
      console.warn('Failed to format date header:', dateString, error);
      return 'Invalid date';
    }
  },

  /**
   * Format for forms: "2024-01-15"
   */
  input: (date: Date): string => {
    try {
      if (isNaN(date.getTime())) {
        console.warn('Invalid date for input formatting:', date);
        return new Date().toISOString().split('T')[0];
      }
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      console.warn('Failed to format date for input:', date, error);
      return new Date().toISOString().split('T')[0];
    }
  },

  /**
   * Format for display: "Jan 15, 2024"
   */
  display: (dateString: string | Date): string => {
    const date = safeParseDate(dateString);
    if (!date) return 'Invalid date';
    
    try {
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.warn('Failed to format date for display:', dateString, error);
      return 'Invalid date';
    }
  },

  /**
   * Format time: "2:30 PM"
   */
  time: (dateString: string | Date): string => {
    const date = safeParseDate(dateString);
    if (!date) return 'Invalid time';
    
    try {
      return format(date, 'h:mm a');
    } catch (error) {
      console.warn('Failed to format time:', dateString, error);
      return 'Invalid time';
    }
  },

  /**
   * Format date and time: "Jan 15, 2024 at 2:30 PM"
   */
  dateTime: (dateString: string | Date): string => {
    const date = safeParseDate(dateString);
    if (!date) return 'Invalid date';
    
    try {
      return format(date, 'MMM d, yyyy \'at\' h:mm a');
    } catch (error) {
      console.warn('Failed to format date time:', dateString, error);
      return 'Invalid date';
    }
  },

  /**
   * Format relative time: "2 hours ago", "in 3 days"
   */
  ago: (dateString: string | Date): string => {
    const date = safeParseDate(dateString);
    if (!date) return 'Invalid date';
    
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.warn('Failed to format relative time:', dateString, error);
      return 'Invalid date';
    }
  },
};

/**
 * Get current timestamp in milliseconds
 */
export const now = (): number => Date.now();

/**
 * Convert date to ISO string for storage
 */
export const toISOString = (date: Date = new Date()): string => {
  return date.toISOString();
};

/**
 * Parse ISO string to Date object
 */
export const parseISOString = (isoString: string): Date => {
  return parseISO(isoString);
};

/**
 * Get start of day for a given date
 */
export const startOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Get end of day for a given date
 */
export const endOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

/**
 * Check if date is within a range
 */
export const isWithinRange = (
  date: Date,
  startDate: Date,
  endDate: Date
): boolean => {
  return date >= startDate && date <= endDate;
};

/**
 * Get timezone abbreviation for display
 */
export const getTimezoneAbbr = (timezone?: string): string => {
  if (!timezone) return 'Local';
  
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName');
    return timeZoneName?.value || timezone;
  } catch {
    return timezone;
  }
};