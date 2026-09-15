# Aryabhatta Group of Institutes Management System
### Phase 1 Core Architecture — Abdul Kalam Block

An ultra-modern, high-performance institutional management platform engineered with an aesthetic glassmorphic interface, instant Light/AMOLED display toggle, synthesized electronic audio intro, unified single-door authentication gateway, and a Node.js/Express/Mongoose backend connected to MongoDB Atlas.

---

## 🏛️ Project Architecture

```
college_management/
├── backend/
│   ├── .env                    # Environment config with MongoDB Atlas URI
│   ├── .gitignore              # Ignored files
│   ├── package.json            # Node/Express/Mongoose dependencies
│   └── src/
│       ├── config/
│       │   └── db.js           # Robust Mongoose connection & lifecycle utility
│       ├── controllers/
│       │   └── authController.js# Single-door authentication & demo endpoints
│       ├── models/
│       │   └── User.js         # Mongoose User schema for Kalam Block
│       ├── routes/
│       │   └── authRoutes.js   # API route declarations
│       └── server.js           # Primary Express server & health endpoints
├── frontend/
│   ├── index.html              # HTML5 template with Google Fonts
│   ├── package.json            # React, Vite, Tailwind CSS, Lucide React
│   ├── postcss.config.js       # PostCSS config
│   ├── tailwind.config.js      # AMOLED theme & glassmorphic tokens
│   ├── vite.config.js          # Vite config with backend proxy
│   └── src/
│       ├── App.jsx             # Master app shell & view coordinator
│       ├── main.jsx            # Entry point
│       ├── index.css           # Custom glassmorphism, glowing aura & theme styles
│       ├── context/
│       │   ├── AuthContext.jsx # Unified auth state, Kalam block state & mocks
│       │   └── ThemeContext.jsx# Light Mode vs Pure AMOLED Dark Mode switcher
│       ├── components/
│       │   ├── SplashScreen.jsx# 2.8s Web Audio intro, branding & creator footer
│       │   ├── Navbar.jsx      # Sticky glass header, block indicator & controls
│       │   ├── AuthGateway.jsx # Single-door login with quick-fill role pills
│       │   ├── ThemeToggle.jsx # Smooth Sun/Moon theme switcher
│       │   ├── SoundToggle.jsx # Web Audio SFX mute/unmute control
│       │   └── dashboards/
│       │       ├── AdminDashboard.jsx   # /admin mock portal
│       │       ├── TeacherDashboard.jsx # /teacher mock portal
│       │       └── StudentDashboard.jsx # /student mock portal
│       └── utils/
│           └── soundEffects.js # Synthesized electronic audio engine (Web Audio API)
└── README.md
```

---

## 🔐 Phase 1 Authentication Credentials

The system provides a **Unified Single-Door Gateway** supporting all three institutional roles, along with **1-click Quick-Fill chips** on the login card:

| Role | Identifier | Password | Destination Route | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `Admin` | `Aryabhatta@2000` | `/admin` | Central Academic Directorate, Kalam Block Suite 401 |
| **Teacher** | `T101` | `123` | `/teacher` | Prof. Rajesh Sharma, Faculty Cabin 12 |
| **Student** | `241342` | `123` | `/student` | Aman Kumar Verma, B.Tech CSE (Kalam AK-104) |

---

## 🎨 Design System & Display Modes

1. **Ultra-Clean Light Mode**:
   - Refined slate/indigo surface styling.
   - High-clarity typography with crisp borders and subtle drop shadows.
2. **Pure AMOLED Dark Mode**:
   - True `#000000` pure black background for high contrast and OLED energy efficiency.
   - Radiant neon cyan (`#06b6d4`) and electric indigo (`#6366f1`) glow highlights.
   - Translucent glassmorphism cards with micro-borders (`rgba(255,255,255,0.08)`).
   - Theme preference is stored in `localStorage` and persists across sessions.

---

## 🎵 Audio Splash Screen (Web Audio API)

- An energetic modern electronic chord arpeggio with high-resonance filter sweep synthesized natively via the browser **Web Audio API** (zero external mp3/wav files required, zero broken links).
- Centered typography: *"Welcome To Aryabhatta Group of Institutes Management System"*.
- Sub-badge at the bottom: *"Abdul Kalam Block"*.
- Footer credit: *"By Adeshjeet_Official"*.
- Smoothly auto-fades out after 2.8 seconds or immediately upon user click/tap.
- Replayable anytime via the **Replay Intro** button in the top navbar.

---

## 🚀 Running the Project Locally

### 1. Backend Server
```bash
cd backend
npm install
npm run dev
```
- Starts the Express API server on `http://localhost:5000`.
- Connects automatically to the MongoDB Atlas cluster configured in `.env`.
- Health Check: `http://localhost:5000/api/health`.

### 2. Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
- Starts the Vite dev server on `http://localhost:5173`.
- Hot Module Replacement (HMR) enabled.

---

## 👨‍💻 Engineering & Authorship
- **Project**: Aryabhatta Group of Institutes Management System (Abdul Kalam Block)
- **Phase**: Phase 1 Core Architecture
- **Engineered by**: **Adeshjeet_Official**
