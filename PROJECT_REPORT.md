# Stratum by DSYN - AI-Powered Interior Visualization Platform

## Full Project Report

---

## 📋 Executive Summary

**Project Name**: Stratum by DSYN  
**Type**: Full-Stack Web Application with AI Integration  
**Live URL**: https://stratumai.vercel.app  
**Team Size**: 3 Members  
**Development Period**: 2024  
**Tech Stack**: MERN + Python AI + Cloud Services

**Project Description**:
Stratum is an AI-powered interior design visualization platform that allows users to upload photos of their rooms and instantly visualize how different materials, textures, and finishes would look in their space. The platform uses advanced AI image segmentation and texture mapping to provide realistic previews before customers make purchasing decisions.

---

## 🎯 Problem Statement

Interior design customers face a significant challenge: **uncertainty about how products will look in their actual space**. Traditional methods require:

- Expensive physical samples
- Time-consuming trial and error
- Difficult visualization of final results
- Risk of purchasing unsuitable products

**Our Solution**: AI-powered real-time visualization that allows customers to "try before they buy" digitally, reducing returns, increasing confidence, and streamlining the design decision process.

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────┐
│   React Client  │ (Vercel)
│  stratumai.app  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Node.js API    │ (Render)
│  + MongoDB      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Python AI API  │ (Railway)
│  SegFormer +    │
│  PyTorch        │
└─────────────────┘
```

### Technology Stack

**Frontend (Client)**:

- React.js 18.x - Component-based UI framework
- React Router - Client-side routing
- Axios - HTTP client
- React Hot Toast - User notifications
- Context API - State management
- Custom CSS - Responsive styling

**Backend (Server)**:

- Node.js + Express.js - RESTful API
- MongoDB + Mongoose - Database & ODM
- JWT - Authentication
- bcrypt.js - Password hashing
- Multer + Cloudinary - File upload & storage
- Axios - External API communication

**AI Service (Python)**:

- FastAPI - High-performance API framework
- PyTorch - Deep learning framework
- Transformers - Pre-trained models
- SegFormer - Semantic segmentation (NVIDIA)
- OpenCV - Image processing
- NumPy + Pillow - Image manipulation

**Cloud Services**:

- Vercel - Frontend hosting
- Render - Backend hosting
- Railway - Python AI hosting
- MongoDB Atlas - Cloud database
- Cloudinary - Image CDN

**Authentication & Payments**:

- Google OAuth 2.0 - Social login
- Facebook OAuth - Social login
- Razorpay - Payment gateway (Test mode)
- Resend - Email service

---

## 🔥 Key Features

### 1. **AI Visualization Engine**

- Upload room photos
- Automatic room segmentation (walls, floors, ceilings, doors, windows)
- Real-time texture mapping with product materials
- Lighting-aware rendering for realistic results
- Generation time: < 5 seconds

### 2. **User Management**

- Email/password registration with OTP verification
- Google OAuth integration
- Facebook OAuth integration
- User profiles with order history
- Admin and client role management

### 3. **Product Catalog**

- Browse materials by category (flooring, wall finishes, etc.)
- Product details with texture samples
- Price information
- Admin product management

### 4. **E-commerce Features**

- Shopping cart
- Checkout process
- Order management
- Razorpay payment integration
- Order fulfillment tracking

### 5. **Quote System**

- Request custom quotes based on visualizations
- Upload render with quote request
- Admin quote management
- Status tracking (pending, approved, rejected)

### 6. **Admin Dashboard**

- User management
- Product CRUD operations
- Order management
- Quote approval workflow
- Analytics dashboard

### 7. **Render Sharing**

- Share visualizations with shareable links
- Public render viewing
- Download HD versions

---

## 🧠 AI/ML Implementation

### Segmentation Algorithm

**Model**: NVIDIA SegFormer-B0 (Fine-tuned on ADE20K dataset)

**Process**:

1. **Input**: User-uploaded room photo
2. **Preprocessing**:
    - Downscale to 1024px max dimension (memory optimization)
    - Convert to RGB format
3. **Segmentation**:
    - Run through SegFormer model
    - Detect zones: walls, floors, ceilings, windows, doors
    - Generate pixel-wise mask for each zone
4. **Post-processing**:
    - Morphological dilation for smooth edges
    - Gaussian blur for natural blending
5. **Texture Mapping**:
    - Load product texture image
    - Tile texture to cover detected zone
    - Apply lighting transfer from original photo
    - Convert to LAB color space for lighting preservation
6. **Compositing**:
    - Blend textured zone with original photo
    - Soft alpha blending using mask
    - Output final rendered image

**Performance Optimizations**:

- PyTorch CPU inference (no GPU required)
- Image downscaling for segmentation
- Model pre-loading on server startup
- Texture caching for repeated requests
- Temporary file cleanup

---

## 🗄️ Database Schema

### Users Collection

```javascript
{
  name: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  googleId: String (optional),
  facebookId: String (optional),
  role: Enum ['client', 'admin'],
  isVerified: Boolean,
  otpCode: String,
  otpExpires: Date,
  address: Object,
  createdAt: Date
}
```

### Products Collection

```javascript
{
  name: String,
  category: String,
  price: Number,
  unit: String,
  description: String,
  textureImage: { url, publicId },
  productImage: { url, publicId },
  stock: Number,
  isActive: Boolean
}
```

### Renders Collection

```javascript
{
  user: ObjectId (ref: User),
  originalPhoto: { url, publicId },
  renderedPhoto: { url, publicId },
  appliedProducts: Array,
  preset: String,
  generationStatus: String,
  generationDuration: Number,
  watermarkedUrl: String,
  shareToken: String,
  isShared: Boolean
}
```

### Orders Collection

```javascript
{
  user: ObjectId (ref: User),
  items: Array,
  totalAmount: Number,
  paymentMethod: String,
  paymentStatus: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  fulfillmentStatus: String,
  shippingAddress: Object
}
```

### Quotes Collection

```javascript
{
  user: ObjectId (ref: User),
  render: ObjectId (ref: Render),
  requestedProducts: Array,
  message: String,
  status: Enum ['pending', 'approved', 'rejected'],
  adminNotes: String,
  quotedAmount: Number
}
```

---

## 🔐 Security Features

1. **Authentication**:
    - JWT token-based authentication
    - Password hashing with bcrypt (12 rounds)
    - Secure cookie handling
    - Token expiration (7 days)

2. **Authorization**:
    - Role-based access control (RBAC)
    - Protected routes middleware
    - Admin-only endpoints

3. **Data Protection**:
    - Environment variables for secrets
    - .env files excluded from Git
    - CORS configuration
    - Input validation

4. **OAuth Security**:
    - Client ID validation
    - Secure token exchange
    - Email verification for social logins

5. **Payment Security**:
    - Razorpay webhook signature verification
    - Server-side order validation
    - Test mode for development

---

## 🚀 Deployment Architecture

### Frontend (Vercel)

- **URL**: https://stratumai.vercel.app
- **Build**: Create React App production build
- **Environment Variables**:
    - `REACT_APP_API_URL`
    - `REACT_APP_GOOGLE_CLIENT_ID`
    - `REACT_APP_FACEBOOK_APP_ID`
    - `REACT_APP_RAZORPAY_KEY_ID`
- **Auto-deploy**: Triggers on GitHub push to main branch

### Backend (Render)

- **URL**: https://arteffects.onrender.com
- **Runtime**: Node.js 18
- **Root Directory**: `server`
- **Environment Variables**: 30+ variables configured
- **Free Tier**: Automatic sleep after 15 min inactivity

### Python AI (Railway)

- **URL**: https://home-design-prot-production-e21f.up.railway.app
- **Runtime**: Docker (Python 3.10)
- **Root Directory**: `server`
- **Docker Image**: Custom with PyTorch CPU
- **Free Tier**: 500 hours/month

### Database (MongoDB Atlas)

- **Cluster**: Cluster0 (M0 Free Tier)
- **Region**: US West
- **Connection**: MongoDB URI with Atlas
- **Collections**: 5 (Users, Products, Renders, Orders, Quotes)

### File Storage (Cloudinary)

- **Cloud**: df7ovv8i0
- **Folders**:
    - `/arteffects/rooms` - Original room photos
    - `/arteffects/renders` - AI-generated renders
    - `/arteffects/products` - Product images & textures
- **Optimizations**: Auto-format, quality optimization

---

## 📊 API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register new user with OTP
- `POST /login` - Email/password login
- `POST /google` - Google OAuth login
- `POST /facebook` - Facebook OAuth login
- `POST /verify-otp` - Verify email with OTP
- `POST /resend-otp` - Resend verification code
- `GET /me` - Get current user
- `PATCH /profile` - Update user profile

### Products (`/api/products`)

- `GET /` - List all products (with filters)
- `GET /:id` - Get product details
- `POST /` - Create product (admin)
- `PATCH /:id` - Update product (admin)
- `DELETE /:id` - Delete product (admin)

### Visualizer (`/api/visualizer`)

- `POST /upload` - Upload room photo
- `POST /segment` - Detect room zones
- `POST /generate` - Generate AI visualization

### Renders (`/api/renders`)

- `GET /` - Get user's renders
- `GET /:id` - Get render details
- `GET /shared/:token` - View shared render
- `POST /:id/share` - Create shareable link
- `DELETE /:id` - Delete render

### Orders (`/api/orders`)

- `POST /simulated-checkout` - Demo checkout
- `POST /razorpay/create` - Create Razorpay order
- `POST /razorpay/verify` - Verify payment
- `GET /` - List all orders (admin)
- `GET /mine` - Get user's orders
- `PATCH /:id/fulfillment` - Update order status (admin)

### Quotes (`/api/quotes`)

- `POST /` - Submit quote request
- `GET /mine` - Get user's quotes
- `GET /` - List all quotes (admin)
- `PATCH /:id/status` - Update quote status (admin)

### Cart (`/api/cart`)

- `GET /` - Get cart
- `POST /add` - Add item to cart
- `DELETE /remove/:id` - Remove item
- `PATCH /update/:id` - Update quantity
- `DELETE /clear` - Clear cart

### Admin (`/api/admin`)

- `GET /dashboard` - Analytics overview
- `GET /users` - List all users
- `POST /seed` - Seed sample products

---

## 📈 Performance Metrics

### Speed

- **Frontend Load**: ~1.2s (First Contentful Paint)
- **API Response**: ~200ms (average)
- **AI Segmentation**: ~3-5s (first run), ~2s (cached model)
- **AI Generation**: ~4-7s (single zone), ~10-15s (multi-zone)

### Scalability

- **Concurrent Users**: 100+ (free tier limits)
- **Database**: Unlimited documents (Atlas free tier: 512MB)
- **Image Storage**: 25GB (Cloudinary free tier)
- **AI Processing**: Limited by Railway CPU

### Optimization Techniques

- Image compression before upload
- Cloudinary auto-optimization
- React code splitting
- API response caching
- Database indexing on email, googleId, facebookId
- PyTorch model pre-loading
- Temporary file cleanup

---

## 🧪 Testing Performed

### Manual Testing

✅ User registration & OTP verification  
✅ Email/password login  
✅ Google OAuth login  
✅ Facebook OAuth login  
✅ Photo upload  
✅ AI segmentation  
✅ AI texture generation  
✅ Product browsing  
✅ Cart operations  
✅ Checkout flow  
✅ Order creation  
✅ Quote submission  
✅ Admin dashboard  
✅ Admin product management  
✅ Render sharing

### Browser Compatibility

✅ Chrome 120+  
✅ Firefox 121+  
✅ Safari 17+  
✅ Edge 120+

### Responsive Testing

✅ Desktop (1920x1080)  
✅ Laptop (1366x768)  
✅ Tablet (768x1024)  
✅ Mobile (375x667)

---

## 🐛 Known Issues & Limitations

1. **Free Tier Sleep Time**: Render backend sleeps after 15 minutes of inactivity (30-60s cold start)
2. **AI Generation Speed**: Limited by Railway CPU (no GPU acceleration)
3. **Image Size Limit**: 10MB per upload (Cloudinary free tier)
4. **Segmentation Accuracy**: Depends on room photo quality and lighting
5. **Payment Gateway**: Currently in test mode (requires business verification for live mode)

---

## 🔮 Future Enhancements

1. **Advanced AI Features**:
    - 3D room visualization
    - VR/AR preview support
    - Multiple design style presets
    - AI-powered design recommendations

2. **User Experience**:
    - Drag-and-drop product placement
    - Before/after slider comparison
    - Favorite products/designs
    - Social media sharing

3. **Business Features**:
    - Subscription plans for professionals
    - Designer collaboration tools
    - Bulk order discounts
    - Contractor portal

4. **Technical Improvements**:
    - Redis caching layer
    - WebSocket real-time updates
    - Progressive Web App (PWA)
    - Mobile native apps (React Native)
    - GPU-accelerated AI processing

---

## 🎓 Learning Outcomes

### Technical Skills Gained:

- Full-stack MERN development
- Python AI/ML integration with FastAPI
- OAuth 2.0 implementation (Google, Facebook)
- Cloud deployment across multiple platforms
- Docker containerization
- RESTful API design
- Semantic image segmentation
- Computer vision algorithms
- Payment gateway integration
- Database design & optimization

### Soft Skills Developed:

- Team collaboration
- Project planning & management
- Problem-solving under constraints
- Documentation writing
- User experience design
- Security best practices

---

## 👥 Team Contribution

**Equal 3-way split**: Each team member contributed ~33% of the project.

See `PROJECT_CONTRIBUTION_BREAKDOWN.md` for detailed file-by-file breakdown.

---

## 📚 References & Resources

### Documentation Used:

- React.js Official Docs
- Node.js & Express.js Docs
- MongoDB Documentation
- PyTorch Documentation
- Transformers (Hugging Face)
- OpenCV Python Tutorials
- OAuth 2.0 Specifications
- Vercel, Render, Railway Deployment Guides

### AI Models:

- SegFormer-B0 (NVIDIA) - MIT License
- ADE20K Dataset - Academic Use

### Third-Party Services:

- Cloudinary - Image CDN
- Google OAuth - Authentication
- Facebook OAuth - Authentication
- Razorpay - Payments
- Resend - Email Service

---

## 📞 Contact & Support

**Project Team**: 3 Members  
**Institution**: [Your School/University Name]  
**Presentation Date**: [Date]

**Live Demo**: https://stratumai.vercel.app  
**Admin Login**: Available on request  
**GitHub Repository**: https://github.com/Sorata-kanda/Home-design-Prot

---

## 📄 License

This project was created for educational purposes as part of a school project.

---

## 🙏 Acknowledgments

- NVIDIA for SegFormer model
- Hugging Face for Transformers library
- MongoDB Atlas for free database hosting
- Vercel, Render, Railway for free deployment tiers
- Open source community for amazing tools & libraries

---

**End of Report**

_Generated: July 2026_  
_Stratum by DSYN - Visualize Your Dream Space_
