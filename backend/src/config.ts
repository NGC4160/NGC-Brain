import 'dotenv/config'

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  qbo: {
    clientId: process.env.QBO_CLIENT_ID ?? '',
    clientSecret: process.env.QBO_CLIENT_SECRET ?? '',
    redirectUri: process.env.QBO_REDIRECT_URI ?? 'http://localhost:3001/api/qbo/callback',
    environment: process.env.QBO_ENVIRONMENT ?? 'sandbox',
    useMock: process.env.QBO_USE_MOCK !== 'false',
  },
  alerts: {
    smtp: {
      host: process.env.SMTP_HOST ?? '',
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
      from: process.env.SMTP_FROM ?? 'alerts@greenlinegolf.com',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
      authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
      fromNumber: process.env.TWILIO_FROM_NUMBER ?? '',
    },
    emailRecipients: (process.env.ALERT_EMAIL_RECIPIENTS ?? '').split(',').filter(Boolean),
    smsRecipients: (process.env.ALERT_SMS_RECIPIENTS ?? '').split(',').filter(Boolean),
  },
}
