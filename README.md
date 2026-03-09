# 🚀 Nexus - AI Content Summarizer & Knowledge Intelligence Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web%20%7C%20Chrome-blue)]()
[![Status](https://img.shields.io/badge/Status-Beta%20Testing-orange)]()

> **Never forget anything important again.** Transform long articles, documents, and online content into concise insights using AI.

---

## 🌐 Problem

People consume huge amounts of digital content every day — articles, blogs, research papers, and social media threads. Reading and extracting key insights from long content is time‑consuming and inefficient.

There is a need for an intelligent system that can:

- Summarize long content quickly
- Extract key insights automatically
- Help users revisit and search knowledge easily

## 💡 Solution

Nexus provides an AI‑powered summarization engine that converts long‑form content into structured summaries and key points.

Users can capture content from websites or paste text, and the system automatically generates:

- concise summaries
- key insights
- semantic analysis
- searchable knowledge

This allows users to understand large amounts of information in seconds.

## 📱 What is Nexus?

Nexus is a multi-platform personal memory assistant that helps you:
- 🧠 **Capture** thoughts, articles, videos, and social media posts
- 🤖 **Enhance** content with AI analysis and insights
- 🔍 **Search** through your memories using natural language
- 💬 **Chat** with AI about your saved content
- 📊 **Track** your mood and knowledge over time
- 🔗 **Share** from any app directly to Nexus

---

## ✨ Features

### Core Capabilities
- ✅ **AI Content Summarization**: The platform analyzes long content and generates:

• concise summaries
• key bullet points
• structured insights
- ✅ **AI Analysis**: Automatic summary, key points extraction, sentiment analysis
- ✅ **Intelligent Search**: Find memories by keyword, tag, or semantic meaning
- ✅ **AI Chat**: Ask questions about your saved content
- ✅ **Mood Tracking**: Track emotional patterns over time
- ✅ **Timeline View**: Visual chronological organization
- ✅ **Offline Support**: Works without internet, syncs when online
- ✅ **Cross-Platform**: Android app, Web interface, Chrome extension

### Technical Highlights
- 🔐 Secure authentication with Supabase
- ⚡ Fast AI processing with Groq (Llama models)
- 📡 Queue-based architecture for reliability (BullMQ + Redis)
- 🎨 Beautiful dark-mode UI (React Native + Tailwind)
- 🔄 Real-time sync across devices

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interfaces                       │
├──────────────┬──────────────┬──────────────┬────────────┤
│  Mobile App  │ Web Frontend │  Extension   │   Future   │
│  (React      │  (React +    │  (Chrome)    │   (iOS)    │
│   Native)    │   Vite)      │              │            │
└──────┬───────┴──────┬───────┴──────┬───────┴────────────┘
       │              │              │
       └──────────────┼──────────────┘
                      │
              ┌───────▼────────┐
              │  Backend API   │
              │  (Express.js)  │
              └───────┬────────┘
                      │
        ┏━━━━━━━━━━━━━┻━━━━━━━━━━━━━┓
        ┃                            ┃
   ┌────▼─────┐              ┌───────▼────────┐
   │ Supabase │              │ Redis Queue    │
   │ Database │              │ (BullMQ)       │
   │ + Auth   │              └───────┬────────┘
   └──────────┘                      │
                             ┌───────▼────────┐
                             │  Worker Pool   │
                             │  (AI Process)  │
                             └───────┬────────┘
                                     │
                             ┌───────▼────────┐
                             │  Groq AI API   │
                             │  (Llama 3)     │
                             └────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v20.19.4+
- npm or pnpm
- Supabase account
- Groq API key
- Redis instance (Upstash/Railway)
- Expo account (for mobile builds)

### 1. Clone Repository
```bash
git clone https://github.com/MayankPatle0/hackathonix2.0BrainBytes.git
cd hackathonix2.0BrainBytes
```

### 2. Setup Backend
```bash
cd Backend/Server
npm install

# Configure environment
cp .env.template .env
# Edit .env with your keys:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - GROQ_API_KEY
# - REDIS_URL

# Start server
npm start

# In another terminal, start worker
npm run worker
```

### 3. Setup Mobile App
```bash
cd mobilef
npm install --legacy-peer-deps

# Update app.json with your Supabase credentials
# Start development
npm start

# For Android
npm run android

# To build APK
eas build --platform android --profile preview
```

### 4. Setup Web Frontend
```bash
cd Frontend
npm install

# Configure environment
cp .env.template .env
# Edit with backend URL and Supabase keys

# Start development
npm run dev

# Build for production
npm run build
```

---

## 📦 Project Structure

```
complete-nexus/
├── Backend/
│   ├── Database/
│   │   └── schema.sql              # Supabase database schema
│   └── Server/
│       ├── mistral_server.js       # Main API server
│       ├── worker.js               # Background job processor
│       ├── monitoring.js           # Queue monitoring
│       └── package.json
├── Frontend/
│   ├── client/
│   │   ├── components/             # React components
│   │   ├── pages/                  # Page components
│   │   ├── lib/                    # Utilities
│   │   └── App.tsx
│   └── package.json
├── mobilef/
│   ├── screens/                    # App screens
│   ├── components/                 # Reusable components
│   ├── utils/                      # Helper functions
│   ├── App.js                      # Entry point
│   └── package.json
├── Extension/
│   ├── background.js               # Extension background script
│   ├── content.js                  # Content script
│   ├── popup.html                  # Extension popup
│   └── manifest.json
├── DEPLOYMENT_GUIDE.md             # 🔥 Full deployment guide
├── TESTING_CHECKLIST.md            # 🧪 Testing guide
└── README.md                       # This file
```

---

## 🌐 Deployment

### Production Deployment Options

#### Backend: Railway / Render
```bash
# Railway (Recommended)
1. Push to GitHub
2. Connect Railway to repo
3. Add environment variables
4. Add Redis service
5. Deploy

# OR Render
1. Connect GitHub repo
2. Set build/start commands
3. Add environment variables
4. Add Redis service
5. Deploy
```

#### Frontend: Netlify / Vercel
```bash
# Build and deploy
npm run build
netlify deploy --prod

# OR connect GitHub repo to Netlify
```

#### Mobile: Expo EAS
```bash
# Build APK/IPA
eas build --platform android --profile production
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

**📖 Full deployment guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🧪 Testing

### For 30 User Testing
```bash
# 1. Deploy backend to Railway/Render
# 2. Build APK with production URL
# 3. Distribute to testers
# 4. Collect feedback

# Detailed testing steps in TESTING_CHECKLIST.md
```

**📋 Testing checklist**: See [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)

---

## 🛠️ Technology Stack

### Mobile App
- **Framework**: React Native 0.81 + Expo 54
- **Navigation**: React Navigation
- **State**: React Context + AsyncStorage
- **Styling**: React Native StyleSheet
- **Auth**: Supabase Auth

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js 5
- **Queue**: BullMQ + Redis
- **AI**: Groq SDK (Llama 3)
- **Database**: Supabase (PostgreSQL)
- **File Upload**: Multer

### Web Frontend
- **Framework**: React 18 + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Routing**: React Router
- **State**: React Context
- **Auth**: Supabase Auth

### Chrome Extension
- **Manifest**: V3
- **Content Script**: Vanilla JS
- **Platform Detection**: Custom extractors
- **Readability**: Mozilla Readability

---

## 🔐 Environment Variables

### Backend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
GROQ_API_KEY=gsk_your_groq_key
REDIS_URL=redis://your-redis-url
PORT=3001
NODE_ENV=production
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=https://your-backend.railway.app
VITE_ENV=production
```

### Mobile (app.json)
```json
{
  "expo": {
    "extra": {
      "SUPABASE_URL": "https://your-project.supabase.co",
      "SUPABASE_ANON_KEY": "your_anon_key",
      "BACKEND_URL": "https://your-backend.railway.app"
    }
  }
}
```

---

## 📊 API Endpoints

### Health Check
```
GET /api/health
Response: { status: "healthy", timestamp: "..." }
```

### Add Memory
```
POST /api/memories/add
Body: { url, title, content, type, userId }
Response: { success: true, memoryId: "..." }
```

### Get Memories
```
GET /api/memories?userId=xxx
Response: { memories: [...] }
```

### Search
```
GET /api/memories/search?q=keyword&userId=xxx
Response: { results: [...] }
```

### AI Chat
```
POST /api/chat
Body: { message, userId, context }
Response: { response: "...", sources: [...] }
```

---

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits atomic and meaningful

---

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Device/Platform info
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Groq** - Lightning-fast AI inference
- **Supabase** - Backend as a Service
- **Expo** - React Native tooling
- **shadcn/ui** - Beautiful UI components
- **Railway** - Hosting infrastructure

---

## 📈 Current Status

- ✅ **Backend**: Production-ready
- ✅ **Mobile App**: Beta testing (30 users)
- ✅ **Web Frontend**: Beta
- ✅ **Chrome Extension**: Alpha
- 🚧 **iOS App**: Planned
- 🚧 **Play Store**: Coming soon

---

## 💡 Use Cases

- 📚 **Students**: Save lecture notes, research papers, study materials
- 💼 **Professionals**: Track industry news, articles, insights
- ✍️ **Writers**: Collect inspiration, quotes, references
- 🎓 **Researchers**: Organize sources, annotate findings
- 🧘 **Personal Growth**: Journal thoughts, track progress
- 📱 **Content Creators**: Save ideas, trends, inspiration

---

## ⚡ Performance

- **API Response**: <500ms average
- **AI Analysis**: 5-10 seconds
- **App Startup**: <3 seconds
- **Search**: <1 second
- **Offline Support**: Full functionality

---

## 🔒 Security & Privacy

- All data encrypted in transit (HTTPS)
- Supabase Row Level Security (RLS)
- No third-party tracking
- User data isolated per account
- Optional data export/deletion

---

## 🎯 Quick Links

- 📖 [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- 🧪 [Testing Checklist](./TESTING_CHECKLIST.md)
- 🗂️ [Database Schema](./Backend/Database/schema.sql)
- 📱 [Mobile App Status](./MOBILE_APP_STATUS.md)
- ⚙️ [Supabase Config](./SUPABASE_CONFIG.txt)

---

