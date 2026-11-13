const RECIPIENT = process.env.CONTACT_TO_EMAIL || 'hmd2k21@gmail.com';
const MAX_NAME_LENGTH = 120;
const MAX_SUBJECT_LENGTH = 180;
const MAX_MESSAGE_LENGTH = 8000;

module.exports = async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const { name, email, subject, message, website } = request.body || {};

  if (website) return response.status(200).json({ ok: true });

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof subject !== 'string' ||
    typeof message !== 'string'
  ) {
    return response.status(400).json({ error: 'Please complete all fields.' });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim();
  const cleanSubject = subject.trim().replace(/[\r\n]+/g, ' ');
  const cleanMessage = message.trim();

  if (
    !cleanName || cleanName.length > MAX_NAME_LENGTH ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254 ||
    !cleanSubject || cleanSubject.length > MAX_SUBJECT_LENGTH ||
    !cleanMessage || cleanMessage.length > MAX_MESSAGE_LENGTH
  ) {
    return response.status(400).json({ error: 'Please check the form fields and try again.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !from) {
    return response.status(503).json({ error: 'Email sending is not configured yet.' });
  }

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [RECIPIENT],
        reply_to: cleanEmail,
        subject: cleanSubject,
        text: `From: ${cleanName} <${cleanEmail}>\n\n${cleanMessage}`,
      }),
    });

    if (!resendResponse.ok) {
      console.error('Contact email provider returned status', resendResponse.status);
      return response.status(502).json({ error: 'Your message could not be sent right now.' });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Contact email request failed:', error.message);
    return response.status(502).json({ error: 'Your message could not be sent right now.' });
  }
};
