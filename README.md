# PixelPlace.in 🎨

A pixel-based advertising platform where users can purchase pixel space to display their logos and promote their brands.

![PixelPlace](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue) ![Razorpay](https://img.shields.io/badge/Razorpay-Enabled-635BFF)

## ✨ Features

- 🎨 **Interactive 50x50 Pixel Grid** - Click to select and purchase pixels
- 💳 **Razorpay Payment Integration** - Secure checkout with Razorpay
- 🔐 **User Authentication** - Sign up and login system
- 📊 **User Dashboard** - View and manage your purchased pixels
- 💰 **Dynamic Pricing** - Real-time price calculation (₹83 per pixel / $1)
- 🎯 **Modern UI/UX** - Beautiful, responsive design with Tailwind CSS & Framer Motion
- 📱 **Mobile Responsive** - Works on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Razorpay account

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.local.example .env.local
```

3. **Configure `.env.local`:**
   - MongoDB URI (replace `<db_username>` and `<db_password>` in the connection string)
   - Razorpay API keys (get from https://dashboard.razorpay.com/)
   - JWT secret (generate a random string)
   - App URL

4. **Run development server:**
```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 📖 Detailed Setup

See [SETUP.md](./SETUP.md) for comprehensive setup instructions including:
- MongoDB configuration
- Razorpay webhook setup
- Production deployment
- Customization options

## 🏗️ Project Structure

```
pixel_place/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── pixels/       # Pixel management
│   │   ├── checkout/     # Razorpay checkout
│   │   ├── payment/      # Payment verification
│   │   └── webhook/      # Razorpay webhook
│   ├── canvas/           # Main pixel canvas page
│   ├── dashboard/        # User dashboard
│   ├── login/            # Login page
│   └── signup/           # Signup page
├── components/           # React components
│   └── PixelGrid.tsx     # Interactive pixel grid
├── lib/                  # Utilities
│   ├── auth.ts           # Authentication helpers
│   ├── db.ts             # MongoDB connection
│   ├── pixels.ts         # Pixel management
│   ├── razorpay.ts       # Razorpay integration
│   └── constants.ts      # Client-safe constants
└── package.json
```

## 💡 Usage

1. **Sign Up** - Create an account
2. **Browse Canvas** - View the 50x50 pixel grid
3. **Select Pixels** - Click on available pixels to select them
4. **Checkout** - See total price and proceed to Razorpay checkout
5. **Manage** - View your pixels in the dashboard

## ⚙️ Configuration

### Change Grid Size
Edit `lib/pixels.ts`:
```typescript
export const GRID_SIZE = 50 // Your desired size
```

### Change Pixel Price
Edit `lib/constants.ts`:
```typescript
export const PIXEL_PRICE = 1 // Your desired price in USD
```

## 🔒 Security

- Passwords are hashed with bcrypt
- JWT tokens for authentication
- Razorpay handles all payment processing
- MongoDB for secure data storage
- Payment signature verification for security

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** MongoDB
- **Payments:** Razorpay
- **Authentication:** JWT
- **Icons:** Lucide React
- **Animations:** Framer Motion

## 📝 License

This project is private and proprietary.

## 🤝 Support

For setup help, see [SETUP.md](./SETUP.md) or check the code comments.

