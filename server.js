require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
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

// ── Nodemailer transporter ──────────────────────────────────
// Uses Gmail (or any SMTP). Set credentials in .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,   // your Gmail address
    pass: process.env.EMAIL_PASS,   // Gmail App Password (not account password)
  },
});

// In-memory store for messages (replaces a DB for simplicity)
// For production, swap with a SQLite/Postgres/MongoDB write
const messages = [];

// ── API: Contact Form ───────────────────────────────────────
app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Basic validation
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

  // Send email (only if credentials are configured)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      // Notification email → Arya
      await transporter.sendMail({
        from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_RECIPIENT || 'aryachib19@gmail.com',
        replyTo: email,
        subject: `[Portfolio] ${subject || 'New message'} — from ${name}`,
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
      await transporter.sendMail({
        from: `"Arya Chib" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Got your message, ${name.split(' ')[0]}! ✓`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2 style="margin:0 0 8px;color:#1a1410">Thanks for reaching out!</h2>
            <p style="color:#4a3f35;line-height:1.7">Hey ${name.split(' ')[0]},<br><br>
            I received your message and will get back to you soon — usually within 24–48 hours.<br><br>
            In the meantime, feel free to check out my work on 
            <a href="https://github.com/aryachib" style="color:#e84d1c">GitHub</a> or connect on 
            <a href="https://www.linkedin.com/in/arya-chib-73853b226" style="color:#e84d1c">LinkedIn</a>.</p>
            <p style="margin-top:24px;color:#8a7f75;font-size:13px">— Arya Chib · Frontend Developer · New Delhi</p>
          </div>
        `,
      });
    } catch (emailErr) {
      // Don't fail the request if email fails — message is already stored
      console.error('Email send error:', emailErr.message);
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
  console.log(`📧  Email configured: ${process.env.EMAIL_USER ? 'YES ✓' : 'NO — set EMAIL_USER & EMAIL_PASS in .env'}\n`);
});
