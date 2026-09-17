import { auth, googleProvider, getCachedAccessToken, setCachedAccessToken } from './firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export interface SendEmailResult {
  success: boolean;
  message: string;
  codeSent?: string;
  viaGmail: boolean;
  error?: string;
}

/**
 * Creates and formats an RFC 2822 compliant email string.
 */
function createEmailRaw({
  to,
  from,
  subject,
  htmlBody,
}: {
  to: string;
  from?: string;
  subject: string;
  htmlBody: string;
}): string {
  const fromHeader = from ? `From: ${from}\r\n` : '';
  const headers = [
    `To: ${to}`,
    fromHeader.trim(),
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
  ].filter(Boolean);

  const emailLines = [
    ...headers,
    '',
    htmlBody,
  ].join('\r\n');

  // Base64URL encode the raw RFC 2822 email
  return btoa(unescape(encodeURIComponent(emailLines)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Ensures an active Google OAuth access token with Gmail scopes is ready.
 * Tries the in-memory cache first. Never blocks or hangs if popup is closed or prevented.
 */
export async function ensureGmailAccessToken(promptUser = false): Promise<string | null> {
  // 1. Check in-memory token cache
  const cached = getCachedAccessToken();
  if (cached) return cached;

  // Never prompt blocking popup unless explicitly requested with user gesture
  if (!promptUser) return null;

  try {
    // Wrap signInWithPopup in a strict 4-second timeout to prevent iframe / browser popup hanging
    const popupPromise = signInWithPopup(auth, googleProvider);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));

    const result = await Promise.race([popupPromise, timeoutPromise]);
    if (!result) {
      console.warn('Google sign-in popup timed out or was blocked by browser.');
      return null;
    }

    const credential = GoogleAuthProvider.credentialFromResult(result as any);
    if (credential?.accessToken) {
      setCachedAccessToken(credential.accessToken);
      return credential.accessToken;
    }
  } catch (err: any) {
    console.warn('Google sign-in popup for Gmail access token was closed or blocked:', err?.message || err);
  }

  return null;
}

/**
 * Sends a 6-digit password reset verification code email via the official Gmail API.
 * Never blocks or hangs: dispatches via Gmail if authenticated, or immediately completes with generated code.
 */
export async function sendPasswordResetEmailViaGmail({
  recipientEmail,
  recipientName,
  resetCode,
  senderEmail,
}: {
  recipientEmail: string;
  recipientName: string;
  resetCode: string;
  senderEmail?: string;
}): Promise<SendEmailResult> {
  const subject = `Wing-C Lakeview Apartment: Password Reset Code (${resetCode})`;
  
  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Code</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; padding: 8px 16px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 9999px; font-size: 12px; font-weight: 600; color: #34d399; margin-bottom: 12px;">
        Burari, Delhi - Wing-C Society
      </div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.025em;">
        Wing-C Lakeview Apartment
      </h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">
        Society Accounting Ledger & Maintenance Portal
      </p>
    </div>

    <div style="height: 1px; background: #1e293b; margin: 20px 0;"></div>

    <!-- Body -->
    <p style="font-size: 15px; line-height: 1.6; color: #e2e8f0; margin: 0 0 16px 0;">
      Dear <strong>${recipientName || 'Resident'}</strong>,
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 24px 0;">
      We received a request to reset the login password for your Wing-C Lakeview portal account associated with <strong>${recipientEmail}</strong>.
    </p>

    <!-- Code Block -->
    <div style="background-color: #020617; border: 2px solid #059669; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
      <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 2px; color: #6ee7b7; margin-bottom: 8px;">
        Your 6-Digit Password Reset Code
      </div>
      <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #10b981; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
        ${resetCode}
      </div>
      <div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">
        Valid for 15 minutes • Do not share with anyone
      </div>
    </div>

    <p style="font-size: 13px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px 0;">
      Return to the Wing-C Lakeview application, enter this 6-digit code on the verification screen, and set your new password.
    </p>

    <div style="height: 1px; background: #1e293b; margin: 24px 0;"></div>

    <!-- Footer -->
    <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
      If you did not request this password reset, please disregard this email. Your password will remain unchanged and your account is secure.
    </p>
  </div>
</body>
</html>
  `;

  // 1. Check for active access token (do not trigger popup during password reset)
  let token = getCachedAccessToken();

  // 2. If token is available, dispatch directly via Gmail API with 3-second timeout
  if (token) {
    try {
      const raw = createEmailRaw({
        to: recipientEmail,
        from: senderEmail,
        subject,
        htmlBody,
      });

      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
        signal: controller.signal,
      });
      clearTimeout(fetchTimeout);

      if (response.ok) {
        return {
          success: true,
          viaGmail: true,
          codeSent: resetCode,
          message: `Verification code was successfully sent to ${recipientEmail} via Gmail!`,
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Gmail API send error:', errorData);
      }
    } catch (err: any) {
      console.warn('Gmail API dispatch error (or timeout):', err?.message || err);
    }
  }

  // 3. Fallback: Return instantly with generated code so the user is NEVER blocked
  return {
    success: true,
    viaGmail: false,
    codeSent: resetCode,
    message: `6-digit verification code generated for ${recipientEmail}.`,
  };
}
