// File utility functions for better file handling across the application

/**
 * Get the correct MIME type for a file based on its extension
 */
export function getCorrectMimeType(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  
  const mimeTypes = {
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'rtf': 'application/rtf',
    
    // Presentations
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Spreadsheets
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'm4a': 'audio/mp4',
    'ogg': 'audio/ogg',
    
    // Video
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    
    // Other
    'apkg': 'application/octet-stream',
    'json': 'application/json'
  }
  
  return mimeTypes[ext] || file.type || 'application/octet-stream'
}

/**
 * Get file type category based on extension
 */
export function getFileCategory(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  
  const categories = {
    // Documents
    'pdf': 'document',
    'doc': 'document',
    'docx': 'document',
    'txt': 'document',
    'rtf': 'document',
    
    // Presentations
    'ppt': 'presentation',
    'pptx': 'presentation',
    
    // Spreadsheets
    'xls': 'spreadsheet',
    'xlsx': 'spreadsheet',
    'csv': 'spreadsheet',
    
    // Images
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'webp': 'image',
    'svg': 'image',
    
    // Audio
    'mp3': 'audio',
    'wav': 'audio',
    'm4a': 'audio',
    'ogg': 'audio',
    
    // Video
    'mp4': 'video',
    'webm': 'video',
    'mov': 'video',
    'avi': 'video',
    
    // Archives
    'zip': 'archive',
    'rar': 'archive',
    '7z': 'archive',
    
    // Other
    'apkg': 'anki',
    'json': 'data'
  }
  
  return categories[ext] || 'unknown'
}

/**
 * Check if file type is supported for upload
 */
export function isSupportedFileType(file) {
  const supportedExtensions = [
    // Documents
    'pdf', 'doc', 'docx', 'txt', 'rtf',
    // Presentations
    'ppt', 'pptx',
    // Spreadsheets
    'xls', 'xlsx', 'csv',
    // Images
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
    // Audio
    'mp3', 'wav', 'm4a', 'ogg',
    // Video
    'mp4', 'webm', 'mov', 'avi',
    // Archives
    'zip', 'rar', '7z',
    // Other
    'apkg', 'json'
  ]
  
  const ext = file.name.split('.').pop().toLowerCase()
  return supportedExtensions.includes(ext)
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate file before upload
 */
export function validateFile(file) {
  const maxSize = 100 * 1024 * 1024 // 100MB
  const errors = []
  
  if (!file) {
    errors.push('No file selected')
    return { valid: false, errors }
  }
  
  if (!isSupportedFileType(file)) {
    errors.push('File type not supported')
  }
  
  if (file.size > maxSize) {
    errors.push('File size exceeds 100MB limit')
  }
  
  if (file.size === 0) {
    errors.push('File is empty')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
