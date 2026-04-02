# 🚀 Concurrent Development Setup Guide

## 🎯 Overview

Now you can run both the main Luter application and the AI-powered battle server with a single command! This setup streamlines development by launching both servers simultaneously.

## 📁 Setup Files Created

### **1. start-dev.bat** (Windows Batch File)
```batch
@echo off
echo Starting Luter Development Environment...
echo.
echo Starting Battle Server...
start "Battle Server" cmd /k "cd server && npm run dev"

echo Starting Client Server...
start "Client Server" cmd /k "npm run dev:client"

echo.
echo Both servers are starting in separate windows...
echo Battle Server: http://localhost:3001
echo Client Server: http://localhost:5173
echo.
echo Press any key to close this window...
pause > nul
```

### **2. start-dev.ps1** (PowerShell Script)
```powershell
Write-Host "Starting Luter Development Environment..." -ForegroundColor Green
Write-Host ""

Write-Host "Starting Battle Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

Write-Host "Starting Client Server..." -ForegroundColor Yellow  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:client"

Write-Host ""
Write-Host "Both servers are starting in separate PowerShell windows..." -ForegroundColor Green
Write-Host "Battle Server: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Client Server: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
```

### **3. Updated package.json Scripts**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "vite",
    "dev:server": "cd server && npm run dev",
    "dev:windows": "start-dev.bat",
    "dev:ps": "powershell -ExecutionPolicy Bypass -File start-dev.ps1",
    "server": "cd server && npm run dev",
    "start:server": "cd server && npm start"
  }
}
```

## 🚀 Quick Start Commands

### **Option 1: PowerShell (Recommended)**
```bash
npm run dev:ps
```

### **Option 2: Windows Batch**
```bash
npm run dev:windows
```

### **Option 3: Concurrent (if working)**
```bash
npm run dev
```

### **Option 4: Manual (fallback)**
```bash
# Terminal 1:
npm run server

# Terminal 2:
npm run dev:client
```

## 🖥️ What Happens When You Run

### **PowerShell Method (Recommended)**
1. Opens separate PowerShell window for Battle Server
2. Opens separate PowerShell window for Client Server
3. Both servers run independently
4. Main terminal shows status and URLs
5. Press any key to close the status window (servers keep running)

### **Windows Batch Method**
1. Opens separate CMD window for Battle Server
2. Opens separate CMD window for Client Server
3. Both servers run independently
4. Shows URLs in main window
5. Press any key to close (servers keep running)

## 📊 Server Status

### **Battle Server** (Port 3001)
- **Health Check**: http://localhost:3001/health
- **Purpose**: AI-powered real-time battles
- **Features**: Socket.io, Groq AI integration, matchmaking

### **Client Server** (Port 5173)
- **Main App**: http://localhost:5173
- **Purpose**: React frontend
- **Features**: All Luter features including AI battles

## 🔍 Verification

### **Check Battle Server**
```bash
curl http://localhost:3001/health
```
**Expected Response:**
```json
{"status":"healthy","activeBattles":0,"matchmakingPool":0,"connectedUsers":0}
```

### **Check Client Server**
- Open browser to http://localhost:5173
- Should see Luter application
- Navigate to `/dashboard/compete` for battle features

## 🎮 Testing AI Battle System

### **1. Start Both Servers**
```bash
npm run dev:ps
```

### **2. Access the Application**
- Open http://localhost:5173
- Login to your account
- Navigate to `/dashboard/compete`

### **3. Test AI Features**
- Click "Quick Battle" → AI generates questions
- During battle → Click "Get AI Hint" → AI provides hints
- After battle → View AI insights and recommendations

## 🛠️ Troubleshooting

### **Common Issues**

#### **1. Port Already in Use**
```bash
# Find what's using port 3001
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <PID_NUMBER> /F
```

#### **2. PowerShell Execution Policy**
```bash
# Allow PowerShell scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### **3. Concurrent Not Working**
- Use `npm run dev:ps` (PowerShell method)
- Or `npm run dev:windows` (Batch method)
- Or run manually in separate terminals

#### **4. Battle Server Not Starting**
```bash
# Check server dependencies
cd server
npm install

# Start server manually
npm run dev
```

#### **5. AI Features Not Working**
- Check `.env` file for Groq API key
- Verify server logs for AI API calls
- Check browser console for connection errors

### **Log Locations**

#### **Battle Server Logs**
- In the PowerShell/CMD window labeled "Battle Server"
- Shows AI question generation, Socket.io connections
- Look for "AI Battle started" messages

#### **Client Server Logs**
- In the PowerShell/CMD window labeled "Client Server"
- Shows Vite development server logs
- Look for build and compilation messages

## 📈 Development Workflow

### **Daily Development**
1. Run `npm run dev:ps`
2. Both servers start in separate windows
3. Work on features in main IDE
4. Changes hot-reload automatically
5. Test AI battle features in browser

### **Debugging**
1. Battle Server issues → Check "Battle Server" window
2. Client issues → Check "Client Server" window
3. Browser issues → Check DevTools console
4. AI issues → Check server logs for Groq API calls

### **Git Workflow**
- Main development happens in root directory
- Server code in `/server` directory
- Both directories tracked in same Git repo
- Commit changes from root directory

## 🎯 Benefits

### **Before This Setup**
- Had to open 2+ terminals manually
- Had to remember different commands
- Easy to forget to start one server
- Manual process was error-prone

### **After This Setup**
- Single command starts everything
- Clear visual feedback
- Separate windows for easy debugging
- Automated status reporting
- Professional development experience

## 🚀 Production Deployment

### **Development vs Production**
- **Development**: Both servers run concurrently
- **Production**: Battle server runs separately on dedicated port
- **Environment Variables**: Different configs for dev/prod
- **Build Process**: Client builds to static files, server deploys separately

### **Deployment Commands**
```bash
# Development
npm run dev:ps

# Production Client
npm run build

# Production Server
cd server && npm start
```

---

## 🎉 Ready to Develop!

Your concurrent development environment is now set up! 

**To start development:**
```bash
npm run dev:ps
```

**Both servers will start automatically:**
- 🚀 Battle Server: http://localhost:3001 (AI-powered battles)
- 🎨 Client Server: http://localhost:5173 (Main application)

**Happy coding with your AI-powered battle system!** 🤖⚔️🎓
