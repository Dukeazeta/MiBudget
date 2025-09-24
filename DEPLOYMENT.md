# MiBudget - Vercel Deployment Guide

This guide provides step-by-step instructions for deploying MiBudget to Vercel.

## Prerequisites

- Node.js 18+ installed locally
- Git repository with your MiBudget code
- Vercel account (free tier available)
- GitHub/GitLab account (recommended for automatic deployments)

## Project Structure

MiBudget is a monorepo with the following structure:
```
MiBudget/
├── apps/
│   ├── server/          # Express.js API (deploy separately)
│   └── web/            # React frontend (deploy to Vercel)
├── packages/
│   ├── shared/         # Shared types and utilities
│   └── db/            # Database layer
└── package.json        # Root package.json with pnpm workspaces
```

## Deployment Steps

### Step 1: Prepare Your Repository

1. **Push your code to GitHub/GitLab:**
   ```bash
   git add .
   git commit -m "feat: prepare for Vercel deployment"
   git push origin main
   ```

2. **Ensure your `apps/web/package.json` has the correct build script:**
   ```json
   {
     "scripts": {
       "build": "tsc && vite build",
       "dev": "vite",
       "preview": "vite preview"
     }
   }
   ```

### Step 2: Create Vercel Project

1. **Visit [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your Git repository** (GitHub/GitLab)
4. **Configure the project settings:**

### Step 3: Vercel Configuration

Create a `vercel.json` file in the **repository root** (not in apps/web):

```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/web/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/.*",
      "dest": "/apps/web/dist/index.html"
    }
  ],
  "buildCommand": "cd apps/web && pnpm build",
  "devCommand": "cd apps/web && pnpm dev",
  "installCommand": "pnpm install",
  "outputDirectory": "apps/web/dist"
}
```

### Step 4: Environment Variables

In your Vercel dashboard, add these environment variables:

**Build Environment Variables:**
- `NODE_VERSION`: `18`
- `PNPM_VERSION`: `8`

**Runtime Environment Variables (if needed):**
- `VITE_API_URL`: Your API endpoint URL (if deploying server separately)

### Step 5: Build Settings in Vercel Dashboard

**Framework Preset:** Other

**Root Directory:** Leave blank (Vercel will use the repository root)

**Build Command:**
```bash
pnpm install && pnpm --filter shared build && pnpm --filter mibudget-web build
```

**Install Command:**
```bash
pnpm install
```

**Output Directory:**
```
apps/web/dist
```

### Step 6: Deploy

1. **Click "Deploy"** in your Vercel dashboard
2. **Wait for the build to complete** (first build may take 3-5 minutes)
3. **Visit your deployed URL** (provided by Vercel)

## Alternative: Manual Deployment

If you prefer to deploy manually:

### Option 1: Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from repository root:**
   ```bash
   vercel --prod
   ```

### Option 2: Build and Deploy Manually

1. **Build the project locally:**
   ```bash
   # From repository root
   pnpm install
   pnpm build
   ```

2. **Deploy the dist folder:**
   ```bash
   cd apps/web
   vercel --prod ./dist
   ```

## Troubleshooting

### Common Issues

**1. Build Fails - "pnpm command not found"**
- Solution: Add `PNPM_VERSION=8` environment variable in Vercel

**2. Build Fails - "Cannot find module '@mibudget/shared'"**
- Solution: Ensure build command builds shared packages first:
  ```bash
  pnpm --filter shared build && pnpm --filter mibudget-web build
  ```

**3. Build Succeeds but App Doesn't Load**
- Check browser console for errors
- Ensure `apps/web/dist/index.html` exists after build
- Verify routing configuration in `vercel.json`

**4. PWA Service Worker Issues**
- Ensure `vite-plugin-pwa` generates files correctly
- Check that service worker files are in the build output

### Build Optimization

**Speed up builds by caching node_modules:**

Add to `vercel.json`:
```json
{
  "functions": {
    "apps/web/dist/**": {
      "includeFiles": "node_modules/**"
    }
  }
}
```

## API Deployment (Optional)

If you want to deploy the Express.js API separately:

### Option 1: Vercel Serverless Functions

1. **Create `api/` folder in repository root**
2. **Move server code to serverless function format**
3. **Configure `vercel.json` for both frontend and API**

### Option 2: Separate API Deployment

Deploy the API to:
- Railway.app
- Render.com  
- Heroku
- DigitalOcean App Platform

Then update `VITE_API_URL` environment variable in Vercel.

## Production Checklist

- [ ] Repository pushed to Git
- [ ] `vercel.json` configured correctly
- [ ] Environment variables set in Vercel dashboard
- [ ] Build succeeds locally with `pnpm build`
- [ ] PWA manifest and service worker generated
- [ ] Routing works for SPA (Single Page Application)
- [ ] API endpoints configured (if using external API)
- [ ] Domain name configured (if using custom domain)

## Custom Domain (Optional)

1. **Go to your project in Vercel dashboard**
2. **Click "Domains"**  
3. **Add your custom domain**
4. **Configure DNS records as shown**
5. **Wait for SSL certificate generation**

## Support

- **Vercel Documentation:** https://vercel.com/docs
- **MiBudget Issues:** Open an issue in your repository
- **Vercel Community:** https://github.com/vercel/vercel/discussions

---

**Note:** This deployment setup assumes you're using the offline-first architecture where the web app can function independently. If you need the Express.js server, deploy it separately and configure the appropriate API endpoints.