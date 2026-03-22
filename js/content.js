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

運動方程式は、のちに学ぶ [[仕事とエネルギー保存則の見方|仕事とエネルギー保存則]] の理解にもつながる。力学の見通しをよくするために、式だけでなく「何が原因で速度が変わるか」を言葉で読めるようにしておく。`,
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

[[等加速度運動の3式をつなぐ|等加速度運動]] や円運動を学ぶとき、この見方がそのまま効いてくる。`,
    date: '2026-03-19T00:00:00Z'
  },
  {
    id: 'sample-5',
    title: '等加速度運動の3式をつなぐ',
    category: 'mechanics',
    chapter: '第2章 等加速度運動を読む',
    order: 1,
    content: `## 3つの式の役割

等加速度運動では、[[加速度とベクトルの見方|加速度]] が一定であることから次の3式が得られる。

$$v = v_0 + at$$

$$x = v_0 t + \\frac{1}{2}at^2$$

$$v^2 - v_0^2 = 2ax$$

## どの式を使うか

時間が分かるときは最初の2式、時間を消したいときは3式が便利である。使い分けを整理すると、式を覚えるだけでなく問題設定が読みやすくなる。`,
    date: '2026-03-17T00:00:00Z'
  },
  {
    id: 'sample-6',
    title: '仕事とエネルギー保存則の見方',
    category: 'mechanics',
    chapter: '第2章 等加速度運動を読む',
    order: 2,
    content: `## 仕事の定義

力が変位に沿ってした仕事は

$$W = Fs\\cos\\theta$$

で表される。[[ニュートンの運動方程式を読み解く|運動方程式]] と同じ現象を、エネルギーの言葉で読み替える入口になる。

## エネルギー保存則

位置エネルギーと運動エネルギーを合わせた力学的エネルギーが保存されると考えると、運動の見通しが一気によくなる。

$$\\frac{1}{2}mv_1^2 + mgh_1 = \\frac{1}{2}mv_2^2 + mgh_2$$`,
    date: '2026-03-16T00:00:00Z'
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
    id: 'sample-7',
    title: 'クーロンの法則と電気力線',
    category: 'electromagnetism',
    chapter: '第1章 電場の基本像',
    order: 2,
    content: `## クーロンの法則

点電荷どうしに働く力は

$$F = \\frac{1}{4\\pi\\varepsilon_0}\\frac{q_1 q_2}{r^2}$$

で与えられる。ここから [[電場と電荷の関係|電場]] を定義すると、複数の電荷がつくる力も整理しやすい。

## 力線で考える

電気力線は、電場の向きと強さを視覚的に表す道具である。図で見ると、点電荷のまわりに空間的な構造があることが直感的につかめる。`,
    date: '2026-03-15T00:00:00Z'
  },
  {
    id: 'sample-8',
    title: 'ファラデーの法則の入口',
    category: 'electromagnetism',
    chapter: '第2章 電磁場を統一してみる',
    order: 1,
    content: `## 磁束が変わると起電力が生まれる

電磁誘導の基本は、磁束の時間変化が起電力を生むという見方である。

$$\\mathcal{E} = -\\frac{d\\Phi_B}{dt}$$

## マクスウェル方程式への接続

この関係は、[[マクスウェル方程式の全体像|ファラデーの法則]] を積分形で読んだものとみなせる。誘導現象を個別の法則として覚えるだけでなく、場の理論へつながる入口として読むと理解が深まる。`,
    date: '2026-03-14T00:00:00Z'
  },
  {
    id: 'sample-3',
    title: 'マクスウェル方程式の全体像',
    category: 'electromagnetism',
    chapter: '第2章 電磁場を統一してみる',
    order: 2,
    content: `## 4つの方程式

電磁気学の全現象は、[[電場と電荷の関係|電場]] と磁場のふるまいを記述する4つの方程式にまとめられる。

$$\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\varepsilon_0}$$

$$\\nabla \\cdot \\vec{B} = 0$$

$$\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}$$

$$\\nabla \\times \\vec{B} = \\mu_0 \\vec{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\vec{E}}{\\partial t}$$

## 電磁波へのつながり

真空中では、これら4式から電場と磁場がともに波動方程式を満たすことが導かれる。光が電磁波であるという理解はここから出てくる。`,
    date: '2026-03-20T00:00:00Z'
  },
  {
    id: 'sample-9',
    title: '熱量と比熱の考え方',
    category: 'thermodynamics',
    chapter: '第1章 温度と熱のやりとり',
    order: 1,
    content: `## 熱量の基本式

物体の温度変化に必要な熱量は

$$Q = mc\\Delta T$$

で表される。ここで比熱 $c$ は、物質が温まりやすいかどうかを表す量である。

## 熱平衡で考える

高温の物体が失う熱量と、低温の物体が受け取る熱量をつり合わせると、多くの混合問題を一つの式で整理できる。[[熱力学第一法則の読み方|内部エネルギーの見方]] に進む前の土台になる。`,
    date: '2026-03-13T00:00:00Z'
  },
  {
    id: 'sample-10',
    title: '熱力学第一法則の読み方',
    category: 'thermodynamics',
    chapter: '第2章 エネルギーとしての熱',
    order: 1,
    content: `## 第一法則

熱力学第一法則は、内部エネルギーの変化を熱と仕事で表す式である。

$$\\Delta U = Q + W$$

## 何が保存されているか

[[熱量と比熱の考え方|熱量]] の話では温度変化に注目したが、ここでは系全体のエネルギー収支を見る。熱機関や気体の変化を学ぶときの基本の読み方になる。`,
    date: '2026-03-12T00:00:00Z'
  },
  {
    id: 'sample-11',
    title: '波動関数は何を表すか',
    category: 'quantum',
    chapter: '第1章 量子力学の見方をつくる',
    order: 1,
    content: `## 波動関数の役割

量子力学では、粒子の状態を波動関数 $\\Psi$ で表す。

## 確率とのつながり

$|\\Psi|^2$ は位置などの測定結果の確率密度として解釈される。[[シュレーディンガー方程式の入口|時間発展の式]] を学ぶ前に、何が物理量なのかを整理しておくことが大切である。`,
    date: '2026-03-11T00:00:00Z'
  },
  {
    id: 'sample-12',
    title: 'シュレーディンガー方程式の入口',
    category: 'quantum',
    chapter: '第1章 量子力学の見方をつくる',
    order: 2,
    content: `## 時間発展を決める式

波動関数の時間変化は

$$i\\hbar\\frac{\\partial \\Psi}{\\partial t} = \\hat{H}\\Psi$$

で与えられる。これは量子力学における [[ニュートンの運動方程式を読み解く|運動方程式]] のような位置づけをもつ。

## 観測量との関係

ハミルトニアン $\\hat{H}$ は系のエネルギーに対応する演算子である。[[波動関数は何を表すか|波動関数の意味]] と合わせて読むと、式の構造が見えやすくなる。`,
    date: '2026-03-10T00:00:00Z'
  },
  {
    id: 'sample-13',
    title: '特殊相対論の二つの原理',
    category: 'relativity',
    chapter: '第1章 光速一定から始める',
    order: 1,
    content: `## 相対性原理

すべての慣性系で物理法則は同じ形をとる、というのが第一の原理である。

## 光速度不変

真空中の光速 $c$ は、観測者の運動状態によらず一定である。この二つを同時に認めると、時間や長さの概念そのものを見直す必要が出てくる。[[時間の遅れとローレンツ因子|ローレンツ変換]] はその帰結として現れる。`,
    date: '2026-03-09T00:00:00Z'
  },
  {
    id: 'sample-14',
    title: '時間の遅れとローレンツ因子',
    category: 'relativity',
    chapter: '第1章 光速一定から始める',
    order: 2,
    content: `## ローレンツ因子

相対論では

$$\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}$$

が繰り返し現れる。運動速度が上がるほど、古典力学との差が大きくなることを表している。

## 時間の遅れ

運動する時計は静止系から見るとゆっくり進む。これは [[特殊相対論の二つの原理|二つの原理]] を同時に満たそうとしたときに避けられない結果である。`,
    date: '2026-03-08T00:00:00Z'
  },
  {
    id: 'sample-15',
    title: 'ベクトルの内積と仕事',
    category: 'math',
    chapter: '第1章 物理のためのベクトル',
    order: 1,
    content: `## 内積の定義

ベクトルの内積は

$$\\vec{a} \\cdot \\vec{b} = ab\\cos\\theta$$

で定義される。角度の情報を含みつつ、一つの数にまとめる操作である。

## 物理でどう使うか

[[仕事とエネルギー保存則の見方|仕事]] の式 $W = Fs\\cos\\theta$ は、力と変位の内積として読むととても自然になる。`,
    date: '2026-03-07T00:00:00Z'
  },
  {
    id: 'sample-16',
    title: '微分方程式と物理モデル',
    category: 'math',
    chapter: '第2章 変化を式で記述する',
    order: 1,
    content: `## 微分方程式とは何か

未知関数とその導関数の関係を与える式を微分方程式という。物理では「変化の法則」を表す最も自然な形として現れる。

## 物理へのつながり

[[加速度とベクトルの見方|加速度]] の定義から出る運動方程式も、[[シュレーディンガー方程式の入口|シュレーディンガー方程式]] も微分方程式である。式の形を見るだけで、何を初期条件として与えるべきかが見えてくる。`,
    date: '2026-03-06T00:00:00Z'
  },
  {
    id: 'sample-17',
    title: '円運動と向心加速度',
    category: 'mechanics',
    chapter: '第3章 周期運動と円運動',
    order: 1,
    content: `## 速さ一定でも加速度はある

等速円運動では速さは一定でも、速度ベクトルの向きが変わり続けるので [[加速度とベクトルの見方|加速度]] はゼロではない。

:::figure 円運動をベクトルで読む
速度ベクトルの向きが変わる -> 中心向きの加速度が必要
中心向きの力が働く -> 円軌道が保たれる
caption: 速さではなく、速度ベクトル全体が変化していることがポイントである。
:::

$$a = \\frac{v^2}{r}$$

## 向心力として読む

必要な力の大きさは

$$F = m\\frac{v^2}{r}$$

で与えられる。[[ニュートンの運動方程式を読み解く|運動方程式]] を円運動に適用したものだと読むと、公式がばらばらに見えなくなる。`,
    date: '2026-03-22T09:00:00Z'
  },
  {
    id: 'sample-18',
    title: '単振動を円運動で読む',
    category: 'mechanics',
    chapter: '第3章 周期運動と円運動',
    order: 2,
    content: `## 射影として見る

単振動は、[[円運動と向心加速度|等速円運動]] を一直線上に射影した運動として理解できる。

:::figure 単振動の見取り図
円運動を横から見る -> x軸上の往復運動に見える
位相が進む -> 位置と速度が周期的に変わる
caption: 円運動の幾何学を借りると、三角関数と単振動の関係が自然に見える。
:::

$$x = A\\cos \\omega t$$

## 加速度との関係

位置に比例して原点向きに戻そうとするので

$$a = -\\omega^2 x$$

となる。これは「ずれればずれるほど戻す力が強くなる」という単振動の本質を表している。`,
    date: '2026-03-22T08:00:00Z'
  },
  {
    id: 'sample-19',
    title: '電位差とコンデンサー',
    category: 'electromagnetism',
    chapter: '第3章 電位と回路',
    order: 1,
    content: `## 電荷をためるとは何か

コンデンサーは電荷を蓄える素子であり、蓄えた電荷量と電位差の比例関係で特徴づけられる。

:::figure コンデンサーの基本像
電荷をためる -> 極板間に電場ができる
電場ができる -> 電位差とエネルギーが蓄えられる
caption: [[電場と電荷の関係|電場]] の理解を、回路の言葉に持ち込んだものとして読むとつながりやすい。
:::

$$Q = CV$$

## エネルギーをどう読むか

コンデンサーに蓄えられるエネルギーは

$$U = \\frac{1}{2}CV^2$$

で与えられる。電荷を分けておくには仕事が必要で、その仕事が電場のエネルギーとして保存されている。`,
    date: '2026-03-22T07:00:00Z'
  },
  {
    id: 'sample-20',
    title: 'キルヒホッフ則で回路を解く',
    category: 'electromagnetism',
    chapter: '第3章 電位と回路',
    order: 2,
    content: `## 保存則としての回路

キルヒホッフの法則は、電流とエネルギーの保存を回路に書き下したものである。

$$\\sum I = 0$$

$$\\sum V = 0$$

:::figure 回路を解く順番
節点ごとに電流をそろえる -> 閉回路ごとに電位差をそろえる -> 連立方程式を解く
caption: いきなり数式操作に入るより、どの保存則を使っているかを確認すると見通しがよい。
:::

## 抵抗と電位差

[[電位差とコンデンサー|電位差]] の考え方にオームの法則

$$V = IR$$

を組み合わせると、未知の電流や電圧を順に決められる。`,
    date: '2026-03-22T06:00:00Z'
  },
  {
    id: 'sample-21',
    title: '理想気体の状態方程式',
    category: 'thermodynamics',
    chapter: '第3章 気体の状態変化',
    order: 1,
    content: `## 圧力、体積、温度の関係

理想気体では、巨視的な状態量が一つの式で結びつけられる。

$$pV = nRT$$

:::figure 状態方程式の見方
温度が上がる -> 圧力または体積が増えやすい
粒子数が増える -> 同じ温度でも押す効果が大きくなる
caption: 分子運動論の細かな絵を使わなくても、状態量どうしの押し合いとして読める。
:::

## 変化の条件を固定する

等温、等圧、等積という条件を切り替えると、どの量がどのように変化するかが整理しやすい。これは [[PV図で仕事を読む|PV図]] を読むときの土台になる。`,
    date: '2026-03-22T05:00:00Z'
  },
  {
    id: 'sample-22',
    title: 'PV図で仕事を読む',
    category: 'thermodynamics',
    chapter: '第3章 気体の状態変化',
    order: 2,
    content: `## 面積としての仕事

気体が外部にする仕事は、PV図では曲線の下の面積として読める。

$$W = \\int p\\,dV$$

:::figure PV図の読み方
体積が増える -> 気体が外へ仕事をする
体積が減る -> 外部が気体へ仕事をする
caption: 符号の取り方は「どちらが仕事をしたか」を先に言葉で決めると混乱しにくい。
:::

## 第一法則とつなぐ

[[熱力学第一法則の読み方|熱力学第一法則]] の

$$\\Delta U = Q + W$$

に戻すと、PV図で見た面積が内部エネルギー変化とどう結びつくかを一枚で説明できる。`,
    date: '2026-03-22T04:00:00Z'
  },
  {
    id: 'sample-23',
    title: '不確定性原理の見方',
    category: 'quantum',
    chapter: '第2章 量子らしさを測る',
    order: 1,
    content: `## 何が同時に定まらないのか

位置と運動量は、同時にいくらでも正確に決められるわけではない。

$$\\Delta x\\,\\Delta p \\ge \\frac{\\hbar}{2}$$

:::figure 不確定性原理の直感
位置を鋭くしぼる -> 波数成分が広がる
波数成分が広がる -> 運動量のばらつきが大きくなる
caption: これは測定器の不完全さではなく、[[波動関数は何を表すか|波動関数]] そのものの性質として現れる。
:::

## 波として読む

一つの波長だけでは広がった波になり、局在した粒子像はつくれない。局在をつくるには多くの波数を重ねる必要があり、そのぶん運動量の情報が広がる。`,
    date: '2026-03-22T03:00:00Z'
  },
  {
    id: 'sample-24',
    title: 'ポテンシャル障壁とトンネル効果',
    category: 'quantum',
    chapter: '第2章 量子らしさを測る',
    order: 2,
    content: `## 古典的には越えられない壁

古典力学ではエネルギーが足りなければ障壁を越えられないが、量子力学では波動関数が障壁の向こう側までしみ出す。

:::figure トンネル効果の流れ
障壁に波が入る -> 振幅は減衰しながら内部へしみ出す
障壁の外にも波が残る -> 有限の確率で透過が起こる
caption: [[シュレーディンガー方程式の入口|時間発展の式]] を境界条件つきで読むと、このふるまいが自然に現れる。
:::

## 何が量子的なのか

粒子を点の玉として見ると不思議に感じるが、波として見ると「小さくなった振幅が向こう側に届く」と読める。半導体や走査トンネル顕微鏡の理解にもつながる。`,
    date: '2026-03-22T02:00:00Z'
  },
  {
    id: 'sample-25',
    title: '質量とエネルギーの等価性',
    category: 'relativity',
    chapter: '第2章 エネルギーと運動量の再定義',
    order: 1,
    content: `## 静止していてもエネルギーをもつ

相対論では、静止している物体にも質量に対応するエネルギーがある。

$$E = mc^2$$

:::figure 質量をエネルギーとして読む
質量をもつ -> 静止していてもエネルギーをもつ
反応で質量差が出る -> その差が放出エネルギーになる
caption: [[特殊相対論の二つの原理|特殊相対論]] の帰結として、エネルギーの定義自体が広がったと読むとよい。
:::

## 運動量も含める

一般には

$$E^2 = p^2c^2 + m^2c^4$$

で結ばれる。光子のように静止質量がなくてもエネルギーをもてることも、この式から一緒に説明できる。`,
    date: '2026-03-22T01:00:00Z'
  },
  {
    id: 'sample-26',
    title: 'フーリエ級数の見取り図',
    category: 'math',
    chapter: '第3章 波を分解してみる',
    order: 1,
    content: `## 複雑な波を単純な波へ分ける

周期関数は、正弦波と余弦波の重ね合わせとして表せる。

$$f(x) = \\frac{a_0}{2} + \\sum_{n=1}^{\\infty}\\left(a_n\\cos nx + b_n\\sin nx\\right)$$

:::figure フーリエ級数の考え方
複雑な周期波 -> 単純な正弦波の和として分解する
支配的な成分を読む -> 現象の周期構造が見える
caption: 電磁波や振動現象を読むときに、[[微分方程式と物理モデル|微分方程式]] の解を成分ごとに眺める感覚につながる。
:::

## 物理でどう効くか

波動、振動、回路の交流応答など、多くの現象で「複雑に見えるものを基底で分ける」という発想がそのまま使える。`,
    date: '2026-03-22T00:00:00Z'
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

function stripFigureBlocks(markdown) {
  return String(markdown || '').replace(/:::\s*figure(?:\s+([^\n]+))?\n([\s\S]*?):::/g, (_, title, body) => {
    const lines = String(body || '')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => line.replace(/^(caption|note)\s*:\s*/i, '').replace(/\s*(<->|->)\s*/g, ' '));

    return [title || '', ...lines].filter(Boolean).join(' ');
  });
}

function getExcerpt(markdown, length) {
  const text = stripFigureBlocks(stripWikiLinks(markdown))
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

function preprocessFigureBlocks(markdown) {
  return String(markdown || '').replace(/:::\s*figure(?:\s+([^\n]+))?\n([\s\S]*?):::/g, (_, titleRaw, bodyRaw) => {
    const title = (titleRaw || '図解').trim();
    const lines = String(bodyRaw || '')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    const rows = [];
    const captions = [];

    lines.forEach(line => {
      if (/^(caption|note)\s*:/i.test(line)) {
        captions.push(line.replace(/^(caption|note)\s*:\s*/i, '').trim());
        return;
      }

      const arrowToken = line.includes('&lt;-&gt;')
        ? '&lt;-&gt;'
        : line.includes('-&gt;')
          ? '-&gt;'
          : line.includes('<->')
            ? '<->'
            : (line.includes('->') ? '->' : null);
      if (!arrowToken) {
        captions.push(line);
        return;
      }

      const parts = line.split(arrowToken).map(part => part.trim()).filter(Boolean);
      if (parts.length < 2) {
        captions.push(line);
        return;
      }

      rows.push({
        parts,
        arrow: arrowToken === '<->' || arrowToken === '&lt;-&gt;' ? '↔' : '→'
      });
    });

    const flowHtml = rows.length > 0
      ? `<div class="figure-flow">${rows.map(row => `<div class="figure-flow-row">${row.parts.map((part, index) => `<span class="figure-node">${part}</span>${index < row.parts.length - 1 ? `<span class="figure-arrow" aria-hidden="true">${row.arrow}</span>` : ''}`).join('')}</div>`).join('')}</div>`
      : '';

    const captionHtml = captions.length > 0
      ? `<div class="figure-caption">${captions.map(line => `<p>${line}</p>`).join('')}</div>`
      : '';

    return `<div class="figure-block"><div class="figure-meta">FIGURE</div><h3 class="figure-title">${title}</h3>${flowHtml}${captionHtml}</div>`;
  });
}

function renderTextbookMarkdown(markdown, units = getUnits()) {
  const safeMarkdown = escapeHtml(typeof markdown === 'string' ? markdown : '');
  const withFigures = preprocessFigureBlocks(safeMarkdown);
  return marked.parse(preprocessWikiLinks(withFigures, units));
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
