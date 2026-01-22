# Razorpay Setup Guide

## Environment Variables Required

You need to set the following environment variables in your `.env.local` file:

```env
# Razorpay Test/Live Key ID (Public Key - safe to expose in client)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# Razorpay Key Secret (Private - NEVER expose this)
RAZORPAY_KEY_SECRET=your_key_secret_here

# For server-side operations, you also need:
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

## Getting Your Razorpay Keys

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings** → **API Keys**
3. Create a new key pair (or use existing test keys)
4. Copy the **Key ID** and **Key Secret**

## Important Notes

- **Test Mode**: Keys starting with `rzp_test_` are for testing
- **Live Mode**: Keys starting with `rzp_live_` are for production
- **Key ID**: This is public and safe to use in client-side code (NEXT_PUBLIC_ prefix)
- **Key Secret**: This is private and should NEVER be exposed in client-side code
- Both `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID` should have the same value (the Key ID)

## Troubleshooting 401 Unauthorized Error

If you're getting a 401 error:

1. **Check if keys are set**: Make sure both `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are in your `.env.local`
2. **Restart dev server**: After adding/changing env variables, restart `npm run dev`
3. **Verify key format**: Key ID should start with `rzp_test_` or `rzp_live_`
4. **Check key pair**: Make sure the Key ID and Key Secret are from the same key pair
5. **Test vs Live**: Make sure you're using test keys in development

## Example .env.local

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_1234567890ABCDEF
RAZORPAY_KEY_ID=rzp_test_1234567890ABCDEF
RAZORPAY_KEY_SECRET=abcdef1234567890abcdef1234567890
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pixelplace
JWT_SECRET=your_jwt_secret_here
```

