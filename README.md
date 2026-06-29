# Arteffects AI Visualizer

AI-powered room visualizer for the Arteffects stone & moulding website. Lets clients upload room photos and instantly see Arteffects products (marble, Gwalior stone, Moca Crema, columns, mouldings) applied to their space.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router v6, TanStack Query, Lucide icons |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Image storage | Cloudinary |
| AI generation | Stability AI (img2img) or Replicate |
| Authentication | JWT |

---

## Project Structure

```
arteffects/
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
MONGODB_URI=mongodb://localhost:27017/arteffects
JWT_SECRET=your_random_secret_32_chars_min

# Cloudinary — create free account at cloudinary.com
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# AI Generation — pick ONE:
# Option A: Stability AI (https://platform.stability.ai)
STABILITY_API_KEY=sk-xxx

# Option B: Replicate (https://replicate.com)
REPLICATE_API_TOKEN=r8_xxx

CLIENT_URL=http://localhost:3000
```

### 3. Create first admin account

Start MongoDB, then run:

```bash
cd server && node -e "
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await User.create({ name: 'Joe Arteffects', email: 'admin@arteffects.in', password: 'ArtEffects@2024', role: 'admin' });
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

```bash
# From root
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

---

## AI Generation Setup

The visualizer uses **image-to-image AI** to apply stone textures to uploaded room photos.

### Option A: Stability AI (Recommended)
1. Sign up at https://platform.stability.ai
2. Create API key
3. Set `STABILITY_API_KEY=sk-xxx` in `.env`
4. Uses `stable-diffusion-xl-1024-v1-0` img2img endpoint

### Option B: Replicate
1. Sign up at https://replicate.com
2. Create API token
3. Set `REPLICATE_API_TOKEN=r8_xxx` in `.env`

### Demo mode (no API key)
If no AI key is configured, the tool returns the original photo. Useful for testing the UI flow without AI costs.

**Prompt strategy**: The server builds a detailed prompt from selected products:
- Material name, category, finish type
- Zone (floor/wall/pillar/etc.)
- Neoclassical preset descriptions
- Realism modifiers: preserve lighting, room proportions, shadows

---

## Features

### Client Flow
1. **Upload** — drop or tap to upload room photo (JPG/PNG, up to 15MB)
2. **Select** — choose zone (floor/wall/ceiling/pillar/etc.) then product from live inventory
3. **Presets** — one-click neoclassical transformations: Ionic columns, cornice, wainscoting
4. **Generate** — AI applies materials in 10–15 seconds
5. **Download** — HD watermarked render with Arteffects branding
6. **Quote** — pre-filled quote form with selected SKUs, area estimator, total

### Admin Panel (`/admin`)
- Dashboard with stats (users, products, renders, new quotes)
- Add / edit / remove products with texture upload
- Full quote CRM: new → contacted → quoted → won / lost
- User management
- One-click sample data seed

### Render Persistence
- Renders saved to MongoDB for **30 days** (TTL index)
- Logged-in users see full history at `/dashboard`
- Shareable public links (`/view/:token`) for WhatsApp sharing

---

## API Endpoints

### Public
```
GET  /api/products          List products (filter: category, grade, zone)
GET  /api/products/:id      Product detail
POST /api/auth/register     Create account
POST /api/auth/login        Login
GET  /api/renders/shared/:token  Public render view
POST /api/quotes            Submit quote (no auth required)
```

### Authenticated
```
GET  /api/auth/me           Current user
GET  /api/renders           My renders
POST /api/visualizer/upload Upload room photo
POST /api/visualizer/generate  Generate visualization
```

### Admin only
```
GET  /api/admin/dashboard   Stats
POST /api/products          Create product
PATCH /api/products/:id     Update product
DELETE /api/products/:id    Soft-delete
GET  /api/quotes            All quotes
PATCH /api/quotes/:id/status  Update quote status
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
- Atlas connection string: `mongodb+srv://user:pass@cluster.mongodb.net/arteffects`

---

## Mobile Optimization

The UI is fully mobile-first:
- Dropzone supports tap-to-upload on iOS/Android
- Sticky product selector panel collapses on mobile
- WhatsApp-friendly share links
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

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Random 32+ char string |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary account |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary secret |
| `STABILITY_API_KEY` | One of | Stability AI key |
| `REPLICATE_API_TOKEN` | One of | Replicate token |
| `CLIENT_URL` | Yes | Frontend URL for CORS |
| `PORT` | No | Server port (default 5000) |
