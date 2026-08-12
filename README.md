# Kelly Agency Backend — Team OS API Server

Node.js + Express + MongoDB Atlas backend for Kelly Agency Team OS.

## Tech Stack
- **Runtime**: Node.js (ESM, `"type": "module"`)
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Mongoose)
- **Email**: Nodemailer + Gmail SMTP
- **File Uploads**: Cloudinary SDK v2
- **Auth**: Role-based (no JWT, session-free)

## Local Development

```bash
# 1. Copy env file
cp .env.example .env
# Fill in your actual values in .env

# 2. Install dependencies
npm install

# 3. Start server
npm start
# or for dev with auto-restart:
npm run dev
```

Server runs at: `http://localhost:5000`

## Environment Variables (required on Render)

| Variable | Description |
|---|---|
| `PORT` | Port (Render sets this automatically) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `GMAIL_USER` | Gmail account for sending emails |
| `GMAIL_PASS` | Gmail App Password (not your main password) |
| `APP_NAME` | App name shown in emails |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

## Render Deployment

1. Push this folder to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect GitHub repo
4. Settings:
   - **Root Directory**: `kelly-agency-backend` (if monorepo) OR leave blank
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: `Node`
5. Add all env variables from `.env.example` in Render dashboard
6. Deploy!
