// ========================================
// Admin Editor
// ========================================

const DB_KEY = 'butugiri_articles';

// DOM要素
const titleInput = document.getElementById('title');
const categorySelect = document.getElementById('category');
const contentInput = document.getElementById('content');
const previewDiv = document.getElementById('preview');
const btnSave = document.getElementById('btn-save');
const btnClear = document.getElementById('btn-clear');
const btnNew = document.getElementById('btn-new');
const articlesContainer = document.getElementById('articles-container');
const alertContainer = document.getElementById('alert-container');

let currentEditId = null;

// --- 初期化 ---
function init() {
  marked.setOptions({
    breaks: true,
    gfm: true
  });

  loadArticles();
  setupEventListeners();
}

// --- イベントリスナー設定 ---
function setupEventListeners() {
  titleInput.addEventListener('input', updatePreview);
  contentInput.addEventListener('input', updatePreview);
  categorySelect.addEventListener('change', updatePreview);

  btnSave.addEventListener('click', saveArticle);
  btnClear.addEventListener('click', clearForm);
  btnNew.addEventListener('click', newArticle);
}

// --- マークダウン → HTML 変換 & プレビュー ---
function updatePreview() {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const category = categorySelect.value;

  let html = '';

  if (title) {
    html += `<h1>${escapeHtml(title)}</h1>`;
    html += `<p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.5rem;">${escapeHtml(category)} / ${new Date().toLocaleDateString('ja-JP')}</p>`;
  }

  if (content) {
    html += marked.parse(content);
  }

  previewDiv.innerHTML = html;

  // KaTeX レンダリング
  if (typeof renderMathInElement === 'function') {
    try {
      renderMathInElement(previewDiv, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    } catch (e) {
      console.warn('KaTeX error:', e);
    }
  }
}

// --- 記事保存 ---
function saveArticle() {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const category = categorySelect.value;

  if (!title || !content) {
    showAlert('タイトルと本文を入力してください', 'error');
    return;
  }

  const articles = getArticles();
  const now = new Date().toISOString();

  const article = {
    id: currentEditId || `${Date.now()}`,
    title,
    category,
    content,
    date: currentEditId ? (articles.find(a => a.id === currentEditId)?.date || now) : now,
    updatedAt: now
  };

  // 既存記事を更新、または新規追加
  const index = articles.findIndex(a => a.id === article.id);
  if (index >= 0) {
    articles[index] = article;
  } else {
    articles.push(article);
  }

  localStorage.setItem(DB_KEY, JSON.stringify(articles));
  showAlert(`"${title}" を保存しました`, 'success');
  loadArticles();
  clearForm();
}

// --- フォームクリア ---
function clearForm() {
  titleInput.value = '';
  contentInput.value = '';
  categorySelect.value = 'mechanics';
  currentEditId = null;
  previewDiv.innerHTML = '<p style="color: var(--text-secondary);">プレビューが表示されます...</p>';
}

// --- 新規記事作成 ---
function newArticle() {
  clearForm();
}

// --- 記事削除 ---
function deleteArticle(id) {
  if (!confirm('この記事を削除しますか？')) return;

  let articles = getArticles();
  articles = articles.filter(a => a.id !== id);
  localStorage.setItem(DB_KEY, JSON.stringify(articles));
  showAlert('記事を削除しました', 'success');
  loadArticles();
}

// --- 記事編集 ---
function editArticle(id) {
  const articles = getArticles();
  const article = articles.find(a => a.id === id);

  if (!article) return;

  titleInput.value = article.title;
  contentInput.value = article.content;
  categorySelect.value = article.category;
  currentEditId = id;
  updatePreview();

  // スクロール to エディタ
  titleInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- DB から記事読み込み ---
function getArticles() {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : [];
}

// --- 記事一覧表示 ---
function loadArticles() {
  const articles = getArticles().sort((a, b) => new Date(b.date) - new Date(a.date));

  if (articles.length === 0) {
    articlesContainer.innerHTML = '<p style="color: var(--text-secondary);">記事がまだありません</p>';
    return;
  }

  const categoryNames = {
    mechanics: '力学',
    electromagnetism: '電磁気学',
    thermodynamics: '熱力学',
    quantum: '量子力学',
    relativity: '相対性理論',
    math: '数理物理'
  };

  articlesContainer.innerHTML = articles.map(article => `
    <div class="article-item">
      <div class="article-item-info">
        <div class="article-item-title">${escapeHtml(article.title)}</div>
        <div class="article-item-meta">
          ${categoryNames[article.category]} • ${new Date(article.date).toLocaleDateString('ja-JP')}
        </div>
      </div>
      <div class="article-item-actions">
        <button class="btn btn-secondary btn-small" onclick="editArticle('${article.id}')">✎ 編集</button>
        <button class="btn btn-secondary btn-small" onclick="deleteArticle('${article.id}')">✕ 削除</button>
        <button class="btn btn-secondary btn-small" onclick="exportArticle('${article.id}')">⬇ 公開</button>
      </div>
    </div>
  `).join('');
}

// --- 記事をJSONとしてエクスポート（公開用） ---
function exportArticle(id) {
  const articles = getArticles();
  const article = articles.find(a => a.id === id);

  if (!article) return;

  const json = JSON.stringify(article, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `article-${article.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showAlert('記事をエクスポートしました（JSON形式）', 'success');
}

// --- アラート表示 ---
function showAlert(message, type) {
  const className = type === 'success' ? 'alert-success' : 'alert-error';
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert ${className}`;
  alertDiv.textContent = message;
  alertContainer.innerHTML = '';
  alertContainer.appendChild(alertDiv);

  setTimeout(() => alertDiv.remove(), 4000);
}

// --- HTML エスケープ ---
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ========================================
// ツールバー機能
// ========================================

// テキストエリアのカーソル位置にスニペットを挿入
function insertSnippet(before, after) {
  const ta = contentInput;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = ta.value.substring(start, end);
  const text = before + selected + after;

  ta.focus();
  ta.setRangeText(text, start, end, 'end');
  updatePreview();
}

// 選択テキストを囲む
function insertWrap(open, close) {
  const ta = contentInput;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = ta.value.substring(start, end) || '…';
  const text = open + selected + close;

  ta.focus();
  ta.setRangeText(text, start, end, 'select');
  // カーソルを中身の位置に
  ta.selectionStart = start + open.length;
  ta.selectionEnd = start + open.length + selected.length;
  updatePreview();
}

// 早見表からの挿入
function insertFromCS(latex) {
  const ta = contentInput;
  const start = ta.selectionStart;

  ta.focus();
  ta.setRangeText(latex, start, ta.selectionEnd, 'end');
  updatePreview();
  closeCheatsheet();
}

// ========================================
// モーダル制御
// ========================================

function openCheatsheet() {
  document.getElementById('cheatsheet-modal').classList.add('active');
}

function closeCheatsheet() {
  document.getElementById('cheatsheet-modal').classList.remove('active');
}

// Escape キーでモーダルを閉じる
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCheatsheet();
});

// オーバーレイクリックで閉じる
document.getElementById('cheatsheet-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeCheatsheet();
});

// 初期化
init();
