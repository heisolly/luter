#!/usr/bin/env python3
"""
Setup script for Luter PDF Processing Server
Installs dependencies and starts the server
"""

import subprocess
import sys
import os
import argparse

def install_requirements():
    """Install Python requirements"""
    print("📦 Installing Python dependencies...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def start_server(host="127.0.0.1", port=8001, reload=False):
    """Start the PDF processing server"""
    print(f"🚀 Starting PDF Processing Server on http://{host}:{port}")
    
    cmd = [
        sys.executable, "pdf_server.py"
    ]
    
    env = os.environ.copy()
    if reload:
        env["PYTHONPATH"] = os.getcwd()
    
    try:
        subprocess.run(cmd, env=env)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")

def check_dependencies():
    """Check if required packages are installed"""
    required_packages = ['fitz', 'fastapi', 'uvicorn', 'PIL']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing packages: {', '.join(missing_packages)}")
        print("💡 Run with --install to install dependencies")
        return False
    
    print("✅ All dependencies are installed!")
    return True

def main():
    parser = argparse.ArgumentParser(description='Luter PDF Server Setup')
    parser.add_argument('--install', action='store_true', help='Install dependencies')
    parser.add_argument('--start', action='store_true', help='Start the server')
    parser.add_argument('--host', default='127.0.0.1', help='Server host')
    parser.add_argument('--port', type=int, default=8001, help='Server port')
    parser.add_argument('--reload', action='store_true', help='Enable auto-reload')
    parser.add_argument('--check', action='store_true', help='Check dependencies only')
    
    args = parser.parse_args()
    
    print("🔧 Luter PDF Processing Server Setup")
    print("=" * 40)
    
    if args.install:
        if install_requirements():
            print("🎉 Setup complete! You can now start the server with --start")
        return
    
    if args.check:
        check_dependencies()
        return
    
    if args.start:
        if not check_dependencies():
            print("💡 Please run with --install first")
            return
        start_server(args.host, args.port, args.reload)
        return
    
    # Default behavior: check and offer to install/start
    if check_dependencies():
        print("\n🚀 Ready to start server!")
        response = input("Start the PDF server now? (y/n): ").lower().strip()
        if response in ['y', 'yes']:
            start_server(args.host, args.port, reload=True)
    else:
        response = input("Install missing dependencies? (y/n): ").lower().strip()
        if response in ['y', 'yes']:
            if install_requirements():
                print("\n🚀 Ready to start server!")
                response = input("Start the PDF server now? (y/n): ").lower().strip()
                if response in ['y', 'yes']:
                    start_server(args.host, args.port, reload=True)

if __name__ == "__main__":
    main()
