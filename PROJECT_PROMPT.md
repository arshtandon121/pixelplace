# PixelPlace Website - Complete Feature Prompt

## Project Overview
Create a "Million Dollar Homepage" style website where users can purchase pixel space on a shared canvas to display their logos and promote their brands. Users click on pixels, upload their logo, pay, and their logo appears on the main canvas for everyone to see.

## Core Features

### 1. Pixel Canvas System
- **50x50 pixel grid** (2,500 total pixels)
- Each pixel is 12px × 12px on screen
- Visual grid with borders showing individual pixels
- Real-time display of owned vs available pixels
- Gray blocks for owned pixels without images
- Transparent background for pixels with logos

### 2. Smart Pixel Selection
- **Auto-select largest available block**: When user clicks any pixel, automatically select the largest contiguous available area
- **Block size**: 10 pixels wide × 5 pixels tall (50 pixels total)
- If clicked pixel doesn't have enough space, expand to find largest available block
- Selected pixels highlighted in primary color (blue)
- Show selection count and total price dynamically

### 3. Image Upload & Preview
- **Image upload button** before payment
- Accept image files (PNG, JPEG, GIF, WebP)
- Convert to base64 for preview
- **Live preview overlay**: Show uploaded image as overlay covering all selected pixels
- Preview shows combined image covering entire selected block (not individual pixels)
- If multiple disconnected blocks selected, show separate overlay for each block
- Yellow dashed border on preview to indicate it's a preview
- Image is required before proceeding to payment

### 4. Payment Integration (Razorpay)
- **Razorpay payment gateway** integration
- Price: ₹83 per pixel (or $1 per pixel)
- Display total price in both USD and INR
- Payment modal with Razorpay checkout
- Payment verification on server
- Store payment records in database

### 5. Image Storage
- **MongoDB GridFS** for large images (≥50KB)
- Small images (<50KB) stored as base64 in database
- Automatic detection and storage in GridFS
- Images served via `/api/images/[fileId]` endpoint
- Proper content-type headers for direct image display

### 6. User Authentication
- **Login/Signup pages** with JWT authentication
- Email and password authentication
- Protected routes (canvas, dashboard)
- User session management
- Logout functionality

### 7. Canvas Display
- **Combined image overlays**: Owned pixels with same image grouped into contiguous blocks
- Each block displays as single overlay image (not individual pixel images)
- Images load from GridFS or base64
- Click on logo to visit link URL (if provided)
- Hover effects and visual feedback

### 8. Home Page
- **Live canvas preview**: Shows all existing logos on main page
- Beautiful hero section with gradient backgrounds
- Call-to-action buttons
- Feature cards explaining the concept
- Fast loading with optimized queries

### 9. Dashboard
- View all pixels owned by logged-in user
- Display purchase history
- Show total pixels owned
- Links to canvas for purchasing more

### 10. Link URLs
- Optional link URL field during checkout
- When users click on a logo, open the link in new tab
- Stored with pixel purchase

## Technical Requirements

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Hot Toast** for notifications
- Client-side components for interactivity

### Backend
- **Next.js API Routes** for backend logic
- **MongoDB** for data storage
- **MongoDB GridFS** for image storage
- **JWT** for authentication
- **Razorpay** for payments

### Database Schema
- **pixels collection**: x, y, userId, imageUrl (small), imageFileId (GridFS), linkUrl, purchasedAt, price
- **users collection**: email, password (hashed), name, createdAt
- **purchases collection**: userId, orderId, paymentId, pixelCount, coordinates, imageUrl, linkUrl, purchasedAt
- **pending_orders collection**: tempOrderId, userId, pixels, imageFileId, imageUrl, linkUrl, razorpayOrderId, expiresAt

### Performance Optimizations
- Database indexes on (x, y), userId, imageUrl
- Query projection to only fetch needed fields
- Memoized calculations for overlay rendering
- Lazy loading for images
- Cache headers for API responses
- Batch operations for pixel updates

### UI/UX Features
- Modern gradient backgrounds (purple, blue, pink)
- Smooth animations and transitions
- Responsive design
- Loading states
- Error handling with user-friendly messages
- Tooltips and hover effects
- Custom scrollbars
- Glassmorphism effects (backdrop blur)

## Key User Flows

### Purchase Flow
1. User clicks on any pixel
2. System auto-selects largest available 10×5 block
3. User uploads logo image
4. Preview appears on selected pixels
5. User optionally adds link URL
6. User clicks "Proceed to Payment"
7. Razorpay modal opens
8. User completes payment
9. Payment verified on server
10. Pixels purchased and logo appears on canvas

### Viewing Flow
1. User visits home page
2. Sees live canvas preview with all logos
3. Can click "View Canvas" to see full interactive canvas
4. Can click on any logo to visit its link (if provided)

## API Endpoints

- `GET /api/pixels` - Get all pixels with images (optimized, no large base64)
- `GET /api/pixels/user` - Get user's pixels
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/checkout` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment and purchase pixels
- `GET /api/images/[fileId]` - Get image from GridFS
- `POST /api/images/upload` - Upload image to GridFS

## Environment Variables Needed

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pixelplace
JWT_SECRET=your_jwt_secret_here
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

## Design Guidelines

- **Color Scheme**: Primary blue (#0ea5e9), Purple gradients, Pink accents
- **Typography**: Modern sans-serif, bold headings
- **Spacing**: Generous padding and margins
- **Shadows**: Subtle shadows for depth
- **Borders**: Rounded corners (rounded-xl, rounded-2xl)
- **Animations**: Smooth fade-ins, scale effects on hover
- **Grid**: Clean, minimal grid lines

## Special Features

1. **Contiguous Block Detection**: BFS algorithm to find connected pixel groups
2. **Image Overlay System**: Groups pixels by image and creates combined overlays
3. **Smart Image Storage**: Automatically uses GridFS for large images
4. **Performance**: Optimized queries, indexes, memoization
5. **Error Handling**: Graceful error messages, fallbacks

## Example Prompt for AI

"Create a Next.js 14 website called PixelPlace where users can purchase pixel space on a 50×50 grid canvas to display their logos. Key features:

1. Interactive pixel grid where clicking any pixel auto-selects the largest available 10×5 block
2. Image upload with live preview overlay showing the logo on selected pixels
3. Razorpay payment integration (₹83 per pixel)
4. MongoDB + GridFS for storing images efficiently
5. User authentication (login/signup with JWT)
6. Home page showing live canvas preview of all logos
7. Combined image overlays - pixels with same logo grouped into single overlay blocks
8. Optional link URLs that open when logo is clicked
9. Modern UI with gradients, animations, and glassmorphism effects
10. Performance optimizations: database indexes, query projections, memoization

The canvas should show owned pixels as gray blocks, and logos as combined overlay images covering their pixel blocks. Users upload logo, see preview, pay, and their logo appears on the canvas for everyone to see."

