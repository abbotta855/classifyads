/**
 * Unified error handling system
 */

export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error, defaultMessage = 'An error occurred') {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  // Axios errors
  if (error.response) {
    const { status, data } = error.response;
    return {
      message: data?.error || data?.message || defaultMessage,
      code: `HTTP_${status}`,
      statusCode: status,
      details: data?.errors || null,
    };
  }

  // Network errors
  if (error.request) {
    return {
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
      statusCode: 0,
      details: null,
    };
  }

  // Generic errors
  return {
    message: error.message || defaultMessage,
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
    details: null,
  };
}

/**
 * Log error for debugging
 */
export function logError(error, context = '') {
  const errorInfo = handleApiError(error);
  console.error(`[Error${context ? ` in ${context}` : ''}]`, {
    message: errorInfo.message,
    code: errorInfo.code,
    statusCode: errorInfo.statusCode,
    details: errorInfo.details,
    originalError: error,
  });
}

