# Stratum AI - Project Contribution Breakdown

## Team Members: 3 People

---

## 👤 **Team Member 1: Backend & Database Architecture**

### Responsibilities:

- **Backend API Development (Node.js/Express)**
    - Authentication system (JWT, Google OAuth)
    - User management routes
    - Admin panel backend
    - Quote management system
    - Order processing backend
- **Database Design & Management**
    - MongoDB schema design
    - User, Product, Order, Quote, Render models
    - Database connections and configurations
    - Data relationships and indexes
- **Server Deployment & Configuration**
    - Render backend deployment
    - Environment variables setup
    - MongoDB Atlas configuration
    - Server monitoring and logging

### Key Files Handled:

```
server/
├── routes/
│   ├── auth.js
│   ├── admin.js
│   ├── quotes.js
│   └── orders.js
├── models/
│   ├── User.js
│   ├── Order.js
│   └── Quote.js
├── middleware/
│   └── auth.js
└── index.js (partial)
```

### Technologies:

- Node.js, Express.js
- MongoDB, Mongoose
- JWT Authentication
- Google OAuth 2.0
- Render (deployment)

---

## 👤 **Team Member 2: AI/ML Integration & Image Processing**

### Responsibilities:

- **AI & ML Integration**
    - Python FastAPI server for image segmentation
    - Stable Diffusion integration
    - Image-to-image generation pipeline
    - SegFormer model integration
- **Image Processing System**
    - Cloudinary integration for uploads
    - Image transformation and watermarking
    - AI prompt engineering
    - Segmentation API bridge
- **Visualizer Backend Logic**
    - Product-to-image mapping
    - Material application logic
    - Neoclassical preset system
    - Render generation workflow

### Key Files Handled:

```
server/
├── segment_api.py (Python AI service)
├── utils/
│   └── segment_bridge.js
├── routes/
│   └── visualizer.js
├── middleware/
│   └── upload.js
├── requirements.txt
└── Dockerfile
```

### Technologies:

- Python, FastAPI
- Stable Diffusion
- SegFormer (Hugging Face)
- Cloudinary API
- Stability AI / Replicate APIs
- Docker

---

## 👤 **Team Member 3: Frontend & User Experience**

### Responsibilities:

- **React Frontend Development**
    - UI/UX design and implementation
    - Component architecture
    - State management (React Query, Context API)
    - Responsive design (mobile-first)
- **User-Facing Features**
    - Visualizer page (3-step workflow)
    - Product catalog and browsing
    - Shopping cart system
    - Payment integration (Razorpay)
    - User dashboard
    - Before/After image comparison
- **Frontend Deployment**
    - Vercel deployment
    - Environment configuration
    - Performance optimization
    - Theme system (dark/light mode)

### Key Files Handled:

```
client/
├── src/
│   ├── pages/
│   │   ├── VisualizerPage.js
│   │   ├── HomePage.js
│   │   ├── ProductsPage.js
│   │   ├── DashboardPage.js
│   │   ├── LoginPage.js
│   │   └── RegisterPage.js
│   ├── components/
│   │   ├── shared/
│   │   │   ├── Navbar.js
│   │   │   ├── CartDrawer.js
│   │   │   ├── BeforeAfterSlider.js
│   │   │   └── AddressAutocomplete.js
│   │   └── visualizer/
│   │       ├── CheckoutModal.js
│   │       └── QuoteModal.js
│   ├── context/
│   │   ├── AuthContext.js
│   │   └── ThemeContext.js
│   ├── utils/
│   │   └── api.js
│   └── index.css
└── public/
```

### Technologies:

- React 18
- React Router v6
- TanStack Query
- Axios
- Razorpay Checkout
- Vercel (deployment)

---

## 📊 **Shared Responsibilities (All Team Members)**

- **Planning & Documentation**
    - Project requirements gathering
    - API documentation
    - README updates
    - Testing and bug fixes
- **Integration & Testing**
    - End-to-end testing
    - API integration
    - Cross-browser testing
    - Performance optimization

- **Deployment & DevOps**
    - Git workflow management
    - Environment setup
    - Production deployment
    - Monitoring and debugging

---

## 🎯 **Project Statistics**

| Metric               | Count               |
| -------------------- | ------------------- |
| **Total Files**      | 46 files modified   |
| **Lines Added**      | 4,445+ lines        |
| **Lines Removed**    | 715 lines           |
| **Backend Routes**   | 6 major route files |
| **Frontend Pages**   | 8 main pages        |
| **React Components** | 12+ components      |
| **Database Models**  | 5 models            |
| **API Integrations** | 6 external APIs     |

---

## 🛠️ **Technology Stack Summary**

### Frontend:

- React, React Router, TanStack Query
- Lucide Icons, React Dropzone
- Vercel deployment

### Backend:

- Node.js, Express.js
- MongoDB, Mongoose
- JWT, Google OAuth
- Render deployment

### AI/ML:

- Python FastAPI
- Stable Diffusion
- SegFormer
- Cloudinary

### Payment & Communication:

- Razorpay (payments)
- Resend (emails)
- Google OAuth (authentication)

---

## 📝 **Note for Presentation**

Each team member contributed approximately **33%** to the project. The division represents logical separation of concerns:

1. **Backend specialist** - Server logic, database, authentication
2. **AI/ML specialist** - Image processing, AI integration, algorithms
3. **Frontend specialist** - User interface, user experience, client-side logic

All members collaborated on integration, testing, and deployment.

---

**Project Name:** Stratum AI (formerly Arteffects)  
**Project Type:** AI-Powered Interior Design Visualization Platform  
**Completion Date:** July 2026
