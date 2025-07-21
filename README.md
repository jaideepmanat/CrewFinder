# 🎮 CrewFinder

**CrewFinder** is a modern gaming companion app that helps gamers find teammates, create posts for games, and chat in real-time. Built with React, TypeScript, Firebase, and a beautiful dark theme UI.

![CrewFinder Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- 🌙 **Dark Theme Gaming UI** - Sleek, modern interface designed for gamers
- 🔐 **Firebase Authentication** - Secure user registration and login
- 💬 **Real-time Chat System** - Connect and chat with other gamers instantly
- 📝 **Post Creation & Browsing** - Create and discover gaming posts
- 👤 **User Profiles** - Customizable profiles with avatars
- 🎯 **Game Selection** - Support for popular games (League of Legends, Valorant, CS2, etc.)
- 📱 **Responsive Design** - Works on desktop and mobile
- 🛡️ **Admin Panel** - Comprehensive admin controls for user and content management

## 🚀 Live Demo

**🌐 [Visit CrewFinder](https://crew-finder.vercel.app/)**

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Firebase Account** - [Create one here](https://firebase.google.com/)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/jaideepmanat/CrewFinder.git
cd CrewFinder
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Configuration

#### Create a Firebase Project:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enable **Authentication** and **Firestore Database**

#### Get Firebase Config:
1. In Firebase Console, go to **Project Settings** ⚙️
2. Scroll to "Your apps" section
3. Click "Web app" icon and register your app
4. Copy the configuration object

#3. **Create Environment Variables File**
   ```bash
   # Copy the template file
   cp .env.example .env
   ```

   Edit the `.env` file and replace the placeholder values with your actual Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

**⚠️ Important**: 
- **Replace the values with your actual Firebase configuration**
- **The `.env` file is not included in the repository for security reasons**
- **Each developer must create their own `.env` file locally**
- **Never commit API keys or sensitive data to Git**

### 4. Firebase Security Rules

Update your Firestore Security Rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Allow reading other users for chat
    }
    
    // Posts are readable by all authenticated users
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Games collection
    match /games/{gameId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Chat messages
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Chat rooms
    match /chats/{chatId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Authentication Setup

In Firebase Console:
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

### Production Build

```bash
npm run build
npm run preview
```

## 📱 Usage Guide

### For Regular Users:
1. **Register/Login** - Create an account or sign in
2. **Browse Posts** - Discover gaming posts from other users
3. **Create Posts** - Share your gaming sessions and find teammates
4. **Chat** - Connect with other gamers in real-time
5. **Profile** - Customize your profile and track your posts

### For Admins:
1. Access admin panel at `/admin-login`
2. Use admin credentials to manage:
   - Users and their data
   - Game library
   - Posts and content moderation

## 🏗️ Project Structure

```
CrewFinder/
├── src/
│   ├── components/          # React components
│   │   ├── Welcome.tsx      # Landing page
│   │   ├── Login.tsx        # User authentication
│   │   ├── Dashboard.tsx    # Main user dashboard
│   │   ├── ChatPage.tsx     # Real-time chat system
│   │   ├── CreatePost.tsx   # Post creation form
│   │   ├── BrowsePosts.tsx  # Post browsing interface
│   │   ├── Profile.tsx      # User profile management
│   │   └── AdminPanel.tsx   # Admin management interface
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication context
│   ├── utils/               # Utility functions
│   ├── firebase.ts          # Firebase configuration
│   └── main.tsx            # App entry point
├── public/                  # Static assets
├── .env                    # Environment variables
└── package.json            # Project dependencies
```

## 🔧 Technologies Used

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **Build Tool**: Vite
- **Deployment**: Vercel
- **Real-time**: Firebase Firestore real-time listeners

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Connect your GitHub repository to [Vercel](https://vercel.com)
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push

### Environment Variables for Deployment

Make sure to add all Firebase environment variables to your deployment platform:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues:

**Blank page on deployment:**
- Ensure all Firebase environment variables are configured
- Check browser console for errors

**Firebase connection issues:**
- Verify your Firebase configuration
- Check Firestore security rules
- Ensure authentication is properly set up

**Build errors:**
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors with `npm run type-check`

**Missing .env file:**
- The `.env` file is not included in the repository for security
- You must create your own `.env` file with your Firebase configuration
- See the "Firebase Configuration" section above for the required format

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/jaideepmanat/CrewFinder/issues) page
2. Create a new issue with detailed description
3. Contact the maintainer

## 🎮 Happy Gaming!

Find your crew, connect with gamers, and level up your gaming experience with CrewFinder!
