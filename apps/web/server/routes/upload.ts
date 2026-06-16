import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { put } from '@vercel/blob'
import prisma from '../../src/lib/prisma'
import { getServerSession } from '../lib/session'
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  ALLOWED_SCREENSHOT_MIME_TYPES,
  MAX_ATTACHMENT_COUNT,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_SCREENSHOT_COUNT,
  MAX_SCREENSHOT_SIZE_BYTES,
} from '../../src/lib/issueValidation'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = MAX_SCREENSHOT_SIZE_BYTES
const MAX_FILE_COUNT = MAX_SCREENSHOT_COUNT
const ALLOWED_TYPES = [...ALLOWED_SCREENSHOT_MIME_TYPES]
const MAX_ATTACHMENT_FILE_SIZE = MAX_ATTACHMENT_SIZE_BYTES
const MAX_ATTACHMENT_FILE_COUNT = MAX_ATTACHMENT_COUNT
const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}
const IS_VERCEL = Boolean(process.env.VERCEL)
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN
const USE_BLOB_STORAGE = IS_VERCEL && Boolean(BLOB_TOKEN)

function detectMimeFromMagic(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png'
  }
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return 'image/gif'
  }
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

function isAllowedMimeType(value: string): boolean {
  return ALLOWED_TYPES.includes(value as any)
}

function isAllowedAttachmentMimeType(value: string): boolean {
  return ALLOWED_ATTACHMENT_MIME_TYPES.includes(value as any)
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '_')
  return cleaned.slice(0, 120) || 'file'
}

function extFromName(name: string): string | null {
  const idx = name.lastIndexOf('.')
  if (idx <= 0 || idx === name.length - 1) return null
  return name.slice(idx + 1).toLowerCase()
}

function extFromMime(mime: string): string {
  if (mime === 'application/pdf') return 'pdf'
  if (mime === 'text/plain') return 'txt'
  if (mime === 'text/csv') return 'csv'
  if (mime === 'application/zip') return 'zip'
  if (mime === 'application/json') return 'json'
  if (mime === 'application/msword') return 'doc'
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return 'docx'
  if (mime === 'application/vnd.ms-excel') return 'xls'
  if (
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
    return 'xlsx'
  return 'bin'
}

function toDataUrl(mimeType: string, buffer: Buffer): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

async function persistUploadedFile(options: {
  buffer: Buffer
  mimeType: string
  storedFilename: string
  kind: 'screenshot' | 'attachment'
}): Promise<{ url: string }> {
  const { buffer, mimeType, storedFilename, kind } = options

  if (USE_BLOB_STORAGE) {
    try {
      const blob = await put(`uploads/${storedFilename}`, buffer, {
        access: 'public',
        token: BLOB_TOKEN,
        contentType: mimeType,
        addRandomSuffix: false,
      })
      return { url: blob.url }
    } catch (error) {
      console.error(`${kind} blob upload failed, falling back to data URL`, error)
    }
  }

  if (!IS_VERCEL) {
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true })
      const filepath = path.join(UPLOAD_DIR, storedFilename)
      await fs.writeFile(filepath, buffer)
      return { url: `/uploads/${storedFilename}` }
    } catch (error) {
      console.error(`${kind} disk upload failed, falling back to data URL`, error)
    }
  }

  return { url: toDataUrl(mimeType, buffer) }
}

const app = new Hono()
  .post('/', async (c) => {
    try {
      // Resolve session using the server session helper
      const session = await getServerSession(c.req.raw.headers)

      if (!session?.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } })
      }

      const formData = await c.req.formData()
      const files = formData.getAll('screenshots')
      const attachmentFiles = formData.getAll('attachments')

      if (files.length > MAX_FILE_COUNT) {
        return new Response(JSON.stringify({ error: `Maximum ${MAX_FILE_COUNT} files allowed` }), { status: 400, headers: { 'content-type': 'application/json' } })
      }
      if (attachmentFiles.length > MAX_ATTACHMENT_FILE_COUNT) {
        return new Response(JSON.stringify({ error: `Maximum ${MAX_ATTACHMENT_FILE_COUNT} attachments allowed` }), { status: 400, headers: { 'content-type': 'application/json' } })
      }

      const savedFiles: { url: string; filename: string; mimeType: string; sizeBytes: number }[] = []
      const rejectedFiles: { filename: string; reason: string }[] = []
      const savedAttachments: { url: string; filename: string; mimeType: string; sizeBytes: number }[] = []
      const rejectedAttachments: { filename: string; reason: string }[] = []

      for (const rawFile of files) {
        if (!(rawFile instanceof File)) {
          rejectedFiles.push({ filename: 'unknown', reason: 'Invalid file payload' })
          continue
        }

        const originalName = rawFile.name || 'unnamed'

        if (!rawFile.name || rawFile.name.length > 255) {
          rejectedFiles.push({ filename: originalName, reason: 'Invalid filename' })
          continue
        }

        if (!rawFile.type) {
          rejectedFiles.push({ filename: originalName, reason: 'Missing MIME type' })
          continue
        }

        if (!isAllowedMimeType(rawFile.type)) {
          rejectedFiles.push({ filename: originalName, reason: 'Unsupported file type' })
          continue
        }

        if (rawFile.size > MAX_FILE_SIZE) {
          rejectedFiles.push({ filename: originalName, reason: `File exceeds ${MAX_FILE_SIZE} bytes` })
          continue
        }

        const buffer = Buffer.from(await rawFile.arrayBuffer())
        const detectedType = detectMimeFromMagic(buffer)
        if (!detectedType || detectedType !== rawFile.type) {
          rejectedFiles.push({ filename: originalName, reason: 'File content does not match declared type' })
          continue
        }

        const ext = MIME_EXTENSION[detectedType]
        const storedFilename = `${randomUUID()}.${ext}`
        const { url } = await persistUploadedFile({ buffer, mimeType: detectedType, storedFilename, kind: 'screenshot' })

        savedFiles.push({ url, filename: originalName, mimeType: detectedType, sizeBytes: rawFile.size })
      }

      for (const rawFile of attachmentFiles) {
        if (!(rawFile instanceof File)) {
          rejectedAttachments.push({ filename: 'unknown', reason: 'Invalid file payload' })
          continue
        }

        const originalName = rawFile.name || 'unnamed'
        if (!rawFile.name || rawFile.name.length > 255) {
          rejectedAttachments.push({ filename: originalName, reason: 'Invalid filename' })
          continue
        }
        if (!rawFile.type || !isAllowedAttachmentMimeType(rawFile.type)) {
          rejectedAttachments.push({ filename: originalName, reason: 'Unsupported file type' })
          continue
        }
        if (rawFile.size > MAX_ATTACHMENT_FILE_SIZE) {
          rejectedAttachments.push({ filename: originalName, reason: `File exceeds ${MAX_ATTACHMENT_FILE_SIZE} bytes` })
          continue
        }

        const sourceExt = extFromName(originalName)
        const ext = sourceExt || extFromMime(rawFile.type)
        const storedFilename = `${randomUUID()}-${sanitizeFilename(originalName)}.${ext}`
        const buffer = Buffer.from(await rawFile.arrayBuffer())
        const { url } = await persistUploadedFile({ buffer, mimeType: rawFile.type, storedFilename, kind: 'attachment' })

        savedAttachments.push({ url, filename: originalName, mimeType: rawFile.type, sizeBytes: rawFile.size })
      }

      if (
        savedFiles.length === 0 &&
        files.length > 0 &&
        savedAttachments.length === 0 &&
        attachmentFiles.length === 0
      ) {
        return new Response(JSON.stringify({ error: 'No valid files uploaded', rejected: rejectedFiles }), { status: 400, headers: { 'content-type': 'application/json' } })
      }

      if (
        savedAttachments.length === 0 &&
        attachmentFiles.length > 0 &&
        savedFiles.length === 0 &&
        files.length === 0
      ) {
        return new Response(JSON.stringify({ error: 'No valid attachments uploaded', attachmentsRejected: rejectedAttachments }), { status: 400, headers: { 'content-type': 'application/json' } })
      }

      return new Response(JSON.stringify({ files: savedFiles, rejected: rejectedFiles, attachments: savedAttachments, attachmentsRejected: rejectedAttachments }), { headers: { 'content-type': 'application/json' } })
    } catch (error) {
      console.error('Upload handler failed', error)
      return new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500, headers: { 'content-type': 'application/json' } })
    }
  })

export default app
