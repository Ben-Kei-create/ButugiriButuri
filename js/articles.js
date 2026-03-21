// ========================================
// Articles List Page
// ========================================

const DB_KEY = 'butugiri_articles';

const CATEGORIES = {
  mechanics: { name: '力学', id: 'mechanics' },
  electromagnetism: { name: '電磁気学', id: 'electromagnetism' },
  thermodynamics: { name: '熱力学', id: 'thermodynamics' },
  quantum: { name: '量子力学', id: 'quantum' },
  relativity: { name: '相対性理論', id: 'relativity' },
  math: { name: '数理物理', id: 'math' }
};

const SAMPLE_ARTICLES = [
  {
    id: 'sample-1',
    title: 'ニュートンの運動方程式を読み解く',
    category: 'mechanics',
    content: '## 運動方程式とは\n\nニュートンの第二法則は、力と運動の関係を定量的に記述する。\n\n$$\\vec{F} = m\\vec{a}$$',
    date: '2026-03-21T00:00:00Z'
  },
  {
    id: 'sample-2',
    title: 'マクスウェル方程式の全体像',
    category: 'electromagnetism',
    content: '## 4つの方程式\n\n電磁気学の全現象を4つの式で記述する。\n\n$$\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\varepsilon_0}$$',
    date: '2026-03-20T00:00:00Z'
  }
];

// 初期化
function init() {
  marked.setOptions({ breaks: true, gfm: true });
  renderArticles();
}

// 記事一覧をレンダリング
function renderArticles() {
  const articlesContainer = document.getElementById('articles-content');
  const articles = getArticles();

  // カテゴリごとに記事をグループ化
  const articlesByCategory = {};
  Object.keys(CATEGORIES).forEach(catKey => {
    articlesByCategory[catKey] = [];
  });

  articles.forEach(article => {
    if (articlesByCategory[article.category]) {
      articlesByCategory[article.category].push(article);
    }
  });

  // カテゴリ順で表示
  let html = '';
  Object.entries(CATEGORIES).forEach(([catKey, catInfo]) => {
    const categoryArticles = articlesByCategory[catKey]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    html += `<h2 id="${catKey}">${catInfo.name}</h2>`;
    html += '<div class="article-list">';

    if (categoryArticles.length === 0) {
      html += '<p class="empty-category">記事がありません</p>';
    } else {
      categoryArticles.forEach(article => {
        const excerpt = getExcerpt(article.content, 150);
        const dateStr = new Date(article.date).toLocaleDateString('ja-JP');
        html += `
          <article class="article-card">
            <span class="article-tag">${catInfo.name}</span>
            <h3><a href="#" onclick="viewArticle('${article.id}'); return false;">${escapeHtml(article.title)}</a></h3>
            <p>${excerpt}</p>
            <time>${dateStr}</time>
          </article>
        `;
      });
    }

    html += '</div>';
  });

  articlesContainer.innerHTML = html;
}

// 記事を取得（LocalStorage + サンプル）
function getArticles() {
  const stored = localStorage.getItem(DB_KEY);
  const userArticles = stored ? JSON.parse(stored) : [];

  // サンプル記事と合わせる（ユーザー記事が優先）
  const ids = new Set(userArticles.map(a => a.id));
  const uniqueSamples = SAMPLE_ARTICLES.filter(a => !ids.has(a.id));

  return [...userArticles, ...uniqueSamples];
}

// 記事を全画面表示
function viewArticle(id) {
  const articles = getArticles();
  const article = articles.find(a => a.id === id);

  if (!article) return;

  const categoryName = CATEGORIES[article.category]?.name || article.category;
  const dateStr = new Date(article.date).toLocaleDateString('ja-JP');

  const html = `
    <div style="max-width: 800px; margin: 0 auto;">
      <button onclick="history.back()" style="padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: 6px; background: var(--card-bg); color: var(--text); cursor: pointer; margin-bottom: 2rem;">← 戻る</button>

      <article class="article-header">
        <h1>${escapeHtml(article.title)}</h1>
        <div class="article-meta">
          <span>${categoryName}</span>
          <time>${dateStr}</time>
        </div>
      </article>

      <div class="article-body article-content" id="article-content">
        ${marked.parse(article.content)}
      </div>
    </div>
  `;

  // articles-content を全体置換
  const articlesContent = document.getElementById('articles-content');
  articlesContent.innerHTML = html;

  // KaTeX レンダリング
  if (typeof renderMathInElement === 'function') {
    try {
      renderMathInElement(document.getElementById('article-content'), {
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

  window.scrollTo(0, 0);
}

// 抜き出し取得
function getExcerpt(markdown, length) {
  // マークダウンをプレーンテキストに変換
  const text = markdown
    .replace(/^#+\s+/gm, '') // 見出し削除
    .replace(/\*\*(.+?)\*\*/g, '$1') // 太字削除
    .replace(/\*(.+?)\*/g, '$1') // イタリック削除
    .replace(/`+(.+?)`+/g, '$1') // コード削除
    .replace(/\$+.*?\$+/g, '') // 数式削除
    .replace(/\n\n+/g, ' ') // 改行を空白に
    .trim();

  return text.length > length ? text.substring(0, length) + '...' : text;
}

// HTML エスケープ
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

// ページロード時に実行
document.addEventListener('DOMContentLoaded', init);
