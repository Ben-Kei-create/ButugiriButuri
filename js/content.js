// ========================================
// Shared textbook content helpers
// ========================================

const DB_KEY = 'butugiri_articles';
const COMMENTS_KEY = 'butugiri_section_comments';

const CATEGORIES = {
  mechanics: { name: '力学', id: 'mechanics' },
  electromagnetism: { name: '電磁気学', id: 'electromagnetism' },
  thermodynamics: { name: '熱力学', id: 'thermodynamics' },
  quantum: { name: '量子力学', id: 'quantum' },
  relativity: { name: '相対性理論', id: 'relativity' },
  math: { name: '数理物理', id: 'math' }
};

const CATEGORY_ORDER = Object.keys(CATEGORIES);

const SAMPLE_UNITS = [
  {
    id: 'sample-1',
    title: 'ニュートンの運動方程式を読み解く',
    category: 'mechanics',
    chapter: '第1章 力と運動のつながり',
    order: 1,
    content: `## 力と加速度

ニュートンの第二法則は、物体に働く合力と [[加速度とベクトルの見方|加速度]] の関係を定量的に記述する。

$$\\vec{F} = m\\vec{a}$$

力が大きいほど加速度は大きくなり、同じ力でも質量が大きいほど加速度は小さくなる。

## 自由落下を例にする

重力しか働かない自由落下では、合力は $mg$ だから

$$m\\vec{a} = m\\vec{g}$$

となり、加速度は一定で $\\vec{a} = \\vec{g}$ になる。ここから速度や位置の式を順に導ける。

## エネルギーとのつながり

運動方程式は、のちに学ぶ仕事やエネルギー保存則の理解にもつながる。力学の見通しをよくするために、式だけでなく「何が原因で速度が変わるか」を言葉で読めるようにしておく。`,
    date: '2026-03-21T00:00:00Z'
  },
  {
    id: 'sample-2',
    title: '加速度とベクトルの見方',
    category: 'mechanics',
    chapter: '第1章 力と運動のつながり',
    order: 2,
    content: `## 加速度とは何か

[[ニュートンの運動方程式を読み解く|運動方程式]] に現れる加速度は、「速度の変化のしかた」を表す量である。

$$\\vec{a} = \\frac{d\\vec{v}}{dt}$$

速さが変わるときだけでなく、向きだけが変わる等速円運動でも加速度は存在する。

## ベクトルとして扱う

速度も加速度も向きをもつ量なので、$x$ 方向と $y$ 方向に分けて考えると見通しがよい。

$$a_x = \\frac{dv_x}{dt}, \\qquad a_y = \\frac{dv_y}{dt}$$

斜方投射や円運動を学ぶとき、この見方がそのまま効いてくる。`,
    date: '2026-03-19T00:00:00Z'
  },
  {
    id: 'sample-4',
    title: '電場と電荷の関係',
    category: 'electromagnetism',
    chapter: '第1章 電場の基本像',
    order: 1,
    content: `## 電場の定義

電場は、単位電荷あたりに働く力として定義される。

$$\\vec{E} = \\frac{\\vec{F}}{q}$$

この定義から、電荷が空間にどのような力の分布をつくるかを調べられる。

## ガウスの法則を見る

[[マクスウェル方程式の全体像|マクスウェル方程式]] の最初の式

$$\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\varepsilon_0}$$

は、電荷が電場の源であることを微分形式で表している。`,
    date: '2026-03-18T00:00:00Z'
  },
  {
    id: 'sample-3',
    title: 'マクスウェル方程式の全体像',
    category: 'electromagnetism',
    chapter: '第2章 電磁場を統一してみる',
    order: 1,
    content: `## 4つの方程式

電磁気学の全現象は、[[電場と電荷の関係|電場]] と磁場のふるまいを記述する4つの方程式にまとめられる。

$$\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\varepsilon_0}$$

$$\\nabla \\cdot \\vec{B} = 0$$

$$\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}$$

$$\\nabla \\times \\vec{B} = \\mu_0 \\vec{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\vec{E}}{\\partial t}$$

## 電磁波へのつながり

真空中では、これら4式から電場と磁場がともに波動方程式を満たすことが導かれる。光が電磁波であるという理解はここから出てくる。`,
    date: '2026-03-20T00:00:00Z'
  }
];

function getDefaultChapter(category) {
  return `${getCategoryName(category)}の基礎`;
}

function getCategoryName(category) {
  return CATEGORIES[category]?.name || category;
}

function normalizeUnit(unit, index = 0) {
  const category = CATEGORIES[unit.category] ? unit.category : 'mechanics';
  const title = String(unit.title || '無題の単元').trim();
  const id = String(unit.id || `unit-${index + 1}`).trim();
  const chapter = String(unit.chapter || getDefaultChapter(category)).trim();
  const parsedOrder = Number(unit.order);
  const order = Number.isFinite(parsedOrder) ? parsedOrder : index + 1;

  return {
    ...unit,
    id,
    title,
    category,
    chapter,
    order,
    content: typeof unit.content === 'string' ? unit.content : '',
    date: unit.date || new Date().toISOString()
  };
}

function getUnits() {
  const stored = localStorage.getItem(DB_KEY);
  const userUnits = stored ? JSON.parse(stored) : [];
  const normalizedUserUnits = userUnits.map((unit, index) => normalizeUnit(unit, index));
  const ids = new Set(normalizedUserUnits.map(unit => unit.id));
  const uniqueSamples = SAMPLE_UNITS
    .filter(unit => !ids.has(unit.id))
    .map((unit, index) => normalizeUnit(unit, normalizedUserUnits.length + index));

  return [...normalizedUserUnits, ...uniqueSamples];
}

function getChapterSortValue(chapter) {
  const match = String(chapter || '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function compareUnitsForReading(a, b) {
  const categoryDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
  if (categoryDiff !== 0) return categoryDiff;

  const chapterNumberDiff = getChapterSortValue(a.chapter) - getChapterSortValue(b.chapter);
  if (chapterNumberDiff !== 0) return chapterNumberDiff;

  const chapterNameDiff = a.chapter.localeCompare(b.chapter, 'ja');
  if (chapterNameDiff !== 0) return chapterNameDiff;

  const orderDiff = a.order - b.order;
  if (orderDiff !== 0) return orderDiff;

  return a.title.localeCompare(b.title, 'ja');
}

function sortUnitsForReading(units) {
  return [...units].sort(compareUnitsForReading);
}

function sortUnitsByDate(units) {
  return [...units].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function groupUnitsByCategoryAndChapter(units) {
  const sortedUnits = sortUnitsForReading(units);

  return CATEGORY_ORDER.map(categoryKey => {
    const categoryUnits = sortedUnits.filter(unit => unit.category === categoryKey);
    const chapters = [];

    categoryUnits.forEach(unit => {
      const lastChapter = chapters[chapters.length - 1];
      if (!lastChapter || lastChapter.name !== unit.chapter) {
        chapters.push({
          name: unit.chapter,
          units: [unit]
        });
        return;
      }

      lastChapter.units.push(unit);
    });

    return {
      key: categoryKey,
      label: getCategoryName(categoryKey),
      chapters
    };
  });
}

function getUnitNeighbors(currentUnit, units = getUnits()) {
  const readingUnits = sortUnitsForReading(units.filter(unit => unit.category === currentUnit.category));
  const index = readingUnits.findIndex(unit => unit.id === currentUnit.id);

  return {
    previous: index > 0 ? readingUnits[index - 1] : null,
    next: index >= 0 && index < readingUnits.length - 1 ? readingUnits[index + 1] : null
  };
}

function extractWikiTargets(markdown) {
  const matches = [...String(markdown || '').matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)];
  return matches.map(match => match[1].trim()).filter(Boolean);
}

function findRelatedUnits(currentUnit, units = getUnits()) {
  const outgoing = extractWikiTargets(currentUnit.content)
    .map(target => findUnitByLookup(target, units))
    .filter(Boolean)
    .filter(unit => unit.id !== currentUnit.id);

  const incoming = units.filter(unit => (
    unit.id !== currentUnit.id &&
    extractWikiTargets(unit.content).some(target => {
      const matched = findUnitByLookup(target, units);
      return matched?.id === currentUnit.id;
    })
  ));

  const unique = new Map();

  outgoing.forEach(unit => {
    unique.set(unit.id, {
      unit,
      relation: 'この単元から参照'
    });
  });

  incoming.forEach(unit => {
    if (!unique.has(unit.id)) {
      unique.set(unit.id, {
        unit,
        relation: 'この単元を参照'
      });
    }
  });

  return [...unique.values()].sort((left, right) => compareUnitsForReading(left.unit, right.unit));
}

function getUnitSubtitle(unit) {
  return `${unit.chapter} / ${getCategoryName(unit.category)}`;
}

function escapeHtml(text) {
  const safeText = typeof text === 'string' ? text : String(text || '');
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return safeText.replace(/[&<>"']/g, m => map[m]);
}

function stripWikiLinks(markdown) {
  return String(markdown || '').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => (label || target).trim());
}

function getExcerpt(markdown, length) {
  const text = stripWikiLinks(markdown)
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`+(.+?)`+/g, '$1')
    .replace(/\$+.*?\$+/g, '')
    .replace(/\n\n+/g, ' ')
    .trim();

  return text.length > length ? `${text.substring(0, length)}...` : text;
}

function buildUnitHref(unitId) {
  return `articles.html?unit=${encodeURIComponent(unitId)}`;
}

function normalizeLookup(value) {
  return String(value || '').trim().toLowerCase();
}

function findUnitByLookup(lookup, units = getUnits()) {
  const normalized = normalizeLookup(lookup);
  return units.find(unit => (
    normalizeLookup(unit.id) === normalized ||
    normalizeLookup(unit.title) === normalized
  ));
}

function preprocessWikiLinks(markdown, units = getUnits()) {
  return markdown.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, targetRaw, labelRaw) => {
    const target = targetRaw.trim();
    const label = (labelRaw || targetRaw).trim();
    const targetUnit = findUnitByLookup(target, units);

    if (!targetUnit) {
      return `<span class="term-link is-missing" title="対応する単元がまだありません">${escapeHtml(label)}</span>`;
    }

    return `<a class="term-link" href="${buildUnitHref(targetUnit.id)}" data-unit-link="${escapeHtml(targetUnit.id)}">${escapeHtml(label)}</a>`;
  });
}

function renderTextbookMarkdown(markdown, units = getUnits()) {
  const safeMarkdown = escapeHtml(typeof markdown === 'string' ? markdown : '');
  return marked.parse(preprocessWikiLinks(safeMarkdown, units));
}

function splitIntoSections(markdown) {
  const lines = String(markdown || '').split('\n');
  const sections = [];
  let current = null;

  lines.forEach(line => {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      if (current && (current.markdown.length > 0 || current.title !== '導入')) {
        sections.push(current);
      }
      current = {
        title: headingMatch[1].trim(),
        markdown: []
      };
      return;
    }

    if (!current) {
      current = {
        title: '導入',
        markdown: []
      };
    }

    current.markdown.push(line);
  });

  if (current && (current.markdown.length > 0 || current.title !== '導入')) {
    sections.push(current);
  }

  if (sections.length === 0) {
    return [{
      id: 'section-1',
      title: '本文',
      markdown: String(markdown || '').trim(),
      number: 1
    }];
  }

  return sections
    .map((section, index) => ({
      id: `section-${index + 1}`,
      title: section.title,
      markdown: section.markdown.join('\n').trim(),
      number: index + 1
    }))
    .filter(section => section.markdown || section.title);
}

function renderMathWithin(element) {
  if (!element || typeof renderMathInElement !== 'function') return;

  try {
    renderMathInElement(element, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    });
  } catch (error) {
    console.warn('KaTeX error:', error);
  }
}
