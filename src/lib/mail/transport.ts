import nodemailer from 'nodemailer';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  adminEmail: string;
}

export function getSmtpConfig(): SmtpConfig {
  const host = (
    process.env.SMTP_HOST ||
    process.env.MAIL_HOST ||
    process.env.ZOHO_MAIL_HOST ||
    'smtppro.zoho.in'
  ).trim();

  const portRaw = (
    process.env.SMTP_PORT ||
    process.env.MAIL_PORT ||
    '465'
  ).trim();
  const port = parseInt(portRaw, 10) || 465;

  const secureEnv = (process.env.SMTP_SECURE || '').trim().toLowerCase();
  const secure = secureEnv === 'true' ? true : secureEnv === 'false' ? false : port === 465;

  const user = (
    process.env.SMTP_USER ||
    process.env.SMTP_USERNAME ||
    process.env.MAIL_USER ||
    process.env.ZOHO_MAIL_USER ||
    process.env.ZOHO_USER_EMAIL ||
    'marketing@officebazzar.com'
  ).trim();

  const pass = (
    process.env.SMTP_PASS ||
    process.env.SMTP_PASSWORD ||
    process.env.MAIL_PASS ||
    process.env.ZOHO_MAIL_PASS ||
    process.env.ZOHO_APP_PASSWORD ||
    ''
  ).trim();

  const fromName = (
    process.env.EMAIL_FROM_NAME ||
    process.env.MAIL_FROM_NAME ||
    process.env.SMTP_FROM_NAME ||
    'Office Bazzar'
  ).trim();

  const fromEmail = (
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM_ADDRESS ||
    process.env.MAIL_FROM_ADDRESS ||
    process.env.EMAIL_FROM ||
    process.env.MAIL_FROM ||
    user ||
    'marketing@officebazzar.com'
  ).trim();

  const adminEmail = (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.SALES_EMAIL ||
    'sales4@officebazzar.com'
  ).trim();

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromName,
    fromEmail,
    adminEmail,
  };
}

/**
 * Creates a serverless-hardened Nodemailer transport instance.
 * Persistent connection pooling is disabled (pool: false) because Vercel/serverless functions freeze
 * and destroy background sockets, which would cause intermittent ECONNRESET or socket hangup errors.
 */
export function createServerlessTransporter() {
  const config = getSmtpConfig();

  if (!config.pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure, // true for port 465, false for port 587
    auth: {
      user: config.user,
      pass: config.pass,
    },
    pool: false, // strictly single-request connection for serverless safety
    connectionTimeout: 8000, // 8s connection timeout
    greetingTimeout: 5000,   // 5s greeting timeout
    socketTimeout: 10000,    // 10s socket timeout
    requireTLS: !config.secure && (config.port === 587 || config.port === 25),
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
}

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'SMTP' | 'NONE';
}

/**
 * Sends email via serverless SMTP with automatic 1-time retry on socket timeout / connection drop.
 */
export async function sendSmtpEmailWithRetry(options: MailOptions): Promise<SendMailResult> {
  const config = getSmtpConfig();
  const transporter = createServerlessTransporter();

  if (!transporter) {
    return {
      success: false,
      error: 'SMTP credentials (user/password) not configured in environment variables.',
      provider: 'NONE',
    };
  }

  const fromHeader = `"${config.fromName}" <${config.fromEmail}>`;
  const mailPayload = {
    from: fromHeader,
    to: options.to,
    replyTo: options.replyTo || config.fromEmail,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  };

  try {
    const info = await transporter.sendMail(mailPayload);
    return {
      success: true,
      messageId: info.messageId,
      provider: 'SMTP',
    };
  } catch (firstError: any) {
    const isTransient =
      firstError.code === 'ETIMEDOUT' ||
      firstError.code === 'ECONNRESET' ||
      firstError.code === 'ESOCKET' ||
      firstError.command === 'CONN';

    if (isTransient) {
      console.warn('[SMTP] First attempt failed with transient error. Retrying after 800ms backoff...', firstError.message);
      await new Promise((resolve) => setTimeout(resolve, 800));
      try {
        const retryTransporter = createServerlessTransporter();
        if (retryTransporter) {
          const retryInfo = await retryTransporter.sendMail(mailPayload);
          return {
            success: true,
            messageId: retryInfo.messageId,
            provider: 'SMTP',
          };
        }
      } catch (retryError: any) {
        console.error('[SMTP] Retry attempt failed:', retryError);
        return {
          success: false,
          error: retryError?.message || String(retryError),
          provider: 'SMTP',
        };
      }
    }

    console.error('[SMTP] Send failed:', firstError);
    return {
      success: false,
      error: firstError?.message || String(firstError),
      provider: 'SMTP',
    };
  }
}
