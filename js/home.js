// ========================================
// Home Page - Recent Articles
// ========================================

const DB_KEY = 'butugiri_articles';

const CATEGORIES = {
  mechanics: '力学',
  electromagnetism: '電磁気学',
  thermodynamics: '熱力学',
  quantum: '量子力学',
  relativity: '相対性理論',
  math: '数理物理'
};

const SAMPLE_ARTICLES = [
  {
    id: 'sample-1',
    title: 'ニュートンの運動方程式を読み解く',
    category: 'mechanics',
    content: 'F = ma の意味を丁寧に掘り下げる。力・質量・加速度の関係を数式と図で整理。',
    date: '2026-03-21T00:00:00Z'
  },
  {
    id: 'sample-2',
    title: 'マクスウェル方程式の全体像',
    category: 'electromagnetism',
    content: '4つの方程式が電磁気現象をどう記述するか、微分形と積分形を並べて解説。',
    date: '2026-03-20T00:00:00Z'
  }
];

function init() {
  renderRecentArticles();
}

function renderRecentArticles() {
  const container = document.getElementById('recent-articles-list');
  const articles = getArticles()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (articles.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary);">まだ記事がありません</p>';
    return;
  }

  const html = articles.map(article => {
    const categoryName = CATEGORIES[article.category] || article.category;
    const dateStr = new Date(article.date).toLocaleDateString('ja-JP');
    const excerpt = article.content.substring(0, 100);

    return `
      <article class="article-card">
        <span class="article-tag">${categoryName}</span>
        <h3><a href="articles.html" onclick="sessionStorage.setItem('viewArticleId', '${article.id}'); return true;">${escapeHtml(article.title)}</a></h3>
        <p>${escapeHtml(excerpt)}</p>
        <time>${dateStr}</time>
      </article>
    `;
  }).join('');

  container.innerHTML = html;
}

function getArticles() {
  const stored = localStorage.getItem(DB_KEY);
  const userArticles = stored ? JSON.parse(stored) : [];
  const ids = new Set(userArticles.map(a => a.id));
  const uniqueSamples = SAMPLE_ARTICLES.filter(a => !ids.has(a.id));
  return [...userArticles, ...uniqueSamples];
}

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

document.addEventListener('DOMContentLoaded', init);
