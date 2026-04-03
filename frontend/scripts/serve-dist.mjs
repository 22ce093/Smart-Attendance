import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = fileURLToPath(new URL('.', import.meta.url))
const distDir = normalize(join(scriptDir, '..', 'dist'))
const port = Number(process.env.PORT) || 4173
const host = process.env.HOST || '0.0.0.0'

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const isPathInsideDist = (absolutePath) => {
  const normalizedPath = normalize(absolutePath)
  return normalizedPath === distDir || normalizedPath.startsWith(`${distDir}${sep}`)
}

const getSafePath = (requestPathname = '/') => {
  const normalizedPathname = normalize(requestPathname).replace(/^(\.\.(\/|\\|$))+/, '')
  return join(distDir, normalizedPathname)
}

const sendFile = (res, filePath, method = 'GET') => {
  const extension = extname(filePath).toLowerCase()
  res.statusCode = 200
  res.setHeader('Content-Type', MIME_TYPES[extension] || 'application/octet-stream')
  res.setHeader('Cache-Control', extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable')

  if (method === 'HEAD') {
    res.end()
    return
  }

  createReadStream(filePath).pipe(res)
}

if (!existsSync(distDir)) {
  console.error(`Build output not found at ${distDir}. Run "npm run build" first.`)
  process.exit(1)
}

const server = createServer((req, res) => {
  const method = req.method || 'GET'
  if (method !== 'GET' && method !== 'HEAD') {
    res.statusCode = 405
    res.end('Method Not Allowed')
    return
  }

  const hostHeader = req.headers.host || 'localhost'
  const requestUrl = new URL(req.url || '/', `http://${hostHeader}`)
  const requestPathname = decodeURIComponent(requestUrl.pathname)

  const directFilePath = getSafePath(requestPathname)
  if (isPathInsideDist(directFilePath) && existsSync(directFilePath) && statSync(directFilePath).isFile()) {
    sendFile(res, directFilePath, method)
    return
  }

  const indexFilePath = join(distDir, 'index.html')
  if (existsSync(indexFilePath)) {
    sendFile(res, indexFilePath, method)
    return
  }

  res.statusCode = 404
  res.end('Not Found')
})

server.listen(port, host, () => {
  console.log(`Serving frontend from ${distDir} on http://${host}:${port}`)
})
