export interface ContactInquiryPayload {
  recipientEmail: string;
  name: string;
  email: string;
  projectType: string;
  studio?: string;
  message: string;
}

export interface ContactSendResult {
  ok: boolean;
  needsActivation?: boolean;
  message: string;
}

const DEFAULT_GMAIL = 'aviz.arts@gmail.com';

export function resolveRecipientEmail(configuredEmail?: string): string {
  const clean = (configuredEmail || '').trim();
  if (!clean || clean.toLowerCase() === 'avinashr5904@gmail.com') {
    return DEFAULT_GMAIL;
  }
  return clean;
}

export function formatInquiryEmailSubject(payload: Pick<ContactInquiryPayload, 'name' | 'projectType'>): string {
  const focus = payload.projectType || 'Portfolio Inquiry';
  return `[Portfolio Inquiry] ${focus} — ${payload.name || 'Visitor'}`;
}

export function formatInquiryEmailBody(payload: ContactInquiryPayload): string {
  const lines = [
    `Name: ${payload.name}`,
    `Reply Email: ${payload.email}`,
    payload.studio ? `Studio / Company: ${payload.studio}` : null,
    `Project Focus: ${payload.projectType}`,
    '',
    'Message:',
    payload.message || '(No additional details provided)',
  ].filter((line): line is string => line !== null);

  return lines.join('\n');
}

export function buildGmailComposeUrl(payload: ContactInquiryPayload): string {
  const to = resolveRecipientEmail(payload.recipientEmail);
  const subject = formatInquiryEmailSubject(payload);
  const body = formatInquiryEmailBody(payload);
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildMailtoUrl(payload: ContactInquiryPayload): string {
  const to = resolveRecipientEmail(payload.recipientEmail);
  const subject = formatInquiryEmailSubject(payload);
  const body = formatInquiryEmailBody(payload);
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function sendContactInquiry(payload: ContactInquiryPayload): Promise<ContactSendResult> {
  const targetEmail = resolveRecipientEmail(payload.recipientEmail);
  const subject = formatInquiryEmailSubject(payload);

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), 12000) : null;

    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller?.signal,
      body: JSON.stringify({
        name: payload.name.trim(),
        email: payload.email.trim(),
        _replyto: payload.email.trim(),
        _subject: subject,
        projectFocus: payload.projectType,
        ...(payload.studio?.trim() ? { studio: payload.studio.trim() } : {}),
        message: payload.message.trim(),
        _template: 'table',
        _captcha: 'false',
      }),
    });

    if (timeout) clearTimeout(timeout);

    const data = await res.json().catch(() => ({}));
    const rawMsg = typeof data?.message === 'string' ? data.message : '';
    const isSuccess = res.ok && (data?.success === true || data?.success === 'true');

    if (isSuccess) {
      return {
        ok: true,
        message: `Your message has been delivered to ${targetEmail}.`,
      };
    }

    if (/activat|confirm|verify/i.test(rawMsg)) {
      return {
        ok: true,
        needsActivation: true,
        message: `Your message was submitted. If this is the site's first FormSubmit dispatch, the owner must click the 1-time activation link sent to ${targetEmail}. You can also send directly via Gmail below.`,
      };
    }

    return {
      ok: false,
      message: rawMsg || `Could not reach mail relay (HTTP ${res.status}). Use the direct Gmail option below.`,
    };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error && err.name === 'AbortError'
          ? 'Email relay timed out. Please use the direct Gmail button below.'
          : 'Network blocked direct form relay. Use the direct Gmail button below to deliver immediately.',
    };
  }
}
