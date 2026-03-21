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

// Escape キーでモーダル/サジェストを閉じる
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCheatsheet();
    closeSuggest();
  }
});

// オーバーレイクリックで閉じる
document.getElementById('cheatsheet-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeCheatsheet();
});

// ========================================
// 数式サジェスト（キーワード検知）
// ========================================

const KEYWORD_FORMULAS = [
  // 力学
  { keywords: ['運動方程式', 'ニュートン', '第二法則', 'F=ma'], label: 'ニュートンの運動方程式', latex: '\\vec{F} = m\\vec{a}', category: '力学' },
  { keywords: ['万有引力', '重力'], label: '万有引力の法則', latex: 'F = G\\frac{m_1 m_2}{r^2}', category: '力学' },
  { keywords: ['運動エネルギー', '運動量'], label: '運動エネルギー', latex: 'K = \\frac{1}{2}mv^2', category: '力学' },
  { keywords: ['位置エネルギー', 'ポテンシャル'], label: '重力ポテンシャルエネルギー', latex: 'U = mgh', category: '力学' },
  { keywords: ['角運動量'], label: '角運動量', latex: '\\vec{L} = \\vec{r} \\times \\vec{p}', category: '力学' },
  { keywords: ['ラグランジアン', 'ラグランジュ'], label: 'ラグランジアン', latex: 'L = T - V', category: '力学' },
  { keywords: ['オイラー', 'ラグランジュ方程式', 'EL方程式'], label: 'オイラー-ラグランジュ方程式', latex: '\\frac{d}{dt}\\frac{\\partial L}{\\partial \\dot{q}} - \\frac{\\partial L}{\\partial q} = 0', category: '力学' },
  { keywords: ['ハミルトニアン', 'ハミルトン'], label: 'ハミルトニアン', latex: 'H = \\sum_i p_i \\dot{q}_i - L', category: '力学' },
  { keywords: ['振動', '単振動', '調和振動'], label: '単振動の方程式', latex: 'x(t) = A\\cos(\\omega t + \\phi)', category: '力学' },
  { keywords: ['角速度', '角振動数'], label: '角振動数', latex: '\\omega = 2\\pi f = \\frac{2\\pi}{T}', category: '力学' },

  // 電磁気
  { keywords: ['ガウスの法則', '電場の発散'], label: 'ガウスの法則', latex: '\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\varepsilon_0}', category: '電磁気学' },
  { keywords: ['アンペール', 'マクスウェル'], label: 'アンペール-マクスウェルの法則', latex: '\\nabla \\times \\vec{B} = \\mu_0 \\vec{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\vec{E}}{\\partial t}', category: '電磁気学' },
  { keywords: ['ファラデー', '電磁誘導'], label: 'ファラデーの法則', latex: '\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}', category: '電磁気学' },
  { keywords: ['クーロン', '電荷'], label: 'クーロンの法則', latex: 'F = \\frac{1}{4\\pi\\varepsilon_0}\\frac{q_1 q_2}{r^2}', category: '電磁気学' },
  { keywords: ['ローレンツ力', 'ローレンツ'], label: 'ローレンツ力', latex: '\\vec{F} = q(\\vec{E} + \\vec{v} \\times \\vec{B})', category: '電磁気学' },
  { keywords: ['波動方程式', '電磁波'], label: '電磁波の波動方程式', latex: '\\nabla^2 \\vec{E} = \\mu_0 \\varepsilon_0 \\frac{\\partial^2 \\vec{E}}{\\partial t^2}', category: '電磁気学' },
  { keywords: ['磁場の発散', '磁気単極子'], label: '磁場のガウスの法則', latex: '\\nabla \\cdot \\vec{B} = 0', category: '電磁気学' },

  // 熱力学
  { keywords: ['エントロピー', 'ボルツマン'], label: 'ボルツマンの関係式', latex: 'S = k_B \\ln \\Omega', category: '熱力学' },
  { keywords: ['熱力学第一法則', '内部エネルギー'], label: '熱力学第一法則', latex: 'dU = \\delta Q - \\delta W', category: '熱力学' },
  { keywords: ['理想気体', '状態方程式', 'PV=nRT'], label: '理想気体の状態方程式', latex: 'PV = nRT', category: '熱力学' },
  { keywords: ['自由エネルギー', 'ヘルムホルツ'], label: 'ヘルムホルツ自由エネルギー', latex: 'F = U - TS', category: '熱力学' },
  { keywords: ['分配関数', 'パーティション'], label: '分配関数', latex: 'Z = \\sum_i e^{-\\beta E_i}', category: '熱力学' },
  { keywords: ['カルノー', '効率'], label: 'カルノー効率', latex: '\\eta = 1 - \\frac{T_L}{T_H}', category: '熱力学' },

  // 量子力学
  { keywords: ['シュレーディンガー', '波動関数'], label: 'シュレーディンガー方程式', latex: 'i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi', category: '量子力学' },
  { keywords: ['不確定性', 'ハイゼンベルク'], label: '不確定性原理', latex: '\\Delta x \\Delta p \\geq \\frac{\\hbar}{2}', category: '量子力学' },
  { keywords: ['光子', 'プランク', 'エネルギー量子'], label: '光子のエネルギー', latex: 'E = h\\nu = \\hbar\\omega', category: '量子力学' },
  { keywords: ['ド・ブロイ', '物質波'], label: 'ド・ブロイ波長', latex: '\\lambda = \\frac{h}{p}', category: '量子力学' },
  { keywords: ['交換関係', '正準交換'], label: '正準交換関係', latex: '[\\hat{x}, \\hat{p}] = i\\hbar', category: '量子力学' },
  { keywords: ['固有値', '固有状態'], label: '固有値方程式', latex: '\\hat{H}|\\psi\\rangle = E|\\psi\\rangle', category: '量子力学' },
  { keywords: ['期待値'], label: '期待値', latex: '\\langle A \\rangle = \\langle \\psi | \\hat{A} | \\psi \\rangle', category: '量子力学' },

  // 相対性理論
  { keywords: ['質量エネルギー', 'E=mc'], label: '質量エネルギー等価', latex: 'E = mc^2', category: '相対性理論' },
  { keywords: ['ローレンツ変換', 'ローレンツ因子', 'γ'], label: 'ローレンツ因子', latex: '\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}', category: '相対性理論' },
  { keywords: ['ミンコフスキー', '計量', '線素'], label: 'ミンコフスキー計量', latex: 'ds^2 = -c^2 dt^2 + dx^2 + dy^2 + dz^2', category: '相対性理論' },
  { keywords: ['アインシュタイン方程式', '場の方程式', 'リッチ'], label: 'アインシュタイン方程式', latex: 'R_{\\mu\\nu} - \\frac{1}{2}Rg_{\\mu\\nu} = \\frac{8\\pi G}{c^4}T_{\\mu\\nu}', category: '相対性理論' },
  { keywords: ['時間の遅れ', '固有時間'], label: '時間の遅れ', latex: '\\Delta t = \\gamma \\Delta t_0', category: '相対性理論' },

  // 数学
  { keywords: ['テイラー展開', 'テイラー級数', 'マクローリン'], label: 'テイラー展開', latex: 'f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n', category: '数学' },
  { keywords: ['フーリエ変換', 'フーリエ'], label: 'フーリエ変換', latex: '\\hat{f}(\\omega) = \\int_{-\\infty}^{\\infty} f(t)e^{-i\\omega t}\\,dt', category: '数学' },
  { keywords: ['ガウス積分'], label: 'ガウス積分', latex: '\\int_{-\\infty}^{\\infty} e^{-ax^2}\\,dx = \\sqrt{\\frac{\\pi}{a}}', category: '数学' },
  { keywords: ['オイラーの公式', 'e^iθ'], label: 'オイラーの公式', latex: 'e^{i\\theta} = \\cos\\theta + i\\sin\\theta', category: '数学' },
  { keywords: ['デルタ関数', 'ディラック'], label: 'ディラックのデルタ関数', latex: '\\int_{-\\infty}^{\\infty} f(x)\\delta(x-a)\\,dx = f(a)', category: '数学' },
];

const suggestPopup = document.getElementById('suggest-popup');
let suggestItems = [];
let suggestSelectedIndex = -1;
let suggestDebounceTimer = null;

// テキスト入力時にキーワードサジェストを自動表示
contentInput.addEventListener('input', () => {
  clearTimeout(suggestDebounceTimer);
  suggestDebounceTimer = setTimeout(() => {
    autoSuggestFromKeywords();
  }, 300);
});

// キーボードナビゲーション
contentInput.addEventListener('keydown', (e) => {
  if (!suggestPopup.classList.contains('active')) {
    // Ctrl+Space でAI推測
    if (e.key === ' ' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      triggerAISuggest();
    }
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    suggestSelectedIndex = Math.min(suggestSelectedIndex + 1, suggestItems.length - 1);
    renderSuggestSelection();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    suggestSelectedIndex = Math.max(suggestSelectedIndex - 1, 0);
    renderSuggestSelection();
  } else if (e.key === 'Enter' && suggestSelectedIndex >= 0) {
    e.preventDefault();
    applySuggestion(suggestItems[suggestSelectedIndex]);
  } else if (e.key === 'Tab' && suggestItems.length > 0) {
    e.preventDefault();
    if (suggestSelectedIndex < 0) suggestSelectedIndex = 0;
    applySuggestion(suggestItems[suggestSelectedIndex]);
  } else if (e.key === 'Escape') {
    closeSuggest();
  }
});

// 現在のカーソル行からキーワードを検出してサジェスト表示
function autoSuggestFromKeywords() {
  const text = contentInput.value;
  const cursorPos = contentInput.selectionStart;

  // カーソル行を取得
  const lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
  const lineEnd = text.indexOf('\n', cursorPos);
  const currentLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);

  if (currentLine.trim().length < 2) {
    closeSuggest();
    return;
  }

  // 数式の中（$ の中）ではキーワードサジェストを抑制
  const beforeCursor = text.substring(0, cursorPos);
  const dollarCount = (beforeCursor.match(/\$/g) || []).length;
  if (dollarCount % 2 === 1) {
    closeSuggest();
    return;
  }

  // キーワードマッチ
  const matches = KEYWORD_FORMULAS.filter(item =>
    item.keywords.some(kw => currentLine.includes(kw))
  );

  if (matches.length === 0) {
    closeSuggest();
    return;
  }

  showSuggest(matches, 'キーワード検知');
}

// サジェストポップアップ表示
function showSuggest(items, source) {
  suggestItems = items;
  suggestSelectedIndex = -1;

  let html = `<div class="suggest-header"><span>数式サジェスト</span><span class="suggest-badge">${source}</span></div>`;

  items.forEach((item, i) => {
    html += `<div class="suggest-item" data-index="${i}" onclick="applySuggestion(suggestItems[${i}])">
      <span class="suggest-label">${item.label}</span>
      <span class="suggest-latex">${escapeHtml(item.latex)}</span>
    </div>`;
  });

  html += '<div style="padding: 0.3rem 0.7rem; font-size: 0.65rem; color: var(--text-secondary);">Tab/Enter で挿入 ・ ↑↓ で選択</div>';

  suggestPopup.innerHTML = html;
  suggestPopup.classList.add('active');

  // ポップアップ位置を調整（テキストエリア内のカーソル付近）
  positionSuggestPopup();
}

function positionSuggestPopup() {
  // テキストエリアの下に表示
  suggestPopup.style.top = 'auto';
  suggestPopup.style.bottom = '0';
  suggestPopup.style.left = '0';
}

function renderSuggestSelection() {
  const items = suggestPopup.querySelectorAll('.suggest-item');
  items.forEach((el, i) => {
    el.classList.toggle('selected', i === suggestSelectedIndex);
  });
  // 選択中アイテムを表示領域にスクロール
  if (suggestSelectedIndex >= 0 && items[suggestSelectedIndex]) {
    items[suggestSelectedIndex].scrollIntoView({ block: 'nearest' });
  }
}

function applySuggestion(item) {
  const ta = contentInput;
  const pos = ta.selectionStart;
  const latex = `$${item.latex}$`;

  // カーソル位置の前がスペースや行頭でなければスペースを入れる
  const charBefore = pos > 0 ? ta.value[pos - 1] : '\n';
  const prefix = (charBefore !== ' ' && charBefore !== '\n') ? ' ' : '';

  ta.focus();
  ta.setRangeText(prefix + latex, pos, ta.selectionEnd, 'end');
  updatePreview();
  closeSuggest();
}

function closeSuggest() {
  suggestPopup.classList.remove('active');
  suggestItems = [];
  suggestSelectedIndex = -1;
}

// テキストエリア外クリックでサジェストを閉じる
document.addEventListener('click', (e) => {
  if (!suggestPopup.contains(e.target) && e.target !== contentInput) {
    closeSuggest();
  }
});

// ========================================
// Gemini API 連携（AI数式推測）
// ========================================

const GEMINI_KEY_STORAGE = 'butugiri_gemini_key';

function saveGeminiKey() {
  const key = document.getElementById('gemini-key').value.trim();
  if (key) {
    localStorage.setItem(GEMINI_KEY_STORAGE, key);
    updateAIStatus();
  } else {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
    updateAIStatus();
  }
}

function updateAIStatus() {
  const statusEl = document.getElementById('ai-status');
  const key = localStorage.getItem(GEMINI_KEY_STORAGE);
  if (key) {
    statusEl.textContent = '接続済み';
    statusEl.className = 'ai-status connected';
    document.getElementById('gemini-key').value = key.substring(0, 6) + '...' + key.substring(key.length - 4);
  } else {
    statusEl.textContent = '未設定（キーワード検知のみ）';
    statusEl.className = 'ai-status disconnected';
  }
}

async function triggerAISuggest() {
  const key = localStorage.getItem(GEMINI_KEY_STORAGE);
  const text = contentInput.value;
  const cursorPos = contentInput.selectionStart;

  // カーソル付近のコンテキストを取得（前後500文字）
  const contextStart = Math.max(0, cursorPos - 500);
  const contextEnd = Math.min(text.length, cursorPos + 200);
  const context = text.substring(contextStart, contextEnd);
  const cursorMarker = cursorPos - contextStart;

  if (!context.trim()) return;

  // キーがない場合はキーワードサジェストのみ
  if (!key) {
    autoSuggestFromKeywords();
    // キーワードで見つからなかった場合、キー設定を促す
    if (!suggestPopup.classList.contains('active')) {
      showSuggest([{
        label: '💡 Gemini APIキーを設定するとAI推測が使えます',
        latex: '↑ AI設定を開いてください',
        noInsert: true
      }], 'ヒント');
    }
    return;
  }

  // ローディング表示
  suggestPopup.innerHTML = `<div class="suggest-header"><span>数式サジェスト</span><span class="suggest-badge">AI推測中</span></div>
    <div class="suggest-ai-loading">Gemini が文脈を分析中<span class="dots"></span></div>`;
  suggestPopup.classList.add('active');
  positionSuggestPopup();

  try {
    const beforeCursor = context.substring(0, cursorMarker);
    const afterCursor = context.substring(cursorMarker);

    const prompt = `あなたは物理学の数式アシスタントです。
以下のマークダウン文章のカーソル位置（[CURSOR]）に入るべき数式をLaTeX形式で推測してください。

文脈:
"""
${beforeCursor}[CURSOR]${afterCursor}
"""

以下のJSON形式で最大5つの候補を返してください。他のテキストは不要です:
[{"label": "数式の日本語名", "latex": "LaTeX数式（$は不要）"}]`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // JSONを抽出
    const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const suggestions = JSON.parse(jsonMatch[0]);

    if (suggestions.length === 0) {
      suggestPopup.innerHTML = `<div class="suggest-header"><span>数式サジェスト</span><span class="suggest-badge">AI推測</span></div>
        <div class="suggest-ai-loading">該当する数式が見つかりませんでした</div>`;
      setTimeout(closeSuggest, 2000);
      return;
    }

    showSuggest(suggestions, 'AI推測');

  } catch (err) {
    console.error('Gemini API error:', err);
    suggestPopup.innerHTML = `<div class="suggest-header"><span>エラー</span></div>
      <div class="suggest-ai-loading" style="color: #f87171;">推測に失敗しました: ${escapeHtml(err.message)}</div>`;
    setTimeout(closeSuggest, 3000);
  }
}

// 初期化時にGemini APIキーの状態を反映
updateAIStatus();

// 初期化
init();
