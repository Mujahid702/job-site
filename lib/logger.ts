import * as Sentry from '@sentry/nextjs'

export function logInfo(message: string, context?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[INFO] [${timestamp}] ${message}`, context ? JSON.stringify(context) : '')
}

export function logWarning(message: string, context?: any) {
  const timestamp = new Date().toISOString()
  console.warn(`[WARN] [${timestamp}] ${message}`, context ? JSON.stringify(context) : '')
  
  Sentry.captureMessage(message, {
    level: 'warning',
    extra: context,
  })
}

export function logError(message: string, error?: any, context?: any) {
  const timestamp = new Date().toISOString()
  console.error(
    `[ERROR] [${timestamp}] ${message}`,
    error ? error : '',
    context ? JSON.stringify(context) : ''
  )

  const extra = {
    message,
    ...(context || {}),
  }

  if (error instanceof Error) {
    Sentry.captureException(error, { extra })
  } else if (error) {
    Sentry.captureException(new Error(error?.message || String(error)), { extra })
  } else {
    Sentry.captureException(new Error(message), { extra })
  }
}
