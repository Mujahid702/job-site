export interface FileValidationResult {
  valid: boolean
  error?: string
}

export function validateUploadedFile(file: File, buffer: Buffer): FileValidationResult {
  const maxSize = 5 * 1024 * 1024 // 5MB

  // 1. Check size bounds
  if (file.size > maxSize || buffer.length > maxSize) {
    return { valid: false, error: 'File size exceeds the maximum 5MB limit.' }
  }

  if (file.size === 0 || buffer.length === 0) {
    return { valid: false, error: 'Uploaded file is empty.' }
  }

  const fileName = file.name.toLowerCase()
  const ext = fileName.split('.').pop() || ''

  // 2. Strict blocked extensions check
  const blockedExts = ['exe', 'zip', 'html', 'js', 'bat', 'sh']
  if (blockedExts.includes(ext)) {
    return { valid: false, error: `File type .${ext} is blocked for security reasons.` }
  }

  // 3. Allowed extensions check
  if (ext !== 'pdf' && ext !== 'docx') {
    return { valid: false, error: 'Only PDF and DOCX files are allowed.' }
  }

  // 4. File signature (magic bytes) validation
  if (buffer.length < 4) {
    return { valid: false, error: 'Invalid or corrupt file signature.' }
  }

  const magic = buffer.toString('hex', 0, 4).toLowerCase()

  if (ext === 'pdf') {
    // PDF Magic number: %PDF (25 50 44 46)
    if (magic !== '25504446') {
      return {
        valid: false,
        error: 'Invalid file signature. Spoofed PDF detected.',
      }
    }
  } else if (ext === 'docx') {
    // DOCX ZIP Magic number: PK\x03\x04 (50 4b 03 04)
    if (magic !== '504b0304') {
      return {
        valid: false,
        error: 'Invalid file signature. Spoofed DOCX detected.',
      }
    }
  }

  return { valid: true }
}
