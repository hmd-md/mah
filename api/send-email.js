export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { toName, toEmail, subject, textContent } = req.body;

  if (!toName || !toEmail || !subject || !textContent) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'INTERNAL',
          email: process.env.BREVO_VERIFIED_EMAIL,
        },
        to: [{ email: process.env.RECEIVER_EMAIL, name: toName }],
        subject: `${subject} - ${toEmail}`,
        textContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json({ success: true, messageId: data.messageId });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
}
