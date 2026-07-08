import { Resend } from "resend";

// Email verification sender (Resend). The only required env var is
// RESEND_API_KEY; the from-address defaults to the verified family sender.

let cachedClient: Resend | null = null;

function getResendClient(): Resend {
  if (cachedClient) return cachedClient;
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || key === "TODO_FOUNDER_PROVIDES") {
    throw new Error("RESEND_API_KEY is not configured");
  }
  cachedClient = new Resend(key);
  return cachedClient;
}

const DEFAULT_FROM = "AlmiKorean <almiworld@almiworld.com>";

function getFromAddress(): string {
  const addr = process.env.EMAIL_FROM?.trim();
  if (!addr) return DEFAULT_FROM;
  return addr.includes("<") ? addr : `AlmiKorean <${addr}>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// AlmiKorean palette.
const COLOR_BG = "#FFFBF5";
const COLOR_PAPER = "#FFFFFF";
const COLOR_INK = "#1a1a2e";
const COLOR_TEXT = "#334155";
const COLOR_TEXT_MUTED = "#475569";
const COLOR_CORAL = "#FF7A6B";
const SITE_URL = "https://almikorean.almiworld.com";

function shell(bodyInner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>AlmiKorean</title>
  </head>
  <body style="margin:0;padding:24px 12px;background-color:${COLOR_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;color:${COLOR_TEXT};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${COLOR_BG};">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:${COLOR_PAPER};border-radius:8px;padding:32px;">
            <tr>
              <td style="font-size:16px;line-height:1.6;color:${COLOR_TEXT};">
                ${bodyInner}
                <p style="margin:24px 0 0 0;color:${COLOR_TEXT_MUTED};font-size:14px;">— AlmiKorean<br /><a href="${SITE_URL}" style="color:${COLOR_TEXT_MUTED};">${SITE_URL}</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  // Coral btn with ink text — white-on-coral fails AA per family doctrine.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
    <tr>
      <td align="center">
        <a href="${href}" style="display:inline-block;background-color:${COLOR_CORAL};color:${COLOR_INK};text-decoration:none;padding:12px 24px;border-radius:8px;font-size:16px;font-weight:600;">${label}</a>
      </td>
    </tr>
  </table>`;
}

function renderEmailVerificationHtml(verifyUrl: string): string {
  const safe = escapeHtml(verifyUrl);
  return shell(`
    <p style="margin:0 0 16px 0;">Assalam o alaikum,</p>
    <p style="margin:0 0 16px 0;">Welcome to AlmiKorean. One more step — please confirm this email address so we know it's really you.</p>
    ${ctaButton(safe, "Verify my email")}
    <p style="margin:0 0 8px 0;font-size:14px;color:${COLOR_TEXT_MUTED};">Or copy and paste this link:</p>
    <p style="margin:0 0 16px 0;font-size:14px;color:${COLOR_TEXT_MUTED};word-break:break-all;"><a href="${safe}" style="color:${COLOR_TEXT_MUTED};">${safe}</a></p>
    <p style="margin:0 0 16px 0;">This link expires in 24 hours.</p>
    <p style="margin:0;">If you didn't sign up for AlmiKorean, you can safely ignore this email.</p>
  `);
}

function renderEmailVerificationText(verifyUrl: string): string {
  return `Assalam o alaikum,

Welcome to AlmiKorean. One more step — please confirm this email address so we know it's really you.

Click this link to verify:
${verifyUrl}

This link expires in 24 hours.

If you didn't sign up for AlmiKorean, you can safely ignore this email.

— AlmiKorean
${SITE_URL}
`;
}

export async function sendEmailVerification(input: {
  to: string;
  verifyUrl: string;
}): Promise<void> {
  const client = getResendClient();
  const result = await client.emails.send({
    from: getFromAddress(),
    to: input.to,
    subject: "Verify your AlmiKorean email",
    html: renderEmailVerificationHtml(input.verifyUrl),
    text: renderEmailVerificationText(input.verifyUrl),
  });
  if (result.error) {
    throw new Error(`Resend send failed: ${result.error.message}`);
  }
}
