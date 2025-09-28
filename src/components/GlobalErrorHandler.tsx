'use client';

import { useEffect } from 'react';
import { toast } from './Toast';

export function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Prevent the default behavior (showing the error in console)
      event.preventDefault();
      
      // Show a user-friendly error message
      let errorMessage = 'An unexpected error occurred';
      
      if (event.reason instanceof Error) {
        errorMessage = event.reason.message;
      } else if (typeof event.reason === 'string') {
        errorMessage = event.reason;
      } else if (event.reason && typeof event.reason === 'object') {
        // Handle cases where an Event object or other object is rejected
        if (event.reason.toString && typeof event.reason.toString === 'function') {
          const stringified = event.reason.toString();
          if (stringified !== '[object Object]' && stringified !== '[object Event]') {
            errorMessage = stringified;
          }
        }
        if (event.reason.message) {
          errorMessage = event.reason.message;
        }
      }
      
      // Only show the toast if we have a meaningful error message
      if (errorMessage && errorMessage !== '[object Object]' && errorMessage !== '[object Event]') {
        toast.error('Error', errorMessage);
      } else {
        toast.error('Error', 'Something went wrong. Please try again.');
      }
    };

    // Handle uncaught JavaScript errors
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
      
      // Show a user-friendly error message
      let errorMessage = event.message || 'An unexpected error occurred';
      
      // Avoid showing generic error messages
      if (errorMessage.includes('Script error') || errorMessage.includes('Non-Error promise rejection')) {
        errorMessage = 'Something went wrong. Please try again.';
      }
      
      toast.error('Error', errorMessage);
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null; // This component doesn't render anything
}