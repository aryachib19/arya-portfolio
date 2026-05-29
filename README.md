# Arya Chib — Full Stack Portfolio

A polished portfolio site with a Node.js/Express backend that handles the contact form, sends emails, and stores messages.

## Project Structure

```
arya-portfolio/
├── server.js          ← Express backend (API + static file serving)
├── public/
│   └── index.html     ← Your portfolio frontend
├── .env.example       ← Copy to .env and fill in credentials
├── package.json
└── README.md
```

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Then edit .env with your Gmail App Password
```

**Getting a Gmail App Password:**
1. Enable 2-Factor Auth on your Google account
2. Go to: Google Account → Security → App Passwords
3. Create a new App Password (type: Mail)
4. Paste it as `EMAIL_PASS` in your `.env`

### 3. Run locally
```bash
npm start
# Visit http://localhost:3000
```

---

## 🚀 Deployment Options

### Option A — Render.com (Free, Recommended for beginners)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create arya-portfolio --public --push
   ```

2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Add Environment Variables (from your `.env`):
   - `EMAIL_USER` = your Gmail
   - `EMAIL_PASS` = your App Password
   - `EMAIL_RECIPIENT` = aryachib19@gmail.com
6. Click **Deploy** — you'll get a free `*.onrender.com` URL

---

### Option B — Railway.app (Free tier, very fast)

1. Push to GitHub (same as above)
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo
4. Add environment variables in the Variables tab
5. Railway auto-detects Node and deploys instantly

---

### Option C — Vercel (Serverless)

Vercel needs a small change to work with Express. Run:
```bash
npm install -g vercel
```

Add a `vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

Then:
```bash
vercel --prod
```
Set env vars in the Vercel dashboard.

---

### Option D — Custom VPS (DigitalOcean/Hetzner)

```bash
# On your VPS
git clone <your-repo-url>
cd arya-portfolio
npm install
cp .env.example .env && nano .env

# Install PM2 to keep it running
npm install -g pm2
pm2 start server.js --name portfolio
pm2 save
pm2 startup

# Set up Nginx reverse proxy (port 80 → 3000)
# sudo nano /etc/nginx/sites-available/portfolio
```

---

## Custom Domain

After deploying to Render/Railway/Vercel:
1. Buy a domain (Namecheap, Google Domains, etc.)
2. In your hosting dashboard → Custom Domains → Add domain
3. Follow the DNS instructions (usually a CNAME record)

---

## Contact Form

The contact form at `/api/contact`:
- Validates name, email, message
- Rate-limited to 5 requests per 15 min per IP
- Stores every message in memory (restarts clear them — upgrade to a DB for persistence)
- Sends you a notification email
- Sends the visitor an auto-reply

No email configured? The form still works — messages are stored, just not emailed.
