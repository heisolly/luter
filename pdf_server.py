#!/usr/bin/env python3
"""
PDF Processing Server for Luter
FastAPI server for PDF processing and rendering
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import tempfile
import shutil
import json
from typing import Dict, Any
import uvicorn
from pdf_processor import PDFProcessor

app = FastAPI(title="Luter PDF Processing Server", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize PDF processor
pdf_processor = PDFProcessor()

# Create temp directory for file processing
TEMP_DIR = tempfile.mkdtemp()
OUTPUT_DIR = os.path.join(TEMP_DIR, "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.get("/")
async def root():
    return {"message": "Luter PDF Processing Server", "status": "running"}

@app.post("/process-pdf")
async def process_pdf(file: UploadFile = File(...)):
    """Process uploaded PDF file"""
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Save uploaded file temporarily
        temp_pdf_path = os.path.join(TEMP_DIR, file.filename)
        with open(temp_pdf_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create output directory for this file
        file_output_dir = os.path.join(OUTPUT_DIR, file.filename.replace('.pdf', ''))
        os.makedirs(file_output_dir, exist_ok=True)
        
        # Process PDF
        result = pdf_processor.process_pdf(temp_pdf_path, file_output_dir)
        
        # Clean up temp file
        os.remove(temp_pdf_path)
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """Extract text from PDF for AI processing"""
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Save uploaded file temporarily
        temp_pdf_path = os.path.join(TEMP_DIR, file.filename)
        with open(temp_pdf_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract text
        text = pdf_processor.extract_text_for_ai(temp_pdf_path)
        
        # Clean up temp file
        os.remove(temp_pdf_path)
        
        return JSONResponse(content={"text": text, "filename": file.filename})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting text: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "temp_dir": TEMP_DIR}

@app.get("/cleanup")
async def cleanup_temp():
    """Clean up temporary files"""
    try:
        shutil.rmtree(TEMP_DIR)
        os.makedirs(TEMP_DIR, exist_ok=True)
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        return {"message": "Temporary files cleaned up"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cleaning up: {str(e)}")

if __name__ == "__main__":
    print("Starting Luter PDF Processing Server...")
    print(f"Temp directory: {TEMP_DIR}")
    print(f"Output directory: {OUTPUT_DIR}")
    
    uvicorn.run(
        "pdf_server:app",
        host="127.0.0.1",
        port=8001,
        reload=True,
        log_level="info"
    )
