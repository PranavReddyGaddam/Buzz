# Deployment Guide

## Backend Deployment Options

### Recommended: Railway (Best for FastAPI + WebSockets)

**Why Railway?**
- ✅ Excellent WebSocket support
- ✅ Easy deployment (GitHub integration)
- ✅ Free tier available ($5 credit/month)
- ✅ Automatic HTTPS
- ✅ Environment variables management
- ✅ Built-in logging
- ✅ Great for FastAPI applications

**Steps:**

1. **Create Railway account:**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `backend` directory as root

3. **Configure environment variables:**
   - Go to Variables tab
   - Add:
     ```
     PORT=8000
     CORS_ORIGINS=https://your-frontend-domain.com,https://your-frontend-domain.vercel.app
     ```

4. **Deploy:**
   - Railway will auto-detect Python and install dependencies
   - It will use `requirements.txt`
   - The app will be deployed automatically

5. **Get your backend URL:**
   - Railway provides a URL like: `https://your-app.up.railway.app`
   - Use this for your frontend's `VITE_WS_URL`

**Cost:** Free tier available, then $5/month for hobby plan

---

### Option 2: Render (Great Alternative)

**Why Render?**
- ✅ Good WebSocket support
- ✅ Free tier available
- ✅ Easy deployment
- ✅ Automatic HTTPS
- ✅ GitHub integration

**Steps:**

1. **Create Render account:**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create new Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` directory

3. **Configure:**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment:** Python 3

4. **Add environment variables:**
   - `PORT`: 8000 (auto-set by Render)
   - `CORS_ORIGINS`: Your frontend URLs

5. **Deploy:**
   - Click "Create Web Service"
   - Render will build and deploy automatically

**Cost:** Free tier available (spins down after 15 min inactivity), $7/month for always-on

---

### Option 3: Fly.io (Global Distribution)

**Why Fly.io?**
- ✅ Excellent WebSocket support
- ✅ Global edge network
- ✅ Free tier available
- ✅ Great for low latency

**Steps:**

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Create app:**
   ```bash
   cd backend
   fly launch
   ```

4. **Configure `fly.toml`:**
   ```toml
   app = "your-app-name"
   primary_region = "iad"

   [build]

   [http_service]
     internal_port = 8000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0
     processes = ["app"]

   [[http_service.checks]]
     interval = "10s"
     timeout = "2s"
     grace_period = "5s"
   ```

5. **Set environment variables:**
   ```bash
   fly secrets set CORS_ORIGINS=https://your-frontend-domain.com
   ```

6. **Deploy:**
   ```bash
   fly deploy
   ```

**Cost:** Free tier available, pay-as-you-go pricing

---

### Option 4: DigitalOcean App Platform

**Why DigitalOcean?**
- ✅ Reliable and stable
- ✅ Good WebSocket support
- ✅ Simple pricing
- ✅ GitHub integration

**Steps:**

1. **Create DigitalOcean account:**
   - Go to [digitalocean.com](https://digitalocean.com)

2. **Create App:**
   - Go to App Platform
   - Click "Create App"
   - Connect GitHub repository

3. **Configure:**
   - Select `backend` directory
   - **Run Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Build Command:** `pip install -r requirements.txt`

4. **Add environment variables:**
   - `CORS_ORIGINS`: Your frontend URLs

5. **Deploy:**
   - Click "Create Resources"
   - DigitalOcean will deploy automatically

**Cost:** $5/month for basic plan

---

### Option 5: AWS (ECS/Fargate) - Advanced

**Why AWS?**
- ✅ Highly scalable
- ✅ Enterprise-grade
- ✅ Full control
- ❌ More complex setup

**Steps:**

1. **Create ECR repository:**
   ```bash
   aws ecr create-repository --repository-name buzz-backend
   ```

2. **Build and push Docker image:**
   ```bash
   docker build -t buzz-backend .
   docker tag buzz-backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/buzz-backend:latest
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/buzz-backend:latest
   ```

3. **Create ECS task definition and service**
4. **Configure load balancer for WebSocket support**
5. **Set up environment variables**

**Cost:** Pay-as-you-go, ~$10-20/month for small app

---

## Frontend Deployment Options

### Recommended: Vercel (Best for React/Vite)

**Why Vercel?**
- ✅ Excellent for React/Next.js apps
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ GitHub integration
- ✅ Fast global CDN
- ✅ Easy environment variables

**Steps:**

1. **Create Vercel account:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import project:**
   - Click "New Project"
   - Import your GitHub repository
   - Select the `frontend` directory

3. **Configure:**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. **Add environment variables:**
   - `VITE_WS_URL`: `wss://your-backend-url.com/ws`
   - Use `wss://` (secure WebSocket) for production

5. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy automatically

**Cost:** Free tier available, then $20/month for Pro

---

### Option 2: Netlify

**Why Netlify?**
- ✅ Great for static sites
- ✅ Free tier available
- ✅ Easy deployment
- ✅ GitHub integration

**Steps:**

1. **Create Netlify account:**
   - Go to [netlify.com](https://netlify.com)

2. **Import project:**
   - Click "New site from Git"
   - Connect GitHub repository
   - Select `frontend` directory

3. **Configure:**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

4. **Add environment variables:**
   - `VITE_WS_URL`: `wss://your-backend-url.com/ws`

5. **Deploy:**
   - Click "Deploy site"

**Cost:** Free tier available, then $19/month for Pro

---

### Option 3: Cloudflare Pages

**Why Cloudflare Pages?**
- ✅ Free tier available
- ✅ Fast global CDN
- ✅ Good performance
- ✅ GitHub integration

**Steps:**

1. **Create Cloudflare account:**
   - Go to [cloudflare.com](https://cloudflare.com)

2. **Create Pages project:**
   - Go to Pages
   - Click "Create a project"
   - Connect GitHub repository

3. **Configure:**
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`

4. **Add environment variables:**
   - `VITE_WS_URL`: `wss://your-backend-url.com/ws`

5. **Deploy:**
   - Cloudflare will build and deploy automatically

**Cost:** Free tier available

---

## Recommended Deployment Stack

### Best for Most Users:

**Backend:** Railway
- Easy deployment
- Great WebSocket support
- Free tier available
- Simple configuration

**Frontend:** Vercel
- Excellent for React/Vite
- Free tier available
- Fast global CDN
- Easy environment variables

### Total Cost: $0/month (free tiers)

---

## Deployment Checklist

### Backend:
- [ ] Choose deployment platform (Railway recommended)
- [ ] Set up GitHub repository
- [ ] Configure environment variables:
  - [ ] `CORS_ORIGINS` (frontend URLs)
  - [ ] `PORT` (usually auto-set)
- [ ] Test WebSocket connections
- [ ] Verify HTTPS is enabled
- [ ] Test health endpoint: `https://your-backend.com/health`

### Frontend:
- [ ] Choose deployment platform (Vercel recommended)
- [ ] Set up GitHub repository
- [ ] Configure environment variables:
  - [ ] `VITE_WS_URL` (use `wss://` for secure WebSocket)
- [ ] Update CORS_ORIGINS in backend to include frontend URL
- [ ] Test the app in production
- [ ] Verify WebSocket connections work
- [ ] Test on mobile devices

### Post-Deployment:
- [ ] Test session creation
- [ ] Test session joining
- [ ] Test vibration on Android device
- [ ] Test on iOS device (verify limitations message)
- [ ] Monitor logs for errors
- [ ] Set up custom domains (optional)

---

## Environment Variables Reference

### Backend:
```bash
PORT=8000  # Usually auto-set by platform
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-frontend.com
```

### Frontend:
```bash
VITE_WS_URL=wss://your-backend.railway.app/ws  # Use wss:// for secure WebSocket
```

---

## Troubleshooting

### WebSocket Connection Issues:
- **Problem:** WebSocket fails to connect
- **Solution:** 
  - Verify backend URL uses `wss://` (not `ws://`) in production
  - Check CORS_ORIGINS includes frontend URL
  - Verify backend is running and accessible

### CORS Errors:
- **Problem:** CORS errors in browser
- **Solution:**
  - Add frontend URL to `CORS_ORIGINS` in backend
  - Use exact URLs (including `https://`)
  - Restart backend after changing CORS_ORIGINS

### Environment Variables Not Working:
- **Problem:** Frontend can't connect to backend
- **Solution:**
  - Verify `VITE_WS_URL` is set correctly
  - Use `wss://` for secure WebSocket in production
  - Rebuild frontend after changing environment variables
  - Check browser console for errors

### Backend Not Starting:
- **Problem:** Backend fails to start
- **Solution:**
  - Check logs for errors
  - Verify `requirements.txt` is correct
  - Check Python version compatibility
  - Verify PORT environment variable is set

---

## Quick Start: Railway + Vercel

### Backend (Railway):
1. Sign up at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select `backend` directory
4. Add environment variable: `CORS_ORIGINS=https://your-frontend.vercel.app`
5. Deploy!

### Frontend (Vercel):
1. Sign up at [vercel.com](https://vercel.com)
2. New Project → Import GitHub repo
3. Select `frontend` directory
4. Add environment variable: `VITE_WS_URL=wss://your-backend.railway.app/ws`
5. Deploy!

### Total Time: ~10 minutes
### Cost: $0/month (free tiers)

---

## Production Best Practices

1. **Use HTTPS/WSS:** Always use `wss://` for WebSocket in production
2. **Set CORS properly:** Only allow your frontend domains
3. **Monitor logs:** Check logs regularly for errors
4. **Set up alerts:** Configure alerts for downtime
5. **Backup:** Consider database for session storage in future
6. **Rate limiting:** Add rate limiting for production
7. **Error tracking:** Set up error tracking (Sentry, etc.)
8. **Performance monitoring:** Monitor response times

---

## Next Steps After Deployment

1. **Test thoroughly:** Test all features in production
2. **Monitor performance:** Check response times and errors
3. **Set up custom domains:** Configure custom domains if needed
4. **Add analytics:** Track usage and errors
5. **Scale if needed:** Upgrade plans if traffic increases
6. **Add features:** Consider adding database for persistence
7. **Security:** Review security best practices
8. **Documentation:** Update documentation with production URLs

---

## Support

For deployment issues:
- Check platform-specific documentation
- Review logs for errors
- Test locally first
- Verify environment variables
- Check WebSocket compatibility

For questions:
- Check README.md for setup instructions
- Review platform documentation
- Test in development first
- Verify all requirements are met

