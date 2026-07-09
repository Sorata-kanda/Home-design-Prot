# Facebook OAuth Setup Guide

Facebook Login has been added to your Stratum application! Follow these steps to configure it:

## 🔧 Setup Steps:

### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Consumer"** as app type
4. Give your app a name: **"Stratum by DSYN"**
5. Click **"Create App"**

### 2. Add Facebook Login Product

1. In your app dashboard, click **"Add Product"**
2. Find **"Facebook Login"** and click **"Set Up"**
3. Select **"Web"** as platform
4. Enter your site URL: `https://stratumai.vercel.app`
5. Click **"Save"** and **"Continue"**

### 3. Configure OAuth Settings

1. Go to **Facebook Login** → **Settings** in the left sidebar
2. Under **"Valid OAuth Redirect URIs"**, add:
    ```
    http://localhost:3000
    https://stratumai.vercel.app
    ```
3. Click **"Save Changes"**

### 4. Get Your App Credentials

1. Go to **Settings** → **Basic** in the left sidebar
2. Copy your **App ID**
3. Click **"Show"** next to **App Secret** and copy it

### 5. Add to Environment Variables

#### Local Development (.env files):

**Server** (`server/.env`):

```env
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
```

#### Vercel (Frontend):

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add:
    - **Key**: `REACT_APP_FACEBOOK_APP_ID`
    - **Value**: `[your App ID]`
4. Click **Save**
5. Redeploy your frontend

#### Render (Backend):

1. Go to your Render dashboard
2. Click on your **arteffects** service
3. Go to **Environment** tab
4. Add two variables:
    - **FACEBOOK_APP_ID**: `[your App ID]`
    - **FACEBOOK_APP_SECRET**: `[your App Secret]`
5. Click **Save Changes** (service will auto-restart)

### 6. Make App Live (Required for public use)

1. In Facebook App dashboard, toggle the switch at the top from **"In Development"** to **"Live"**
2. You may need to add a Privacy Policy URL (can use a simple one)
3. Complete the App Review if required

---

## ✅ Testing

Once configured:

1. Visit `https://stratumai.vercel.app/login`
2. Click **"Continue with Facebook"** button
3. Authorize the app
4. You should be logged in!

---

## 🔒 Security Notes:

- ✅ App Secret is stored in `.env` (never committed to Git)
- ✅ OAuth redirects are restricted to your domains only
- ✅ Facebook accounts are auto-verified (no email OTP needed)
- ✅ If a user's Facebook email matches `ADMIN_EMAIL`, they get admin role

---

## 🎓 For Your Presentation:

You can mention:

- **"Multi-provider OAuth"**: Google AND Facebook login
- **"Seamless user experience"**: One-click social login
- **"Secure authentication"**: Industry-standard OAuth 2.0 protocol
- **"Auto-verification"**: Social logins bypass email verification

---

## 📝 Notes:

- Facebook requires a Privacy Policy URL for live apps
- You can use a template or generator online
- The app works in "Development Mode" for testing with up to 5 test users
- To allow unlimited users, switch to "Live Mode"
