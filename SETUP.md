# PixelPlace.in Setup Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB database (local or MongoDB Atlas)
- Stripe account

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:

#### MongoDB
- **MONGODB_URI**: Your MongoDB connection string
  - Local: `mongodb://localhost:27017/pixelplace`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/pixelplace`

#### JWT Secret
- **JWT_SECRET**: Generate a random string (e.g., use `openssl rand -base64 32`)

#### Stripe Configuration
1. Go to https://dashboard.stripe.com/apikeys
2. Get your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
3. Get your **Secret Key** (starts with `sk_test_` or `sk_live_`)
4. Add them to `.env.local`:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`

#### App URL
- **NEXT_PUBLIC_APP_URL**: Your app URL
  - Development: `http://localhost:3000`
  - Production: `https://pixelplace.in`

#### NextAuth (Optional, for future enhancements)
- **NEXTAUTH_URL**: Same as `NEXT_PUBLIC_APP_URL`
- **NEXTAUTH_SECRET**: Generate another random string

### 3. Stripe Webhook Setup

For production, you need to configure Stripe webhooks:

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/webhook`
4. Select events: `checkout.session.completed`
5. Copy the **Webhook Signing Secret** and add to `.env.local`:
   - `STRIPE_WEBHOOK_SECRET`

**Note**: For local development, use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Build for Production

```bash
npm run build
npm start
```

## Features

✅ User authentication (signup/login)  
✅ Interactive 50x50 pixel grid  
✅ Pixel selection and purchase  
✅ Stripe payment integration  
✅ User dashboard  
✅ Price display ($1 per pixel)  
✅ Modern, responsive UI  

## Customization

### Change Grid Size
Edit `lib/pixels.ts`:
```typescript
export const GRID_SIZE = 50 // Change to your desired size
```

### Change Pixel Price
Edit `lib/pixels.ts`:
```typescript
export const PIXEL_PRICE = 1 // Change to your desired price
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running (if local)
- Check your connection string
- Verify network access (for Atlas)

### Stripe Payment Issues
- Verify API keys are correct
- Check webhook configuration
- Ensure webhook secret is set (for production)

### Authentication Issues
- Clear browser localStorage
- Check JWT_SECRET is set
- Verify token expiration (default: 7 days)

## Support

For issues or questions, check the codebase or create an issue.

