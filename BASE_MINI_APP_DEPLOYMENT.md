# NovaLance - Base Mini App Deployment Guide

## 🚀 Ready to Deploy!

Your NovaLance project has been successfully converted to a Base Mini App. Follow these steps to deploy to Vercel and register on Base.

## ✅ What's Been Done

- ✅ Installed `@coinbase/onchainkit` with MiniKit support
- ✅ Added MiniKit Provider to `app/layout.tsx`
- ✅ Implemented frame readiness in `app/page.tsx`
- ✅ Created Farcaster manifest route at `app/.well-known/farcaster.json/route.ts`
- ✅ Created app assets (icon, splash, OG image, hero)
- ✅ Updated RootLayout with safe area support
- ✅ Created `.env.local` with all required configuration

## 📦 Deploy to Vercel

### Option 1: Using Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel

# When prompted:
# - Set up and deploy? Y
# - Which scope? Select your account
# - Link to existing project? N
# - Project name: novalance-base-mini-app
# - In which directory is your code located? . (current directory)
# - Want to override settings? N
```

### Option 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository (or upload from CLI)
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (or `next build`)
   - **Output Directory**: `.next`

5. Click "Deploy"

### Option 3: Direct GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Vercel will auto-detect Next.js settings
5. Click "Deploy"

## 🔧 Configure Environment Variables on Vercel

After deploying, add these environment variables in Vercel Dashboard:

1. Go to your project → Settings → Environment Variables
2. Add the following:

```env
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=NovaLance
NEXT_PUBLIC_APP_SUBTITLE=Web3 Freelance Marketplace on Base
NEXT_PUBLIC_APP_DESCRIPTION=A futuristic freelance marketplace powered by Base blockchain
NEXT_PUBLIC_APP_ICON=/icon.svg
NEXT_PUBLIC_APP_SPLASH_IMAGE=/splash.svg
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=#0052FF
NEXT_PUBLIC_APP_PRIMARY_CATEGORY=Marketplace
NEXT_PUBLIC_APP_TAGLINE=Freelance reimagined on Base
NEXT_PUBLIC_APP_OG_TITLE=NovaLance - Web3 Freelance Marketplace
NEXT_PUBLIC_APP_OG_DESCRIPTION=Find jobs, hire talent, onchain
NEXT_PUBLIC_APP_OG_IMAGE=/og-image.svg
NEXT_PUBLIC_APP_HERO_IMAGE=/hero.svg

# Important: Update this to your Vercel URL!
NEXT_PUBLIC_URL=https://your-app.vercel.app
```

3. Redeploy after adding variables

## 📝 Register on Base Build (for Hackathon)

### Step 1: Get Farcaster Manifest Credentials (Optional but Recommended)

1. Go to [Warpcast Developer Portal](https://warpcast.com/~/developers/manifests)
2. Create a new manifest
3. Copy the `header`, `payload`, and `signature`
4. Add them to your Vercel environment variables:
   - `FARCASTER_HEADER`
   - `FARCASTER_PAYLOAD`
   - `FARCASTER_SIGNATURE`

### Step 2: Register on Base Build

1. Go to [base.org/build](https://base.org/build)
2. Connect your wallet (make sure it's the same as your Farcaster account)
3. Click "Import App" or "Add Mini App"
4. Enter your deployed URL: `https://your-app.vercel.app`
5. Verify ownership (Base will guide you through this)
6. Fill in app details:
   - **Name**: NovaLance
   - **Description**: Web3 Freelance Marketplace on Base
   - **Category**: Marketplace
   - **Tags**: freelance, jobs, web3, base

### Step 3: Update Manifest with Base Builder Address

After verification, Base will provide you with a `baseBuilder` object. Update your `route.ts`:

```typescript
baseBuilder: {
  allowedAddresses: [
    "0x...yourVerifiedAddress..."
  ],
}
```

## 🧪 Test Your Mini App

### Local Testing

```bash
npm run dev
```

Visit `http://localhost:3000` and check:
- [ ] Page loads without errors
- [ ] MiniKit context is available
- [ ] Safe areas are applied
- [ ] Frame readiness is signaled

### Production Testing

1. Visit your Vercel URL
2. Open browser DevTools → Console
3. Check for MiniKit initialization
4. Test on mobile device in Base App (if available)

### Test Manifest

Visit: `https://your-app.vercel.app/.well-known/farcaster.json`

You should see a JSON response with your app configuration.

## 📊 Analytics (After Registration)

Once registered on Base Build:
1. Go to [base.org/build](https://base.org/build)
2. Select your app
3. View analytics for:
   - Installs
   - Usage
   - Retention
   - User behavior

## 🐛 Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### MiniKit Not Loading

- Check that `@coinbase/onchainkit` is installed
- Verify `OnchainKitProvider` wraps your app
- Check browser console for errors

### Manifest Not Accessible

- Verify the route exists: `app/.well-known/farcaster.json/route.ts`
- Check that environment variables are set on Vercel
- Test the manifest endpoint directly

### Safe Areas Not Working

- Ensure `useMiniKit()` is called in a client component
- Check that the component has `'use client'` directive
- Verify context is being passed correctly

## 📚 Resources

- [Base MiniKit Docs](https://docs.base.org/onchainkit/latest/components/minikit/overview)
- [Base Mini App Guide](https://docs.base.org/cookbook/converting-customizing-mini-apps)
- [Vercel Deployment Docs](https://vercel.com/docs)

## 🎯 Hackathon Checklist

- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Environment variables configured
- [ ] Manifest accessible at `/.well-known/farcaster.json`
- [ ] Registered on Base Build
- [ ] Tested on mobile (if possible)
- [ ] Analytics working (check Base Build dashboard)
- [ ] Ready for demo!

## 🚀 Quick Deploy Command

```bash
# One-line deploy (if Vercel CLI is installed)
vercel --prod
```

Good luck with the hackathon! 🎉
