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
  // =============================================
  // 【高校1年】物理基礎
  // =============================================

  // ── 力学：運動の表し方 ──
  { keywords: ['速さ', '速度', '平均の速さ'], label: '速さの定義', latex: 'v = \\frac{\\Delta x}{\\Delta t}', category: '力学（物理基礎）' },
  { keywords: ['加速度', '速度変化'], label: '加速度の定義', latex: 'a = \\frac{\\Delta v}{\\Delta t} = \\frac{v - v_0}{t}', category: '力学（物理基礎）' },
  { keywords: ['等速直線運動', '等速運動'], label: '等速直線運動', latex: 'x = vt', category: '力学（物理基礎）' },
  { keywords: ['等加速度', 'v=v0+at', '速度の式'], label: '等加速度運動（速度）', latex: 'v = v_0 + at', category: '力学（物理基礎）' },
  { keywords: ['等加速度', '変位', 'x=v0t'], label: '等加速度運動（変位）', latex: 'x = v_0 t + \\frac{1}{2}at^2', category: '力学（物理基礎）' },
  { keywords: ['等加速度', 'v^2', '速度と変位'], label: '等加速度運動（v²の式）', latex: 'v^2 - v_0^2 = 2ax', category: '力学（物理基礎）' },
  { keywords: ['自由落下', '落下運動'], label: '自由落下（速度）', latex: 'v = gt', category: '力学（物理基礎）' },
  { keywords: ['自由落下', '落下距離'], label: '自由落下（変位）', latex: 'y = \\frac{1}{2}gt^2', category: '力学（物理基礎）' },
  { keywords: ['鉛直投げ下ろし', '投げ下ろし'], label: '鉛直投げ下ろし（速度）', latex: 'v = v_0 + gt', category: '力学（物理基礎）' },
  { keywords: ['鉛直投げ上げ', '投げ上げ'], label: '鉛直投げ上げ（速度）', latex: 'v = v_0 - gt', category: '力学（物理基礎）' },
  { keywords: ['鉛直投げ上げ', '投げ上げ', '高さ'], label: '鉛直投げ上げ（変位）', latex: 'y = v_0 t - \\frac{1}{2}gt^2', category: '力学（物理基礎）' },
  { keywords: ['最高点', '投げ上げ最高点'], label: '投げ上げの最高点', latex: 'H = \\frac{v_0^2}{2g}', category: '力学（物理基礎）' },

  // ── 力学：力 ──
  { keywords: ['重力', '重さ', '重力加速度'], label: '重力', latex: 'W = mg', category: '力学（物理基礎）' },
  { keywords: ['フック', 'ばね', '弾性力'], label: 'フックの法則', latex: 'F = kx', category: '力学（物理基礎）' },
  { keywords: ['摩擦力', '静止摩擦', '動摩擦'], label: '摩擦力', latex: 'f = \\mu N', category: '力学（物理基礎）' },
  { keywords: ['最大静止摩擦'], label: '最大静止摩擦力', latex: 'f_0 = \\mu_0 N', category: '力学（物理基礎）' },
  { keywords: ['力の合成', '合力'], label: '力の合成（なす角θ）', latex: 'F = \\sqrt{F_1^2 + F_2^2 + 2F_1 F_2 \\cos\\theta}', category: '力学（物理基礎）' },
  { keywords: ['力のつりあい', '力の平衡', '3力のつりあい'], label: '力のつりあい', latex: '\\sum \\vec{F} = \\vec{0}', category: '力学（物理基礎）' },
  { keywords: ['力の分解', '分力'], label: '力の分解（斜面）', latex: 'F_x = F\\cos\\theta,\\quad F_y = F\\sin\\theta', category: '力学（物理基礎）' },

  // ── 力学：運動の法則 ──
  { keywords: ['慣性の法則', '第一法則', '慣性'], label: '慣性の法則（第一法則）', latex: '\\vec{F} = \\vec{0} \\;\\Rightarrow\\; \\vec{v} = \\text{const.}', category: '力学（物理基礎）' },
  { keywords: ['運動方程式', 'ニュートン', '第二法則', 'F=ma'], label: '運動方程式（第二法則）', latex: 'F = ma', category: '力学（物理基礎）' },
  { keywords: ['作用反作用', '第三法則'], label: '作用反作用の法則（第三法則）', latex: '\\vec{F}_{12} = -\\vec{F}_{21}', category: '力学（物理基礎）' },

  // ── 力学：仕事とエネルギー ──
  { keywords: ['仕事', '仕事の定義'], label: '仕事', latex: 'W = Fs\\cos\\theta', category: '力学（物理基礎）' },
  { keywords: ['仕事率', '出力', 'パワー'], label: '仕事率', latex: 'P = \\frac{W}{t} = Fv', category: '力学（物理基礎）' },
  { keywords: ['運動エネルギー'], label: '運動エネルギー', latex: 'K = \\frac{1}{2}mv^2', category: '力学（物理基礎）' },
  { keywords: ['仕事と運動エネルギー', '仕事運動エネルギーの定理'], label: '仕事と運動エネルギーの関係', latex: 'W = \\frac{1}{2}mv^2 - \\frac{1}{2}mv_0^2', category: '力学（物理基礎）' },
  { keywords: ['位置エネルギー', '重力の位置エネルギー', 'ポテンシャル'], label: '重力による位置エネルギー', latex: 'U = mgh', category: '力学（物理基礎）' },
  { keywords: ['弾性エネルギー', 'ばねの位置エネルギー', '弾性力の位置エネルギー'], label: '弾性力による位置エネルギー', latex: 'U = \\frac{1}{2}kx^2', category: '力学（物理基礎）' },
  { keywords: ['力学的エネルギー保存', 'エネルギー保存則'], label: '力学的エネルギー保存則', latex: '\\frac{1}{2}mv_1^2 + mgh_1 = \\frac{1}{2}mv_2^2 + mgh_2', category: '力学（物理基礎）' },

  // ── 熱（物理基礎） ──
  { keywords: ['セルシウス', '絶対温度', 'ケルビン'], label: '絶対温度', latex: 'T\\,[\\mathrm{K}] = t\\,[^{\\circ}\\mathrm{C}] + 273', category: '熱（物理基礎）' },
  { keywords: ['熱量', '比熱', 'mcΔT'], label: '熱量', latex: 'Q = mc\\Delta T', category: '熱（物理基礎）' },
  { keywords: ['熱容量'], label: '熱容量', latex: 'C = mc', category: '熱（物理基礎）' },
  { keywords: ['熱量の保存', '熱平衡'], label: '熱量の保存', latex: 'Q_{\\text{高温}} + Q_{\\text{低温}} = 0', category: '熱（物理基礎）' },
  { keywords: ['熱力学第一法則', '内部エネルギー'], label: '熱力学第一法則', latex: '\\Delta U = Q + W', category: '熱（物理基礎）' },
  { keywords: ['熱効率'], label: '熱効率', latex: 'e = \\frac{W}{Q_{\\text{in}}} = \\frac{Q_{\\text{in}} - Q_{\\text{out}}}{Q_{\\text{in}}}', category: '熱（物理基礎）' },

  // ── 波動（物理基礎） ──
  { keywords: ['波', '波の基本式', 'v=fλ', '波長', '振動数'], label: '波の基本式', latex: 'v = f\\lambda', category: '波動（物理基礎）' },
  { keywords: ['周期', '振動数', '周波数'], label: '周期と振動数', latex: 'T = \\frac{1}{f}', category: '波動（物理基礎）' },
  { keywords: ['横波', '正弦波', '波の式'], label: '正弦波の式', latex: 'y = A\\sin 2\\pi\\left(\\frac{t}{T} - \\frac{x}{\\lambda}\\right)', category: '波動（物理基礎）' },
  { keywords: ['反射の法則', '入射角', '反射角'], label: '反射の法則', latex: '\\theta_i = \\theta_r', category: '波動（物理基礎）' },
  { keywords: ['屈折の法則', 'スネル', '屈折率'], label: '屈折の法則（スネルの法則）', latex: 'n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2', category: '波動（物理基礎）' },
  { keywords: ['屈折率', '光速'], label: '屈折率と光速', latex: 'n = \\frac{c}{v}', category: '波動（物理基礎）' },
  { keywords: ['全反射', '臨界角'], label: '全反射の臨界角', latex: '\\sin\\theta_c = \\frac{n_2}{n_1}', category: '波動（物理基礎）' },
  { keywords: ['音速', '音の速さ', '気温と音速'], label: '音速（気温依存）', latex: 'V = 331.5 + 0.6\\,t\\;[\\mathrm{m/s}]', category: '波動（物理基礎）' },
  { keywords: ['うなり', 'ビート'], label: 'うなりの振動数', latex: 'f_{\\text{beat}} = |f_1 - f_2|', category: '波動（物理基礎）' },
  { keywords: ['弦の固有振動', '弦の振動', '基本振動'], label: '弦の固有振動数', latex: 'f_n = \\frac{n}{2L}\\sqrt{\\frac{S}{\\rho}}', category: '波動（物理基礎）' },
  { keywords: ['気柱', '開管', '共鳴'], label: '開管の固有振動数', latex: 'f_n = \\frac{nV}{2L}\\quad(n=1,2,3,\\ldots)', category: '波動（物理基礎）' },
  { keywords: ['気柱', '閉管', '共鳴'], label: '閉管の固有振動数', latex: 'f_n = \\frac{nV}{4L}\\quad(n=1,3,5,\\ldots)', category: '波動（物理基礎）' },

  // ── 電気（物理基礎） ──
  { keywords: ['電流', '電荷', '電気量'], label: '電流の定義', latex: 'I = \\frac{Q}{t}', category: '電気（物理基礎）' },
  { keywords: ['オーム', 'V=RI', '電圧', '電気抵抗'], label: 'オームの法則', latex: 'V = RI', category: '電気（物理基礎）' },
  { keywords: ['抵抗率', '電気抵抗', '断面積'], label: '抵抗と抵抗率', latex: 'R = \\rho \\frac{L}{S}', category: '電気（物理基礎）' },
  { keywords: ['直列', '直列接続', '合成抵抗'], label: '直列合成抵抗', latex: 'R = R_1 + R_2 + R_3 + \\cdots', category: '電気（物理基礎）' },
  { keywords: ['並列', '並列接続', '合成抵抗'], label: '並列合成抵抗', latex: '\\frac{1}{R} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3} + \\cdots', category: '電気（物理基礎）' },
  { keywords: ['電力', '消費電力'], label: '電力', latex: 'P = VI = I^2 R = \\frac{V^2}{R}', category: '電気（物理基礎）' },
  { keywords: ['ジュール熱', '発熱量'], label: 'ジュール熱', latex: 'Q = VIt = I^2 Rt', category: '電気（物理基礎）' },
  { keywords: ['電力量', '電気エネルギー'], label: '電力量', latex: 'W = Pt = VIt', category: '電気（物理基礎）' },
  { keywords: ['キルヒホッフ', '電流則', '第一法則'], label: 'キルヒホッフの電流則', latex: '\\sum I_{\\text{in}} = \\sum I_{\\text{out}}', category: '電気（物理基礎）' },
  { keywords: ['キルヒホッフ', '電圧則', '第二法則'], label: 'キルヒホッフの電圧則', latex: '\\sum V = 0 \\quad(\\text{閉回路})', category: '電気（物理基礎）' },

  // ── エネルギーの利用（物理基礎） ──
  { keywords: ['エネルギー変換', '変換効率'], label: 'エネルギー変換効率', latex: '\\eta = \\frac{E_{\\text{out}}}{E_{\\text{in}}} \\times 100\\;[\\%]', category: 'エネルギー（物理基礎）' },

  // =============================================
  // 【高校2〜3年】物理（発展）＋ 大学物理
  // =============================================

  // ── 力学（発展） ──
  { keywords: ['運動方程式', 'ニュートン', 'F=ma'], label: 'ニュートンの運動方程式（ベクトル）', latex: '\\vec{F} = m\\vec{a}', category: '力学' },
  { keywords: ['万有引力', '重力'], label: '万有引力の法則', latex: 'F = G\\frac{m_1 m_2}{r^2}', category: '力学' },
  { keywords: ['角運動量'], label: '角運動量', latex: '\\vec{L} = \\vec{r} \\times \\vec{p}', category: '力学' },
  { keywords: ['ラグランジアン', 'ラグランジュ'], label: 'ラグランジアン', latex: 'L = T - V', category: '力学' },
  { keywords: ['オイラー', 'ラグランジュ方程式', 'EL方程式'], label: 'オイラー-ラグランジュ方程式', latex: '\\frac{d}{dt}\\frac{\\partial L}{\\partial \\dot{q}} - \\frac{\\partial L}{\\partial q} = 0', category: '力学' },
  { keywords: ['ハミルトニアン', 'ハミルトン'], label: 'ハミルトニアン', latex: 'H = \\sum_i p_i \\dot{q}_i - L', category: '力学' },
  { keywords: ['振動', '単振動', '調和振動'], label: '単振動の方程式', latex: 'x(t) = A\\cos(\\omega t + \\phi)', category: '力学' },
  { keywords: ['角速度', '角振動数'], label: '角振動数', latex: '\\omega = 2\\pi f = \\frac{2\\pi}{T}', category: '力学' },

  // ── 電磁気学（発展） ──
  { keywords: ['ガウスの法則', '電場の発散'], label: 'ガウスの法則', latex: '\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\varepsilon_0}', category: '電磁気学' },
  { keywords: ['アンペール', 'マクスウェル'], label: 'アンペール-マクスウェルの法則', latex: '\\nabla \\times \\vec{B} = \\mu_0 \\vec{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\vec{E}}{\\partial t}', category: '電磁気学' },
  { keywords: ['ファラデー', '電磁誘導'], label: 'ファラデーの法則', latex: '\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}', category: '電磁気学' },
  { keywords: ['クーロン', '電荷'], label: 'クーロンの法則', latex: 'F = \\frac{1}{4\\pi\\varepsilon_0}\\frac{q_1 q_2}{r^2}', category: '電磁気学' },
  { keywords: ['ローレンツ力', 'ローレンツ'], label: 'ローレンツ力', latex: '\\vec{F} = q(\\vec{E} + \\vec{v} \\times \\vec{B})', category: '電磁気学' },
  { keywords: ['波動方程式', '電磁波'], label: '電磁波の波動方程式', latex: '\\nabla^2 \\vec{E} = \\mu_0 \\varepsilon_0 \\frac{\\partial^2 \\vec{E}}{\\partial t^2}', category: '電磁気学' },
  { keywords: ['磁場の発散', '磁気単極子'], label: '磁場のガウスの法則', latex: '\\nabla \\cdot \\vec{B} = 0', category: '電磁気学' },

  // ── 熱力学（発展） ──
  { keywords: ['エントロピー', 'ボルツマン'], label: 'ボルツマンの関係式', latex: 'S = k_B \\ln \\Omega', category: '熱力学' },
  { keywords: ['理想気体', '状態方程式', 'PV=nRT'], label: '理想気体の状態方程式', latex: 'PV = nRT', category: '熱力学' },
  { keywords: ['自由エネルギー', 'ヘルムホルツ'], label: 'ヘルムホルツ自由エネルギー', latex: 'F = U - TS', category: '熱力学' },
  { keywords: ['分配関数', 'パーティション'], label: '分配関数', latex: 'Z = \\sum_i e^{-\\beta E_i}', category: '熱力学' },
  { keywords: ['カルノー', 'カルノー効率'], label: 'カルノー効率', latex: '\\eta = 1 - \\frac{T_L}{T_H}', category: '熱力学' },

  // ── 量子力学 ──
  { keywords: ['シュレーディンガー', '波動関数'], label: 'シュレーディンガー方程式', latex: 'i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi', category: '量子力学' },
  { keywords: ['不確定性', 'ハイゼンベルク'], label: '不確定性原理', latex: '\\Delta x \\Delta p \\geq \\frac{\\hbar}{2}', category: '量子力学' },
  { keywords: ['光子', 'プランク', 'エネルギー量子'], label: '光子のエネルギー', latex: 'E = h\\nu = \\hbar\\omega', category: '量子力学' },
  { keywords: ['ド・ブロイ', '物質波'], label: 'ド・ブロイ波長', latex: '\\lambda = \\frac{h}{p}', category: '量子力学' },
  { keywords: ['交換関係', '正準交換'], label: '正準交換関係', latex: '[\\hat{x}, \\hat{p}] = i\\hbar', category: '量子力学' },
  { keywords: ['固有値', '固有状態'], label: '固有値方程式', latex: '\\hat{H}|\\psi\\rangle = E|\\psi\\rangle', category: '量子力学' },
  { keywords: ['期待値'], label: '期待値', latex: '\\langle A \\rangle = \\langle \\psi | \\hat{A} | \\psi \\rangle', category: '量子力学' },

  // ── 相対性理論 ──
  { keywords: ['質量エネルギー', 'E=mc'], label: '質量エネルギー等価', latex: 'E = mc^2', category: '相対性理論' },
  { keywords: ['ローレンツ変換', 'ローレンツ因子', 'γ'], label: 'ローレンツ因子', latex: '\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}', category: '相対性理論' },
  { keywords: ['ミンコフスキー', '計量', '線素'], label: 'ミンコフスキー計量', latex: 'ds^2 = -c^2 dt^2 + dx^2 + dy^2 + dz^2', category: '相対性理論' },
  { keywords: ['アインシュタイン方程式', '場の方程式', 'リッチ'], label: 'アインシュタイン方程式', latex: 'R_{\\mu\\nu} - \\frac{1}{2}Rg_{\\mu\\nu} = \\frac{8\\pi G}{c^4}T_{\\mu\\nu}', category: '相対性理論' },
  { keywords: ['時間の遅れ', '固有時間'], label: '時間の遅れ', latex: '\\Delta t = \\gamma \\Delta t_0', category: '相対性理論' },

  // ── 数学 ──
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
