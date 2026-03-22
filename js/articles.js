// ========================================
// Units Index + Textbook Reader
// ========================================

const AUTHOR_KEY = 'butugiri_comment_author';
const COMMENTS_API_URL = '/api/comments';

let currentUnit = null;
let currentSections = [];
let activeSectionId = null;
let sectionObserver = null;
let commentsMode = 'loading';
let sharedCommentsBySection = {};
let isSubmittingComment = false;

function init() {
  marked.setOptions({ breaks: true, gfm: true });

  const requestedUnitId = new URLSearchParams(window.location.search).get('unit');
  if (requestedUnitId) {
    void renderUnitView(requestedUnitId);
    return;
  }

  renderUnitsIndex();
  scrollToHashTarget();
}

function renderUnitsIndex() {
  const page = document.querySelector('.articles-index');
  const unitsContainer = document.getElementById('articles-content');
  const grouped = groupUnitsByCategoryAndChapter(getUnits());

  page.classList.remove('is-reading');
  document.title = '単元一覧 — ButugiriButuri';

  unitsContainer.innerHTML = grouped.map(category => {
    if (category.chapters.length === 0) {
      return `
        <section class="curriculum-category">
          <div class="curriculum-category-head">
            <h2 id="${category.key}">${category.label}</h2>
            <p>まだ教科書の章立てがありません。</p>
          </div>
          <p class="empty-category">単元がありません</p>
        </section>
      `;
    }

    return `
      <section class="curriculum-category">
        <div class="curriculum-category-head">
          <h2 id="${category.key}">${category.label}</h2>
          <p>${category.chapters.length}章 / ${category.chapters.reduce((sum, chapter) => sum + chapter.units.length, 0)}単元</p>
        </div>

        ${category.chapters.map(chapter => `
          <div class="chapter-block">
            <div class="chapter-heading">
              <h3>${escapeHtml(chapter.name)}</h3>
              <span>${chapter.units.length}単元</span>
            </div>

            <div class="chapter-unit-list">
              ${chapter.units.map(unit => `
                <article class="chapter-unit-item">
                  <div class="chapter-unit-order">${String(unit.order).padStart(2, '0')}</div>
                  <div class="chapter-unit-body">
                    <h4><a href="${buildUnitHref(unit.id)}">${escapeHtml(unit.title)}</a></h4>
                    <p>${escapeHtml(getExcerpt(unit.content, 160))}</p>
                    <div class="chapter-unit-meta">
                      <span>${splitIntoSections(unit.content).length}節構成</span>
                      <span>${new Date(unit.date).toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                </article>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </section>
    `;
  }).join('');

  window.initMotionSystem?.(unitsContainer);
}

function scrollToHashTarget() {
  const hash = window.location.hash.replace('#', '');
  if (!hash) return;

  const target = document.getElementById(hash);
  if (!target) return;

  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

async function renderUnitView(unitId) {
  const page = document.querySelector('.articles-index');
  const unitsContainer = document.getElementById('articles-content');
  const units = getUnits();
  const unit = units.find(entry => entry.id === unitId);

  page.classList.add('is-reading');

  if (!unit) {
    unitsContainer.innerHTML = `
      <div class="reader-empty-state">
        <h2>単元が見つかりません</h2>
        <p>リンク先の単元がまだ作成されていないか、ID が変わっています。</p>
        <a class="textbook-back-link" href="articles.html">← 単元一覧へ戻る</a>
      </div>
    `;
    document.title = '単元が見つかりません — ButugiriButuri';
    return;
  }

  currentUnit = unit;
  currentSections = splitIntoSections(unit.content);
  activeSectionId = currentSections[0]?.id || null;
  commentsMode = 'loading';
  sharedCommentsBySection = {};

  const categoryName = getCategoryName(unit.category);
  const dateStr = new Date(unit.date).toLocaleDateString('ja-JP');

  unitsContainer.innerHTML = `
    <div class="textbook-view">
      <div class="textbook-topbar">
        <a class="textbook-back-link" href="articles.html#${unit.category}">← 単元一覧へ戻る</a>
        <p class="textbook-topbar-note">本文を左、補足ノートを右に積み上げる教科書ビューです。</p>
      </div>

      <div class="textbook-layout">
        <article class="textbook-main" id="textbook-main">
          <header class="article-header textbook-header">
            <p class="textbook-kicker">${escapeHtml(categoryName)}</p>
            <p class="textbook-chapter">${escapeHtml(unit.chapter)}</p>
            <h1>${escapeHtml(unit.title)}</h1>
            <div class="article-meta">
              <span>単元 ${String(unit.order).padStart(2, '0')}</span>
              <span>${escapeHtml(categoryName)}</span>
              <time>${dateStr}</time>
            </div>
          </header>

          ${renderSections(currentSections, units)}

          <div class="textbook-endcap">
            ${renderSequenceNav(unit, units)}
            ${renderRelatedUnits(unit, units)}
          </div>
        </article>

        <aside class="textbook-sidebar">
          <div class="sidebar-card">
            <div class="sidebar-eyebrow">補足ノート</div>
            <h2 class="sidebar-title" id="sidebar-section-title">${escapeHtml(currentSections[0]?.title || '本文')}</h2>
            <p class="sidebar-copy">疑問、言い換え、別解釈、つまずきやすい点をこの欄に残せます。</p>
            <div class="section-tabs" id="section-tabs">
              ${renderSectionTabs(unit.id, currentSections)}
            </div>
          </div>

          <div class="sidebar-card">
            <div class="sidebar-meta-line">
              <span id="sidebar-comment-count">読み込み中...</span>
              <span id="comment-storage-pill" class="comment-storage-pill is-loading">接続中</span>
            </div>
            <div class="comment-thread" id="comment-thread"></div>
          </div>

          <div class="sidebar-card">
            <form class="comment-form" id="comment-form">
              <label for="comment-author">名前</label>
              <input type="text" id="comment-author" maxlength="32" placeholder="匿名でもOK">

              <label for="comment-body">補足コメント</label>
              <textarea id="comment-body" rows="6" maxlength="2000" placeholder="この節の補足や別の見方、つまずきやすい点を書けます。Markdown と数式も使えます。"></textarea>

              <button type="submit" class="comment-submit" id="comment-submit-button">この節に補足を残す</button>
            </form>

            <p class="comment-local-note" id="comment-storage-note">共有ノートに接続しています...</p>
            <p class="comment-submit-status" id="comment-submit-status" aria-live="polite"></p>
          </div>
        </aside>
      </div>
    </div>
  `;

  document.title = `${unit.title} — ButugiriButuri`;
  renderMathWithin(unitsContainer);
  window.initMotionSystem?.(unitsContainer);
  bindReaderEvents();
  setCommentsMode('loading');
  activateSection(activeSectionId);
  observeSections();
  await hydrateCommentsForCurrentUnit();
}

function renderSections(sections, units) {
  return sections.map(section => {
    const sectionHtml = section.markdown
      ? renderTextbookMarkdown(section.markdown, units)
      : '<p>本文は準備中です。</p>';

    return `
      <section class="textbook-section" id="${section.id}" data-section-id="${section.id}">
        <div class="section-label">SECTION ${section.number}</div>
        <div class="textbook-section-header">
          <h2>${escapeHtml(section.title)}</h2>
          <button class="section-comment-link" type="button" data-section-jump="${section.id}">
            この節の補足を開く
          </button>
        </div>
        <div class="textbook-section-body article-content">
          ${sectionHtml}
        </div>
      </section>
    `;
  }).join('');
}

function renderSequenceNav(unit, units) {
  const neighbors = getUnitNeighbors(unit, units);

  return `
    <section class="textbook-panel">
      <div class="textbook-panel-head">
        <h2>読み進める</h2>
        <p>同じ分野の流れに沿って前後の単元へ移動できます。</p>
      </div>
      <div class="sequence-nav">
        ${renderSequenceCard(neighbors.previous, '前の単元')}
        ${renderSequenceCard(neighbors.next, '次の単元')}
      </div>
    </section>
  `;
}

function renderSequenceCard(unit, label) {
  if (!unit) {
    return `
      <div class="sequence-card is-empty">
        <span class="sequence-label">${label}</span>
        <strong>ここが端です</strong>
        <p>この方向の単元はまだありません。</p>
      </div>
    `;
  }

  return `
    <a class="sequence-card" href="${buildUnitHref(unit.id)}">
      <span class="sequence-label">${label}</span>
      <strong>${escapeHtml(unit.title)}</strong>
      <p>${escapeHtml(getUnitSubtitle(unit))}</p>
    </a>
  `;
}

function renderRelatedUnits(unit, units) {
  const relatedUnits = findRelatedUnits(unit, units);

  return `
    <section class="textbook-panel">
      <div class="textbook-panel-head">
        <h2>関連単元</h2>
        <p>本文でつながっている用語や、相互参照している単元です。</p>
      </div>

      ${relatedUnits.length === 0 ? `
        <div class="related-empty">
          <p>関連単元はまだありません。</p>
        </div>
      ` : `
        <div class="related-unit-grid">
          ${relatedUnits.map(item => `
            <a class="related-unit-card" href="${buildUnitHref(item.unit.id)}">
              <span class="relation-badge">${escapeHtml(item.relation)}</span>
              <strong>${escapeHtml(item.unit.title)}</strong>
              <p>${escapeHtml(getUnitSubtitle(item.unit))}</p>
            </a>
          `).join('')}
        </div>
      `}
    </section>
  `;
}

function renderSectionTabs(unitId, sections) {
  return sections.map(section => {
    const count = getSectionComments(unitId, section.id).length;
    const countLabel = commentsMode === 'loading'
      ? '...'
      : (count > 0 ? `${count}件` : '0件');

    return `
      <button
        class="section-tab"
        type="button"
        data-section-target="${section.id}"
      >
        <span class="section-tab-title">${escapeHtml(section.title)}</span>
        <span class="section-tab-count">${countLabel}</span>
      </button>
    `;
  }).join('');
}

function bindReaderEvents() {
  const jumpButtons = document.querySelectorAll('[data-section-jump]');
  const form = document.getElementById('comment-form');
  const authorInput = document.getElementById('comment-author');

  bindSectionTabEvents();

  jumpButtons.forEach(button => {
    button.addEventListener('click', () => {
      const sectionId = button.dataset.sectionJump;
      activateSection(sectionId, { scrollIntoView: false, focusComment: true });
      document.getElementById('comment-body')?.focus();
    });
  });

  if (authorInput) {
    authorInput.value = localStorage.getItem(AUTHOR_KEY) || '';
  }

  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      void handleCommentSubmit();
    });
  }
}

function bindSectionTabEvents() {
  document.querySelectorAll('[data-section-target]').forEach(button => {
    button.addEventListener('click', () => {
      const sectionId = button.dataset.sectionTarget;
      activateSection(sectionId, { scrollIntoView: true, focusComment: true });
    });
  });
}

function activateSection(sectionId, options = {}) {
  const { scrollIntoView = false, focusComment = false } = options;
  const sidebarTitle = document.getElementById('sidebar-section-title');
  const commentThread = document.getElementById('comment-thread');
  const commentCount = document.getElementById('sidebar-comment-count');
  const commentInput = document.getElementById('comment-body');

  if (!currentUnit || !sectionId) return;

  activeSectionId = sectionId;
  const activeSection = currentSections.find(section => section.id === sectionId) || currentSections[0];
  const comments = getSectionComments(currentUnit.id, activeSection.id);

  document.querySelectorAll('.textbook-section').forEach(sectionEl => {
    sectionEl.classList.toggle('is-active', sectionEl.dataset.sectionId === activeSection.id);
  });

  document.querySelectorAll('.section-tab').forEach(tabEl => {
    tabEl.classList.toggle('is-active', tabEl.dataset.sectionTarget === activeSection.id);
  });

  if (sidebarTitle) {
    sidebarTitle.textContent = activeSection.title;
  }

  if (commentCount) {
    commentCount.textContent = commentsMode === 'loading'
      ? '読み込み中...'
      : `${comments.length}件の補足`;
  }

  if (commentThread) {
    commentThread.innerHTML = renderCommentThread(comments);
    renderMathWithin(commentThread);
  }

  if (scrollIntoView) {
    const sectionEl = document.getElementById(activeSection.id);
    sectionEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (focusComment) {
    commentInput?.focus();
  }
}

function setCommentsMode(mode) {
  commentsMode = mode;

  const pill = document.getElementById('comment-storage-pill');
  const note = document.getElementById('comment-storage-note');

  if (pill) {
    pill.className = `comment-storage-pill is-${mode}`;
  }

  if (mode === 'loading') {
    if (pill) pill.textContent = '接続中';
    if (note) note.textContent = '共有ノートに接続しています...';
    setCommentFormDisabled(true);
    setSubmitStatus('', 'idle');
    return;
  }

  if (mode === 'shared') {
    if (pill) pill.textContent = '共有';
    if (note) note.textContent = 'この単元の補足は共有保存され、他の閲覧者にも表示されます。';
    setCommentFormDisabled(false);
    return;
  }

  if (pill) pill.textContent = 'ローカル';
  if (note) note.textContent = '共有サーバーに接続できなかったため、このブラウザにだけ保存します。';
  setCommentFormDisabled(false);
}

function setSubmitStatus(message, state) {
  const status = document.getElementById('comment-submit-status');
  if (!status) return;

  status.textContent = message;
  status.className = `comment-submit-status is-${state}`;
}

function setCommentFormDisabled(disabled) {
  const authorInput = document.getElementById('comment-author');
  const bodyInput = document.getElementById('comment-body');
  const submitButton = document.getElementById('comment-submit-button');

  if (authorInput) authorInput.disabled = disabled;
  if (bodyInput) bodyInput.disabled = disabled;
  if (submitButton) submitButton.disabled = disabled;
}

async function hydrateCommentsForCurrentUnit() {
  if (!currentUnit) return;

  const sharedComments = await fetchSharedComments(currentUnit.id);

  if (sharedComments) {
    sharedCommentsBySection = sharedComments;
    setCommentsMode('shared');
  } else {
    setCommentsMode('local');
  }

  refreshSectionTabCounts();
  activateSection(activeSectionId);
}

async function fetchSharedComments(unitId) {
  try {
    const response = await fetch(`${COMMENTS_API_URL}?unitId=${encodeURIComponent(unitId)}`, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    return normalizeCommentsBySection(payload.commentsBySection);
  } catch (error) {
    console.warn('Shared comments are unavailable, falling back to local storage:', error);
    return null;
  }
}

function normalizeCommentsBySection(store) {
  if (!store || typeof store !== 'object') return {};

  return Object.fromEntries(
    Object.entries(store).map(([sectionId, comments]) => [
      sectionId,
      Array.isArray(comments)
        ? comments.map(normalizeComment).filter(Boolean)
        : []
    ])
  );
}

function normalizeComment(rawComment) {
  if (!rawComment || typeof rawComment !== 'object') return null;

  return {
    id: String(rawComment.id || `${Date.now()}`),
    author: String(rawComment.author || '匿名').slice(0, 32),
    body: String(rawComment.body || '').slice(0, 2000),
    createdAt: String(rawComment.createdAt || new Date().toISOString())
  };
}

function getLocalCommentsStore() {
  const stored = localStorage.getItem(COMMENTS_KEY);

  if (!stored) return {};

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Comments store is invalid:', error);
    return {};
  }
}

function getSectionComments(unitId, sectionId) {
  if (commentsMode === 'shared') {
    return sharedCommentsBySection[sectionId] || [];
  }

  const store = getLocalCommentsStore();
  return store[unitId]?.[sectionId] || [];
}

function saveLocalComment(unitId, sectionId, author, body) {
  const store = getLocalCommentsStore();
  const unitComments = store[unitId] || {};
  const sectionComments = unitComments[sectionId] || [];

  sectionComments.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    author: author || '匿名',
    body,
    createdAt: new Date().toISOString()
  });

  unitComments[sectionId] = sectionComments;
  store[unitId] = unitComments;

  localStorage.setItem(COMMENTS_KEY, JSON.stringify(store));
}

async function saveSharedComment(unitId, sectionId, author, body) {
  const response = await fetch(COMMENTS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      unitId,
      sectionId,
      author,
      body
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || '共有コメントの保存に失敗しました');
  }

  const comment = normalizeComment(payload.comment);
  if (!comment) {
    throw new Error('保存結果の形式が不正です');
  }

  const sectionComments = sharedCommentsBySection[sectionId] || [];
  sharedCommentsBySection[sectionId] = [...sectionComments, comment];
}

async function handleCommentSubmit() {
  if (!currentUnit || !activeSectionId || isSubmittingComment || commentsMode === 'loading') {
    return;
  }

  const authorInput = document.getElementById('comment-author');
  const bodyInput = document.getElementById('comment-body');
  const author = (authorInput?.value.trim() || '匿名').slice(0, 32);
  const body = bodyInput?.value.trim();

  if (!body) {
    setSubmitStatus('補足コメントを入力してください。', 'error');
    bodyInput?.focus();
    return;
  }

  if (body.length > 2000) {
    setSubmitStatus('補足コメントは 2000 文字以内で入力してください。', 'error');
    bodyInput?.focus();
    return;
  }

  isSubmittingComment = true;
  setCommentFormDisabled(true);
  setSubmitStatus('補足を保存しています...', 'loading');

  try {
    localStorage.setItem(AUTHOR_KEY, author);

    if (commentsMode === 'shared') {
      await saveSharedComment(currentUnit.id, activeSectionId, author, body);
    } else {
      saveLocalComment(currentUnit.id, activeSectionId, author, body);
    }

    if (bodyInput) {
      bodyInput.value = '';
    }

    refreshSectionTabCounts();
    activateSection(activeSectionId);
    setSubmitStatus(
      commentsMode === 'shared'
        ? '共有ノートに補足を追加しました。'
        : 'このブラウザの補足ノートに保存しました。',
      'success'
    );
  } catch (error) {
    setSubmitStatus(error.message || '補足の保存に失敗しました。', 'error');
  } finally {
    isSubmittingComment = false;
    setCommentFormDisabled(false);
  }
}

function refreshSectionTabCounts() {
  const sectionTabs = document.getElementById('section-tabs');
  if (!sectionTabs || !currentUnit) return;

  sectionTabs.innerHTML = renderSectionTabs(currentUnit.id, currentSections);
  bindSectionTabEvents();
}

function renderCommentThread(comments) {
  if (commentsMode === 'loading') {
    return `
      <div class="comment-empty">
        <p>補足ノートを読み込んでいます...</p>
      </div>
    `;
  }

  if (comments.length === 0) {
    return `
      <div class="comment-empty">
        <p>まだ補足コメントはありません。</p>
        <p>この節で引っかかった点や、別の理解のしかたを書き残せます。</p>
      </div>
    `;
  }

  return comments
    .slice()
    .reverse()
    .map(comment => `
      <article class="comment-card">
        <div class="comment-card-meta">
          <strong>${escapeHtml(comment.author)}</strong>
          <time>${new Date(comment.createdAt).toLocaleString('ja-JP')}</time>
        </div>
        <div class="comment-card-body article-content">
          ${renderTextbookMarkdown(comment.body)}
        </div>
      </article>
    `)
    .join('');
}

function observeSections() {
  if (!('IntersectionObserver' in window)) return;

  if (sectionObserver) {
    sectionObserver.disconnect();
  }

  sectionObserver = new IntersectionObserver(entries => {
    const visibleEntries = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (visibleEntries.length === 0) return;

    const nextSectionId = visibleEntries[0].target.dataset.sectionId;
    if (nextSectionId && nextSectionId !== activeSectionId) {
      activateSection(nextSectionId);
    }
  }, {
    rootMargin: '-15% 0px -55% 0px',
    threshold: [0.2, 0.45, 0.75]
  });

  document.querySelectorAll('.textbook-section').forEach(section => {
    sectionObserver.observe(section);
  });
}

document.addEventListener('DOMContentLoaded', init);
