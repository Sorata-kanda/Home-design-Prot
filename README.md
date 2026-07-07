# Stratum AI Room Visualizer for DSYN Luxury

AI-powered room visualizer for the DSYN Luxury stone & moulding website. Lets clients upload room photos and instantly see DSYN Luxury products (marble, Gwalior stone, Moca Crema, columns, mouldings) applied to their space.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router v6, TanStack Query, Lucide icons |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose (Optimized with `.lean()` & pagination) |
| Image storage | Cloudinary |
| Local AI & Mapping | FastAPI, PyTorch, SegFormer, OpenCV (LAB Color Space) |
| Authentication | Google OAuth 2.0 & JWT with Resend Email OTP |
| Payments | Razorpay SDK & Secure API Integration |

---

## Project Structure

```
dsyn-stratum/
├── server/                 # Express backend
│   ├── index.js            # Entry point, middleware
│   ├── models/
│   │   ├── User.js         # Client accounts
│   │   ├── Product.js      # Stone & moulding SKUs
│   │   ├── Render.js       # AI-generated visualizations
│   │   └── Quote.js        # Quote requests
│   ├── routes/
│   │   ├── auth.js         # Register, login, profile
│   │   ├── products.js     # CRUD + catalogue
│   │   ├── visualizer.js   # Upload, segment, generate
│   │   ├── renders.js      # Save, share renders
│   │   ├── quotes.js       # Quote submission + CRM
│   │   └── admin.js        # Dashboard, stats, seed
│   ├── segment_api.py      # Python AI Microservice (FastAPI)
│   └── middleware/
│       ├── auth.js         # JWT protect, adminOnly
│       └── upload.js       # Cloudinary + multer
│
└── client/                 # React frontend
    └── src/
        ├── pages/
        │   ├── HomePage.js        # Landing page
        │   ├── VisualizerPage.js  # Core 3-step tool
        │   ├── ProductsPage.js    # Browse catalogue
        │   ├── DashboardPage.js   # My renders
        │   ├── LoginPage.js
        │   ├── RegisterPage.js
        │   ├── SharedRenderPage.js  # Public share link
        │   └── AdminPage.js       # Admin panel
        ├── components/
        │   ├── shared/Navbar.js
        │   └── visualizer/QuoteModal.js
        ├── context/AuthContext.js
        └── utils/api.js           # All API calls
```

---

## Setup

### 1. Install dependencies

```bash
# Root
npm install

# Install all packages
npm run install:all
```

### 2. Configure environment

```bash
cd server
cp .env.example .env
```

Fill in `.env`:

```
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/dsyn

# JWT
JWT_SECRET=your_random_secret_32_chars_min
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Admin Credentials
ADMIN_EMAIL=admin@dsyn.com
ADMIN_PASSWORD=your_password

# Watermark text
WATERMARK_TEXT=DSYN

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com

# Resend API Key for Email OTP Verification
RESEND_API_KEY=re_your_api_key_here

# Razorpay Keys
RAZORPAY_KEY_ID=rzp_test_yourkey
RAZORPAY_KEY_SECRET=your_razorpay_secret

# AI Fallback Rendering APIs (Required for full pipeline)
STABILITY_API_KEY=your_stability_key_here
REPLICATE_API_TOKEN=your_replicate_token_here

# Python microservice connection URL
PYTHON_API_URL=http://localhost:8000
```

### 3. Create first admin account

Start MongoDB, then run:

```bash
cd server && node -e "
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await User.create({ name: 'Admin', email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, role: 'admin' });
  console.log('Admin created');
  process.exit();
});
"
```

### 4. Seed sample products

```bash
# Start the server first, then:
curl -X POST http://localhost:5000/api/admin/seed \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"
```

Or log in as admin on the website → Admin panel → click "Seed sample data".

### 5. Run in development

First, start the Python FastAPI AI microservice:
```bash
cd server
# Activate your virtual environment:
.\venv\Scripts\Activate.ps1
# Install requirements
pip install -r requirements.txt
# Start the server:
python segment_api.py
```

Then, in a new terminal, start the Node/Express backend and React frontend:
```bash
# From root
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000
- Python API: http://localhost:8000

---

## AI & Texture Mapping Pipeline

The visualizer uses a highly optimized hybrid **SegFormer (Ade20k) + OpenCV LAB Color Space** mapping pipeline to apply product textures realistically in O(1) inference time:

### 1. SegFormer Segmentation
* Pre-loaded globally in the FastAPI service (`segment_api.py`).
* Model runs in `.half()` precision on CUDA for 50% VRAM reduction.
* Runs **once** globally per base image to map all room components (walls, floors, ceiling, pillars), rather than re-running per applied material.

### 2. OpenCV LAB Color Space Mapping
* Takes the product's Cloudinary SKU texture image (utilizes local temp caching to avoid redundant downloads).
* Converts both the original room photo (cropped to mask bounding box) and the tiled texture to the **LAB Color Space** to isolate lightness (`L`).
* Calculates a dynamic `lighting_ratio` map from the original wall's lighting patterns.
* Multiplies the product texture's `L` channel by this ratio, perfectly projecting original highlights, shadows, and ambient occlusion onto the new texture.
* Aggressive `gc.collect()` prevents memory leaks from massive NumPy tile arrays.

---

## Features

### Client Flow
1. **Upload** — drop or tap to upload room photo (JPG/PNG, up to 15MB)
2. **Select** — choose zone (floor/wall/ceiling/pillar/etc.) then product from live inventory
3. **Presets** — one-click neoclassical transformations: Ionic columns, cornice, wainscoting
4. **Generate** — AI applies materials in seconds
5. **Cart & Checkout** — add selected materials to a persistent cart and securely pay via **Razorpay** checkout
6. **Download** — HD watermarked render with DSYN Luxury branding
7. **Quote** — pre-filled quote form with selected SKUs, area estimator, total

### Admin Panel (`/admin`)
- Dashboard with stats (users, products, renders, new quotes). Queries optimized with `.lean()`.
- Add / edit / remove products with texture upload
- Full quote CRM: new → contacted → quoted → won / lost
- User management (Paginated)
- One-click sample data seed

### Render Persistence
- Renders saved to MongoDB for **30 days** (TTL index auto-cleanup)
- Logged-in users see full history at `/dashboard`
- Shareable public links (`/view/:token`) for WhatsApp sharing

---

## API Endpoints

### Public (Node.js Backend)
```
GET  /api/products          List products (filter: category, grade, zone)
GET  /api/products/:id      Product detail
POST /api/auth/register     Create account (triggers Resend OTP)
POST /api/auth/login        Login (requires verified account)
POST /api/auth/google       OAuth 2.0 login / auto-registration
POST /api/auth/verify-otp   Verify registration code
POST /api/auth/resend-otp   Resend registration code
GET  /api/renders/shared/:token  Public render view
POST /api/quotes            Submit quote (no auth required)
```

### Authenticated (Node.js Backend)
```
GET  /api/auth/me           Current user
GET  /api/renders           My renders
POST /api/visualizer/upload Upload room photo
POST /api/visualizer/generate  Generate visualization
```

### Admin only (Node.js Backend)
```
GET  /api/admin/dashboard   Stats
POST /api/products          Create product
PATCH /api/products/:id     Update product
DELETE /api/products/:id    Soft-delete
GET  /api/quotes            All quotes
PATCH /api/quotes/:id/status  Update quote status
```

### Python AI Microservice (FastAPI)
Runs locally on `http://localhost:8000` (or `PYTHON_API_URL`):
```
POST /segment               Accepts photo URL. Returns Ade20k semantic segmentation masks & room coverage data.
POST /generate              Accepts photo URL and array of applied zones & textures. Returns finalized rendered image.
```

---

## Deployment

### Backend (Railway / Render / EC2)
```bash
cd server
npm start
```
Set all env vars in the platform dashboard.

### Frontend (Vercel / Netlify)
```bash
cd client
REACT_APP_API_URL=https://your-api-domain.com/api npm run build
```

Set `CLIENT_URL=https://your-frontend-domain.com` on server.

### MongoDB
- Local MongoDB or MongoDB Atlas (free tier works fine)
- Atlas connection string: `mongodb+srv://user:pass@cluster.mongodb.net/dsyn`

---

## Mobile Optimization

The UI is fully mobile-first:
- Native page scrolling restored for material selection process
- Dropzone supports tap-to-upload on iOS/Android
- Sticky product selector panel collapses on mobile
- WhatsApp-friendly share links with responsive stacked "Before & After" layouts
- PWA-ready meta tags

---

## Adding New Products (Admin)

1. Go to `/admin` → Products tab
2. Click "Add product"
3. Fill: SKU, name, category, price per sq.ft, finish, grade, zones
4. Upload a high-res texture image (the AI uses this for material reference)
5. Mark as "Neoclassical preset" if it should appear in the one-click presets
6. Save — it appears immediately in the visualizer inventory

---

## Quote CRM Workflow

Quotes come in at `/admin` → Quotes tab. Status flow:
```
new → contacted → quoted → won
                         ↘ lost
```

Each quote includes: contact details, city, selected SKUs with area estimates, photo render thumbnail, and an auto-calculated estimate.

---

## Environment Variables Reference

### Backend (`server/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Random 32+ char token signing key |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud namespace |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `GOOGLE_CLIENT_ID` | Yes | Google Developer Console OAuth Client ID |
| `RESEND_API_KEY` | Yes | Resend API Key for Email OTP Verification |
| `RAZORPAY_KEY_ID` | Yes | Razorpay Gateway Key ID |
| `RAZORPAY_KEY_SECRET`| Yes | Razorpay Gateway Key Secret |
| `STABILITY_API_KEY` | No | Required if using the SDXL fallback pipeline |
| `REPLICATE_API_TOKEN` | No | Required if using the Replicate fallback pipeline |
| `PYTHON_API_URL` | No | Python microservice URL (default: `http://localhost:8000`) |
| `CLIENT_URL` | Yes | React Frontend URL for CORS |
| `PORT` | No | Server port (default 5000) |

### Frontend (`client/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_GOOGLE_CLIENT_ID` | Yes | Google Developer Console OAuth Client ID |
