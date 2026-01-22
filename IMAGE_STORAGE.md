# Image Storage with MongoDB GridFS

## Overview

We're using **MongoDB GridFS** (free, built into MongoDB) to store images efficiently. This is better than storing base64 images directly in documents because:

- ✅ **No size limits** - GridFS can store files up to 16MB per chunk (automatically handles larger files)
- ✅ **Free** - Uses your existing MongoDB database
- ✅ **Efficient** - Only stores large images in GridFS, small ones stay as base64
- ✅ **No external services needed** - Everything in one place

## How It Works

1. **Small images (< 100KB)**: Stored as base64 in the pixel document (fast access)
2. **Large images (≥ 100KB)**: Stored in MongoDB GridFS, only file ID stored in document

## Storage Limits

- **MongoDB Atlas Free Tier**: 512MB storage
- **GridFS**: Automatically chunks files, can handle large images
- **Recommended**: Keep images optimized (compress before upload)

## Image Optimization Tips

To save space and improve performance:

1. **Compress images** before upload (use tools like TinyPNG, ImageOptim)
2. **Use appropriate formats**:
   - PNG for logos with transparency
   - JPEG for photos
   - WebP for best compression (if supported)
3. **Resize images** to reasonable dimensions (e.g., 500x500px max for logos)

## API Endpoints

### Upload Image
```
POST /api/images/upload
Authorization: Bearer <token>
Body: { imageData: "data:image/png;base64,...", filename: "logo.png" }
Response: { fileId: "507f1f77bcf86cd799439011" }
```

### Get Image
```
GET /api/images/[fileId]
Response: { imageUrl: "data:image/png;base64,..." }
```

## Migration

Existing base64 images will continue to work. New large images will automatically be stored in GridFS.

## Free Alternatives (if you need more storage)

If you exceed MongoDB's free tier:

1. **Cloudinary** - Free tier: 25GB storage, 25GB bandwidth/month
2. **Imgur API** - Free, unlimited storage
3. **AWS S3** - Free tier: 5GB storage, 20,000 GET requests/month
4. **Cloudflare R2** - Free tier: 10GB storage, 1M Class A operations/month

