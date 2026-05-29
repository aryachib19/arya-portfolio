require('dotenv').config();
const express = require('express');
const { Resend } = require('resend');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limit: max 5 contact submissions per 15 mins per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many messages sent. Please try again later.' },
});

// ── Resend client ───────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.EMAIL_RECIPIENT || 'aryachib19@gmail.com';

// In-memory message store
const messages = [];

// ── API: Contact Form ───────────────────────────────────────
app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message is too long (max 2000 characters).' });
  }

  // Store message
  const entry = {
    id: Date.now(),
    name: name.trim(),
    email: email.trim(),
    subject: (subject || '').trim(),
    message: message.trim(),
    receivedAt: new Date().toISOString(),
  };
  messages.push(entry);

  // Send emails via Resend
  if (process.env.RESEND_API_KEY) {
    try {
      // Notification → Arya
      await resend.emails.send({
        from: 'Portfolio Contact <onboarding@resend.dev>',
        to: TO_EMAIL,
        reply_to: entry.email,
        subject: `[Portfolio] ${entry.subject || 'New message'} — from ${entry.name}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="margin:0 0 4px;color:#1a1410">New contact from your portfolio</h2>
            <p style="margin:0 0 24px;color:#8a7f75;font-size:13px">${new Date().toLocaleString()}</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:10px 0;border-bottom:1px solid #e0d9cc;color:#8a7f75;width:90px">Name</td><td style="padding:10px 0;border-bottom:1px solid #e0d9cc;font-weight:600">${entry.name}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #e0d9cc;color:#8a7f75">Email</td><td style="padding:10px 0;border-bottom:1px solid #e0d9cc"><a href="mailto:${entry.email}" style="color:#e84d1c">${entry.email}</a></td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #e0d9cc;color:#8a7f75">Subject</td><td style="padding:10px 0;border-bottom:1px solid #e0d9cc">${entry.subject || '—'}</td></tr>
            </table>
            <div style="margin-top:24px;padding:20px;background:#f5f0e8;border-left:3px solid #e84d1c">
              <p style="margin:0;white-space:pre-wrap;font-size:14px;line-height:1.7">${entry.message}</p>
            </div>
            <p style="margin-top:24px;font-size:12px;color:#8a7f75">Reply directly to this email to respond to ${entry.name}.</p>
          </div>
        `,
      });

      // Auto-reply → sender
      await resend.emails.send({
        from: 'Arya Chib <onboarding@resend.dev>',
        to: entry.email,
        subject: `Got your message, ${entry.name.split(' ')[0]}! ✓`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2 style="margin:0 0 8px;color:#1a1410">Thanks for reaching out!</h2>
            <p style="color:#4a3f35;line-height:1.7">Hey ${entry.name.split(' ')[0]},<br><br>
            I received your message and will get back to you soon — usually within 24–48 hours.<br><br>
            In the meantime, feel free to check out my work on
            <a href="https://github.com/aryachib" style="color:#e84d1c">GitHub</a> or connect on
            <a href="https://www.linkedin.com/in/arya-chib-73853b226" style="color:#e84d1c">LinkedIn</a>.</p>
            <p style="margin-top:24px;color:#8a7f75;font-size:13px">— Arya Chib · Frontend Developer · New Delhi</p>
          </div>
        `,
      });

      console.log(`✉️  Email sent for message from ${entry.name} <${entry.email}>`);
    } catch (emailErr) {
      console.error('Resend error:', emailErr.message);
    }
  }

  res.json({ success: true, message: 'Message received!' });
});

// ── API: Health check ───────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Serve frontend for all other routes ────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Arya's portfolio running at http://localhost:${PORT}`);
  console.log(`📧  Resend configured: ${process.env.RESEND_API_KEY ? 'YES ✓' : 'NO — set RESEND_API_KEY in .env'}\n`);
});
