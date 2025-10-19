# The Contributor - Change++ Project 2025

Phase 1: A full stack mobile app using React Native and FastAPI.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
  - [Python](#1-python-313-or-higher)
  - [Node.js and npm](#2-nodejs-and-npm-latest-lts-version)
  - [uv Package Manager](#3-uv-python-package-manager)
  - [Git](#4-git)
- [Project Setup](#project-setup)
  - [Clone the Repository](#1-clone-the-repository)
  - [Backend Setup](#2-backend-setup)
  - [Frontend Setup](#3-frontend-setup)
  - [Expo CLI Setup](#4-expo-cli-setup-optional-but-recommended)
  - [Mobile Testing Setup](#5-mobile-testing-setup)
- [Running the Application](#running-the-application)
  - [Start Backend Server](#start-the-backend-server)
  - [Start Frontend (Expo)](#start-the-frontend-expo)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Version Control](#version-control) (See [Git & GitHub Guide](./helpful-docs/GITHUB.md))
- [Additional Resources](#additional-resources)
- [Contributing](#contributing)

---

## Tech Stack

**Backend:**
- Python 3.13+ with FastAPI
- Supabase (Authentication & PostgreSQL Database)
- MongoDB (NoSQL Database)
- uv (Python Package Manager)

**Frontend:**
- React Native with Expo
- TypeScript
- Expo Router (File-based routing)
- NativeWind (Tailwind CSS for React Native)

**IDE & MCPs**
- Cursor (strongly recommended, not required)
- Context7 MCP (extremely helpful), contact me to install for free

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### 1. Python (3.13 or higher)

**macOS:**
```bash
# Using Homebrew
brew install python@3.13
```

**Windows:**
- Download the installer from [python.org](https://www.python.org/downloads/)
- During installation, check "Add Python to PATH"
- Verify installation: `python --version`

### 2. Node.js and npm (Latest LTS version)

**macOS:**
```bash
# Using Homebrew
brew install node
```

**Windows:**
- Download the installer from [nodejs.org](https://nodejs.org/)
- Run the installer (npm is included)
- Verify installation: `node --version` and `npm --version`

### 3. uv (Python Package Manager)

**macOS and Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows:**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Verify installation:
```bash
uv --version
```

### 4. Git

**macOS:**
```bash
brew install git
```

**Windows:**
- Download from [git-scm.com](https://git-scm.com/download/win)

---

## Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
uv sync
```

Create a `.env` file in the directory:

```bash
touch .env
```
Then, add these keys (found in notion database) to your env file.
```bash
# backend/.env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
MONGODB_URI=your-mongodb-connection-string
```

**Note:** Get these credentials from the project Notion page.

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd ../frontend
npm install
```

### 4. Expo CLI Setup (Optional but Recommended)

Install Expo CLI globally for easier development:

```bash
npm install -g expo-cli
```

### 5. Mobile Testing Setup

**For Testing on Physical Device (Recommended for Beginners):**
- Install the Expo Go app on your iOS or Android device
- Download from [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
- Scan the QR code when you run `npm start` to test on your device

**Note:** You do NOT need Xcode, Android Studio, or CocoaPods for Expo Go development. Only install them if you specifically need iOS Simulator or Android Emulator.

---

## Running the Application

### Start the Backend Server

The `uv` package manager automatically handles virtual environments. When you run `uv sync`, it creates a `.venv` folder with an isolated Python environment. When you use `uv run`, it automatically activates this environment.

**No need to manually activate the virtual environment!**

From the `backend` directory:

```bash
cd backend
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

**Alternative: Manual Virtual Environment Activation (Optional)**

If you prefer to manually activate the virtual environment:

```bash
cd backend

# Activate virtual environment
# macOS/Linux:
source .venv/bin/activate

# Windows:
.venv\Scripts\activate

# Then run without uv:
fastapi dev main.py

# Deactivate when done:
deactivate
```

### Start the Frontend (Expo)

From the `frontend` directory:

```bash
cd frontend
npm start
```


This will open the Expo DevTools in your browser. You can then:

- Press `i` to open iOS simulator (macOS only)
- Press `a` to open Android emulator
- Press `w` to open in web browser
- Scan the QR code with Expo Go app on your physical device

---

## Project Structure

```
the-contributor/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── pyproject.toml       # Python dependencies
│   └── .env                 # Backend environment variables (create this)
│
├── frontend/
│   ├── app/                 # Expo Router pages
│   │   ├── _layout.tsx      # Root layout
│   │   └── (tabs)/          # Tab navigation
│   ├── components/          # Reusable components
│   ├── constants/           # Theme and constants
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── global.css           # Global styles with Tailwind directives
│   └── package.json         # Frontend dependencies
│
└── helpful-docs/            # Documentation
    ├── GITHUB.md            # Git & GitHub workflow guide
    ├── SUPABASE.md          # Supabase authentication guide
    ├── MONGODB.md           # MongoDB operations guide
    └── NATIVEWIND.md        # NativeWind styling guide
```

---

## Development Workflow

### Backend Development

1. Make changes to Python files in `backend/`
2. FastAPI will auto-reload on file changes
3. API documentation available at `http://localhost:8000/docs`

### Frontend Development

1. Make changes to files in `frontend/app/` or `frontend/components/`
2. Changes will hot-reload automatically in Expo
3. Shake your device or press `m` in terminal to open developer menu

---

## Troubleshooting

**Backend won't start:**
- Ensure Python 3.13+ is installed: `python --version`
- Verify uv sync completed successfully
- Check that `.env` file exists with correct credentials

**Frontend won't start:**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Ensure Expo CLI is up to date: `npm install -g expo-cli@latest`

**Expo app won't connect:**
- Ensure your phone and computer are on the same WiFi network
- Try using tunnel connection: `npx expo start --tunnel`
- Check firewall settings aren't blocking connections

**Environment variables not loading:**
- Restart the development server after creating/modifying `.env` files
- Verify `.env` file is in the correct directory
- Check for typos in variable names

---

## Version Control

For detailed instructions on Git workflow, branching, pull requests, and resolving merge conflicts, see:

**[Git & GitHub Workflow Guide](./helpful-docs/GITHUB.md)**

Quick reminders:
- Always work on your own branch: `git checkout -b your-name/your-feature`
- Never commit directly to `main`
- Sync with main regularly: `git merge main` or `git rebase main`
- You can merge your own PRs for regular work
- Contact mentors for critical changes or breaking conflicts

---

## Additional Resources

**Project Guides:**
- [Git & GitHub Workflow Guide](./helpful-docs/GITHUB.md)
- [Supabase Authentication Guide](./helpful-docs/SUPABASE.md)
- [MongoDB Operations Guide](./helpful-docs/MONGODB.md)
- [NativeWind Styling Guide](./helpful-docs/NATIVEWIND.md)

**External Documentation:**
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)

---

## Contributing

Please refer to the project Notion page for contribution guidelines and development standards.
