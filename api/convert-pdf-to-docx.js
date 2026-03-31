/**
 * Serverless Function: PDF to DOCX Conversion
 * Converts PDF files to Word documents using cloud services
 * Deploy to Vercel, Netlify, or AWS Lambda
 */

const CloudConvert = require('cloudconvert');
const fs = require('fs');
const path = require('path');

// Initialize CloudConvert client
const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdfUrl, metadata = {}, conversionMethod = 'cloudconvert' } = req.body;

    if (!pdfUrl) {
      return res.status(400).json({ error: 'PDF URL is required' });
    }

    console.log(`Starting PDF to DOCX conversion: ${pdfUrl}`);
    console.log(`Conversion method: ${conversionMethod}`);

    let result;

    switch (conversionMethod) {
      case 'cloudconvert':
        result = await convertWithCloudConvert(pdfUrl, metadata);
        break;
      case 'aspose':
        result = await convertWithAspose(pdfUrl, metadata);
        break;
      case 'pdfco':
        result = await convertWithPdfCo(pdfUrl, metadata);
        break;
      default:
        result = await convertWithCloudConvert(pdfUrl, metadata);
    }

    res.status(200).json({
      success: true,
      ...result,
      convertedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('PDF conversion failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Convert PDF using CloudConvert API
 */
async function convertWithCloudConvert(pdfUrl, metadata) {
  try {
    console.log('Using CloudConvert for conversion...');

    // Create conversion job
    const job = await cloudConvert.jobs.create({
      tasks: {
        'import-pdf': {
          operation: 'import/url',
          url: pdfUrl,
          filename: `${metadata.title || 'document'}.pdf`
        },
        'convert-pdf': {
          operation: 'convert',
          input: 'import-pdf',
          output_format: 'docx',
          engine: 'office',
          optimize_for: 'web'
        },
        'export-docx': {
          operation: 'export/url',
          input: 'convert-pdf',
          filename: `${metadata.title || 'document'}-converted.docx`
        }
      }
    });

    // Wait for job completion
    const jobResult = await cloudConvert.jobs.wait(job.id);
    
    // Get the converted file URL
    const exportTask = jobResult.tasks.find(task => task.operation === 'export/url');
    
    if (!exportTask || exportTask.status !== 'finished') {
      throw new Error('Conversion failed - export task not completed');
    }

    // Download the converted file
    const docxResponse = await fetch(exportTask.result.files[0].url);
    const docxBuffer = await docxResponse.arrayBuffer();

    // Convert to base64 for client
    const docxBase64 = Buffer.from(docxBuffer).toString('base64');

    return {
      method: 'cloudconvert',
      quality: 'high',
      docxBase64,
      downloadUrl: exportTask.result.files[0].url,
      metadata: {
        ...metadata,
        conversionMethod: 'cloudconvert',
        originalSize: exportTask.result.files[0].size,
        convertedSize: docxBuffer.byteLength
      }
    };

  } catch (error) {
    console.error('CloudConvert error:', error);
    throw new Error(`CloudConvert conversion failed: ${error.message}`);
  }
}

/**
 * Convert PDF using Aspose PDF API
 */
async function convertWithAspose(pdfUrl, metadata) {
  try {
    console.log('Using Aspose PDF for conversion...');

    // Aspose PDF API call
    const asposeApiUrl = 'https://api.aspose.cloud/v3.0/pdf/convert/docx';
    
    const response = await fetch(asposeApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ASPOSE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: pdfUrl,
        outputFileName: `${metadata.title || 'document'}-converted.docx`
      })
    });

    if (!response.ok) {
      throw new Error(`Aspose API error: ${response.status} ${response.statusText}`);
    }

    const docxBuffer = await response.arrayBuffer();
    const docxBase64 = Buffer.from(docxBuffer).toString('base64');

    return {
      method: 'aspose',
      quality: 'enterprise',
      docxBase64,
      metadata: {
        ...metadata,
        conversionMethod: 'aspose',
        convertedSize: docxBuffer.byteLength
      }
    };

  } catch (error) {
    console.error('Aspose error:', error);
    throw new Error(`Aspose conversion failed: ${error.message}`);
  }
}

/**
 * Convert PDF using PDF.co API
 */
async function convertWithPdfCo(pdfUrl, metadata) {
  try {
    console.log('Using PDF.co for conversion...');

    const pdfCoApiUrl = 'https://api.pdf.co/v1/pdf/convert/to/docx';
    
    const response = await fetch(pdfCoApiUrl, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.PDF_CO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: pdfUrl,
        name: `${metadata.title || 'document'}-converted.docx`,
        async: false
      })
    });

    if (!response.ok) {
      throw new Error(`PDF.co API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.url) {
      throw new Error('PDF.co did not return converted file URL');
    }

    // Download the converted file
    const docxResponse = await fetch(result.url);
    const docxBuffer = await docxResponse.arrayBuffer();
    const docxBase64 = Buffer.from(docxBuffer).toString('base64');

    return {
      method: 'pdfco',
      quality: 'medium',
      docxBase64,
      downloadUrl: result.url,
      metadata: {
        ...metadata,
        conversionMethod: 'pdfco',
        convertedSize: docxBuffer.byteLength
      }
    };

  } catch (error) {
    console.error('PDF.co error:', error);
    throw new Error(`PDF.co conversion failed: ${error.message}`);
  }
}

/**
 * Health check endpoint
 */
export async function GET(req, res) {
  res.status(200).json({
    status: 'ready',
    availableMethods: [
      { name: 'cloudconvert', status: 'available', quality: 'high' },
      { name: 'aspose', status: 'available', quality: 'enterprise' },
      { name: 'pdfco', status: 'available', quality: 'medium' }
    ],
    timestamp: new Date().toISOString()
  });
}
