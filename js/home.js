// ========================================
// Home Page - Recent Units
// ========================================

function init() {
  renderRecentUnits();
}

function renderRecentUnits() {
  const container = document.getElementById('recent-articles-list');
  const units = getUnits()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (units.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary);">まだ単元がありません</p>';
    return;
  }

  const html = units.map(unit => {
    const categoryName = CATEGORIES[unit.category]?.name || unit.category;
    const dateStr = new Date(unit.date).toLocaleDateString('ja-JP');
    const excerpt = getExcerpt(unit.content, 100);
    const subtitle = `${unit.chapter} / ${categoryName}`;

    return `
      <article class="article-card">
        <span class="article-tag">${categoryName}</span>
        <h3><a href="${buildUnitHref(unit.id)}">${escapeHtml(unit.title)}</a></h3>
        <p>${escapeHtml(excerpt)}</p>
        <p style="font-size: 0.8rem; margin-bottom: 0.35rem;">${escapeHtml(subtitle)}</p>
        <time>${dateStr}</time>
      </article>
    `;
  }).join('');

  container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', init);
