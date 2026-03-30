#!/usr/bin/env python3
"""
PDF Processor for Luter - Enhanced PDF viewing and processing
Uses PyMuPDF (fitz) for better PDF rendering and text extraction
"""

import fitz  # PyMuPDF
import json
import base64
import io
import os
from typing import Dict, List, Any
from PIL import Image
import argparse

class PDFProcessor:
    def __init__(self):
        self.supported_formats = ['.pdf']
    
    def process_pdf(self, pdf_path: str, output_dir: str = None) -> Dict[str, Any]:
        """
        Process PDF file and extract pages, text, and images
        """
        try:
            # Open PDF document
            doc = fitz.open(pdf_path)
            
            result = {
                'success': True,
                'pages': [],
                'metadata': self._extract_metadata(doc),
                'total_pages': doc.page_count,
                'outline': self._extract_outline(doc)
            }
            
            # Process each page
            for page_num in range(doc.page_count):
                page = doc[page_num]
                page_data = self._process_page(page, page_num, output_dir)
                result['pages'].append(page_data)
            
            doc.close()
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'pages': [],
                'total_pages': 0
            }
    
    def _process_page(self, page, page_num: int, output_dir: str = None) -> Dict[str, Any]:
        """Process individual PDF page"""
        try:
            # Get page dimensions
            rect = page.rect
            page_data = {
                'page_number': page_num + 1,
                'width': rect.width,
                'height': rect.height,
                'text': page.get_text(),
                'text_blocks': self._extract_text_blocks(page),
                'images': self._extract_images(page, page_num, output_dir),
                'annotations': self._extract_annotations(page),
                'links': self._extract_links(page)
            }
            
            # Generate page image for preview
            if output_dir:
                image_path = self._render_page_as_image(page, page_num, output_dir)
                page_data['preview_image'] = image_path
            
            return page_data
            
        except Exception as e:
            return {
                'page_number': page_num + 1,
                'error': str(e),
                'text': '',
                'text_blocks': [],
                'images': [],
                'annotations': [],
                'links': []
            }
    
    def _extract_metadata(self, doc) -> Dict[str, Any]:
        """Extract PDF metadata"""
        metadata = doc.metadata
        return {
            'title': metadata.get('title', ''),
            'author': metadata.get('author', ''),
            'subject': metadata.get('subject', ''),
            'creator': metadata.get('creator', ''),
            'producer': metadata.get('producer', ''),
            'creation_date': metadata.get('creationDate', ''),
            'modification_date': metadata.get('modDate', ''),
            'encrypted': doc.is_encrypted
        }
    
    def _extract_outline(self, doc) -> List[Dict[str, Any]]:
        """Extract PDF outline/bookmarks"""
        outline = []
        try:
            outline_items = doc.get_outline()
            for item in outline_items:
                outline.append({
                    'title': item.title,
                    'level': item.level,
                    'page': item.page + 1 if item.page else 0
                })
        except:
            pass
        return outline
    
    def _extract_text_blocks(self, page) -> List[Dict[str, Any]]:
        """Extract text blocks with position information"""
        blocks = []
        try:
            text_blocks = page.get_text("blocks")
            for block in text_blocks:
                if len(block) >= 4 and block[4].strip():
                    x0, y0, x1, y1, text, block_no, block_type = block[:7]
                    blocks.append({
                        'text': text.strip(),
                        'x0': x0,
                        'y0': y0,
                        'x1': x1,
                        'y1': y1,
                        'width': x1 - x0,
                        'height': y1 - y0,
                        'block_type': block_type
                    })
        except Exception as e:
            print(f"Error extracting text blocks: {e}")
        
        return blocks
    
    def _extract_images(self, page, page_num: int, output_dir: str = None) -> List[Dict[str, Any]]:
        """Extract images from PDF page"""
        images = []
        try:
            image_list = page.get_images()
            
            for img_index, img in enumerate(image_list):
                # Get image data
                xref = img[0]
                pix = fitz.Pixmap(page.parent, xref)
                
                if pix.n - pix.alpha < 4:  # GRAY or RGB
                    if output_dir:
                        img_path = os.path.join(output_dir, f"page_{page_num + 1}_img_{img_index + 1}.png")
                        pix.save(img_path)
                        images.append({
                            'index': img_index,
                            'path': img_path,
                            'width': pix.width,
                            'height': pix.height
                        })
                    else:
                        # Convert to base64 for JSON response
                        img_data = pix.tobytes("png")
                        img_base64 = base64.b64encode(img_data).decode('utf-8')
                        images.append({
                            'index': img_index,
                            'base64': img_base64,
                            'width': pix.width,
                            'height': pix.height
                        })
                
                pix = None  # Free memory
                
        except Exception as e:
            print(f"Error extracting images from page {page_num + 1}: {e}")
        
        return images
    
    def _extract_annotations(self, page) -> List[Dict[str, Any]]:
        """Extract annotations from PDF page"""
        annotations = []
        try:
            annots = page.annots()
            for annot in annots:
                annotations.append({
                    'type': annot.type[0],
                    'content': annot.info.get("content", ""),
                    'rect': list(annot.rect),
                    'color': annot.colors.get("stroke", [0, 0, 0])
                })
        except Exception as e:
            print(f"Error extracting annotations: {e}")
        
        return annotations
    
    def _extract_links(self, page) -> List[Dict[str, Any]]:
        """Extract links from PDF page"""
        links = []
        try:
            link_list = page.get_links()
            for link in link_list:
                links.append({
                    'uri': link.get('uri', ''),
                    'rect': list(link['from']),
                    'page': link.get('page', 0)
                })
        except Exception as e:
            print(f"Error extracting links: {e}")
        
        return links
    
    def _render_page_as_image(self, page, page_num: int, output_dir: str) -> str:
        """Render PDF page as image for preview"""
        try:
            # Create high-quality rendering
            mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better quality
            pix = page.get_pixmap(matrix=mat)
            
            img_path = os.path.join(output_dir, f"page_{page_num + 1}_preview.png")
            pix.save(img_path)
            pix = None
            
            return img_path
            
        except Exception as e:
            print(f"Error rendering page {page_num + 1} as image: {e}")
            return ""
    
    def extract_text_for_ai(self, pdf_path: str) -> str:
        """Extract text optimized for AI processing"""
        try:
            doc = fitz.open(pdf_path)
            text_content = []
            
            for page_num in range(min(doc.page_count, 50)):  # Limit to first 50 pages
                page = doc[page_num]
                page_text = page.get_text()
                if page_text.strip():
                    text_content.append(f"=== Page {page_num + 1} ===\n{page_text}")
            
            doc.close()
            return "\n\n".join(text_content)
            
        except Exception as e:
            return f"Error extracting text: {str(e)}"

def main():
    parser = argparse.ArgumentParser(description='PDF Processor for Luter')
    parser.add_argument('pdf_path', help='Path to PDF file')
    parser.add_argument('--output', help='Output directory for images')
    parser.add_argument('--extract-text', action='store_true', help='Extract text only for AI')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    
    args = parser.parse_args()
    
    processor = PDFProcessor()
    
    if args.extract_text:
        # Extract text for AI processing
        text = processor.extract_text_for_ai(args.pdf_path)
        if args.json:
            print(json.dumps({'text': text}))
        else:
            print(text)
    else:
        # Full PDF processing
        if args.output and not os.path.exists(args.output):
            os.makedirs(args.output)
        
        result = processor.process_pdf(args.pdf_path, args.output)
        
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(f"Processed PDF: {result['total_pages']} pages")
            print(f"Success: {result['success']}")
            if not result['success']:
                print(f"Error: {result.get('error', 'Unknown error')}")

if __name__ == "__main__":
    main()
