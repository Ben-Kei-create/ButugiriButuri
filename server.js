const http = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT) || 4173;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');

const COMMENT_LIMITS = {
  authorLength: 32,
  bodyLength: 2000,
  commentIdLength: 120,
  deleteTokenLength: 160,
  unitIdLength: 120,
  sectionIdLength: 120,
  payloadBytes: 16 * 1024
};

const POST_WINDOW_MS = 5000;
const postRateLimit = new Map();

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
};

const BLOCKED_PATH_PREFIXES = [
  '.git/',
  'data/'
];

const BLOCKED_FILES = new Set([
  '.gitignore',
  'package.json',
  'server.js'
]);

let commentsStore = {};
let writeQueue = Promise.resolve();

async function ensureCommentsStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    const raw = await fs.readFile(COMMENTS_FILE, 'utf8');
    commentsStore = safeParseStore(raw);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    commentsStore = {};
    await persistCommentsStore();
  }
}

function safeParseStore(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function persistCommentsStore() {
  writeQueue = writeQueue.then(() => (
    fs.writeFile(COMMENTS_FILE, JSON.stringify(commentsStore, null, 2), 'utf8')
  ));

  return writeQueue;
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(body);
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(message);
}

function getClientIp(request) {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  return request.socket.remoteAddress || 'unknown';
}

function cleanIdentifier(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function cleanAuthor(value) {
  const normalized = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

  return (normalized || '匿名').slice(0, COMMENT_LIMITS.authorLength);
}

function cleanBody(value) {
  return String(value || '').trim().slice(0, COMMENT_LIMITS.bodyLength);
}

function cleanDeleteToken(value) {
  return String(value || '').trim().slice(0, COMMENT_LIMITS.deleteTokenLength);
}

function hashDeleteToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createDeleteToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function sanitizeComment(comment) {
  if (!comment || typeof comment !== 'object') {
    return null;
  }

  return {
    id: String(comment.id || ''),
    author: String(comment.author || '匿名'),
    body: String(comment.body || ''),
    createdAt: String(comment.createdAt || new Date().toISOString())
  };
}

function enforcePostRateLimit(request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const lastPost = postRateLimit.get(ip) || 0;

  if (now - lastPost < POST_WINDOW_MS) {
    const waitSeconds = Math.ceil((POST_WINDOW_MS - (now - lastPost)) / 1000);
    const error = new Error(`連続投稿が早すぎます。${waitSeconds} 秒ほど待ってください。`);
    error.statusCode = 429;
    throw error;
  }

  postRateLimit.set(ip, now);
}

function normalizeCommentsBySection(unitComments) {
  if (!unitComments || typeof unitComments !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(unitComments).map(([sectionId, comments]) => [
      sectionId,
      Array.isArray(comments)
        ? comments.map(sanitizeComment).filter(Boolean)
        : []
    ])
  );
}

async function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    let tooLarge = false;

    request.setEncoding('utf8');

    request.on('data', chunk => {
      if (tooLarge) return;

      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > COMMENT_LIMITS.payloadBytes) {
        tooLarge = true;
        const error = new Error('リクエストが大きすぎます。');
        error.statusCode = 413;
        reject(error);
      }
    });

    request.on('end', () => {
      if (!tooLarge) {
        resolve(body);
      }
    });

    request.on('error', reject);
  });
}

async function handleApi(request, response, url) {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    response.end();
    return;
  }

  if (url.pathname === '/api/health') {
    sendJson(response, 200, {
      ok: true,
      sharedComments: true
    });
    return;
  }

  if (url.pathname !== '/api/comments') {
    sendJson(response, 404, { error: 'API endpoint not found' });
    return;
  }

  if (request.method === 'GET') {
    const unitId = cleanIdentifier(url.searchParams.get('unitId'), COMMENT_LIMITS.unitIdLength);

    if (!unitId) {
      sendJson(response, 400, { error: 'unitId is required' });
      return;
    }

    sendJson(response, 200, {
      unitId,
      commentsBySection: normalizeCommentsBySection(commentsStore[unitId])
    });
    return;
  }

  if (request.method === 'POST') {
    try {
      enforcePostRateLimit(request);

      const rawBody = await readRequestBody(request);
      const payload = JSON.parse(rawBody || '{}');

      const unitId = cleanIdentifier(payload.unitId, COMMENT_LIMITS.unitIdLength);
      const sectionId = cleanIdentifier(payload.sectionId, COMMENT_LIMITS.sectionIdLength);
      const author = cleanAuthor(payload.author);
      const body = cleanBody(payload.body);

      if (!unitId || !sectionId) {
        sendJson(response, 400, { error: 'unitId and sectionId are required' });
        return;
      }

      if (!body) {
        sendJson(response, 400, { error: '補足コメントを入力してください。' });
        return;
      }

      const deleteToken = createDeleteToken();
      const comment = {
        id: crypto.randomUUID(),
        author,
        body,
        createdAt: new Date().toISOString(),
        deleteTokenHash: hashDeleteToken(deleteToken)
      };

      if (!commentsStore[unitId]) {
        commentsStore[unitId] = {};
      }

      if (!Array.isArray(commentsStore[unitId][sectionId])) {
        commentsStore[unitId][sectionId] = [];
      }

      commentsStore[unitId][sectionId].push(comment);
      await persistCommentsStore();

      sendJson(response, 201, {
        ok: true,
        comment: sanitizeComment(comment),
        deleteToken
      });
      return;
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJson(response, 400, { error: 'JSON の形式が不正です。' });
        return;
      }

      sendJson(response, error.statusCode || 500, {
        error: error.message || 'コメント保存に失敗しました。'
      });
      return;
    }
  }

  if (request.method === 'DELETE') {
    try {
      const rawBody = await readRequestBody(request);
      const payload = JSON.parse(rawBody || '{}');

      const unitId = cleanIdentifier(payload.unitId, COMMENT_LIMITS.unitIdLength);
      const sectionId = cleanIdentifier(payload.sectionId, COMMENT_LIMITS.sectionIdLength);
      const commentId = cleanIdentifier(payload.commentId, COMMENT_LIMITS.commentIdLength);
      const deleteToken = cleanDeleteToken(payload.deleteToken);

      if (!unitId || !sectionId || !commentId || !deleteToken) {
        sendJson(response, 400, { error: 'unitId, sectionId, commentId, deleteToken が必要です。' });
        return;
      }

      const sectionComments = commentsStore[unitId]?.[sectionId];
      if (!Array.isArray(sectionComments)) {
        sendJson(response, 404, { error: '補足コメントが見つかりません。' });
        return;
      }

      const commentIndex = sectionComments.findIndex(comment => String(comment.id) === commentId);
      if (commentIndex < 0) {
        sendJson(response, 404, { error: '補足コメントが見つかりません。' });
        return;
      }

      const comment = sectionComments[commentIndex];
      if (!comment.deleteTokenHash || comment.deleteTokenHash !== hashDeleteToken(deleteToken)) {
        sendJson(response, 403, { error: 'この補足コメントを削除する権限がありません。' });
        return;
      }

      sectionComments.splice(commentIndex, 1);

      if (sectionComments.length === 0) {
        delete commentsStore[unitId][sectionId];
      }

      if (commentsStore[unitId] && Object.keys(commentsStore[unitId]).length === 0) {
        delete commentsStore[unitId];
      }

      await persistCommentsStore();

      sendJson(response, 200, { ok: true, commentId });
      return;
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJson(response, 400, { error: 'JSON の形式が不正です。' });
        return;
      }

      sendJson(response, error.statusCode || 500, {
        error: error.message || 'コメント保存に失敗しました。'
      });
      return;
    }
  }

  sendJson(response, 405, { error: 'Method not allowed' });
}

async function serveStatic(response, url) {
  const relativePath = url.pathname === '/'
    ? 'index.html'
    : decodeURIComponent(url.pathname.replace(/^\/+/, ''));

  if (
    BLOCKED_FILES.has(relativePath) ||
    relativePath.startsWith('.') ||
    BLOCKED_PATH_PREFIXES.some(prefix => relativePath.startsWith(prefix))
  ) {
    sendText(response, 404, 'Not found');
    return;
  }

  const absolutePath = path.resolve(ROOT_DIR, relativePath);

  if (!absolutePath.startsWith(ROOT_DIR)) {
    sendText(response, 403, 'Forbidden');
    return;
  }

  try {
    const stat = await fs.stat(absolutePath);
    if (!stat.isFile()) {
      sendText(response, 404, 'Not found');
      return;
    }

    const extname = path.extname(absolutePath).toLowerCase();
    const mimeType = MIME_TYPES[extname] || 'application/octet-stream';
    const file = await fs.readFile(absolutePath);

    response.writeHead(200, {
      'Content-Type': mimeType
    });
    response.end(file);
  } catch (error) {
    if (error.code === 'ENOENT') {
      sendText(response, 404, 'Not found');
      return;
    }

    sendText(response, 500, 'Internal server error');
  }
}

async function startServer() {
  await ensureCommentsStore();

  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || `localhost:${PORT}`}`);

    if (url.pathname.startsWith('/api/')) {
      await handleApi(request, response, url);
      return;
    }

    await serveStatic(response, url);
  });

  server.listen(PORT, HOST, () => {
    console.log(`ButugiriButuri server running at http://localhost:${PORT}`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exitCode = 1;
});
