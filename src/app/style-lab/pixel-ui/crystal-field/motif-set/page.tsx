import Link from "next/link";
import styles from "./motif-set.module.css";

const MOTIF_BASE = "/assets/frostbound/motifs-v2";
const CRYSTAL_BASE = "/assets/frostbound/crystals-v2";
const CANDIDATE_BASE = "/assets/frostbound/motif-candidates-v1";

type AssetStatus = "keep" | "retouch" | "redraw" | "add";

type AssetSpec = {
  name: string;
  label: string;
  role: string;
  src: string;
  status: AssetStatus;
};

const CURRENT_ASSETS: AssetSpec[] = [
  { name: "cell-covered-large", label: "未開封・大", role: "雪面と厚みの基準", src: `${MOTIF_BASE}/cell-covered-large.png`, status: "keep" },
  { name: "cell-covered-medium", label: "未開封・中", role: "雪面と厚みの基準", src: `${MOTIF_BASE}/cell-covered-medium.png`, status: "keep" },
  { name: "cell-open-red", label: "開封・赤", role: "暖色アクセント", src: `${MOTIF_BASE}/cell-open-red.png`, status: "keep" },
  { name: "cell-open-blue", label: "開封・青", role: "造形を保って縁だけ調整", src: `${MOTIF_BASE}/cell-open-blue.png`, status: "retouch" },
  { name: "cell-open-purple-wide", label: "開封・紫横長", role: "横方向の流れ", src: `${MOTIF_BASE}/cell-open-purple-wide.png`, status: "keep" },
  { name: "l-panel-blue", label: "L字・青", role: "青い縁取りの基準", src: `${MOTIF_BASE}/l-panel-blue.png`, status: "keep" },
  { name: "cluster-large", label: "結晶・大", role: "形と面構成を維持", src: `${CRYSTAL_BASE}/cluster-large.png`, status: "retouch" },
  { name: "cluster-medium", label: "結晶・中", role: "形と面構成を維持", src: `${CRYSTAL_BASE}/cluster-medium.png`, status: "retouch" },
  { name: "cluster-wide", label: "結晶・横長", role: "形と面構成を維持", src: `${CRYSTAL_BASE}/cluster-wide.png`, status: "retouch" },
  { name: "accent-small", label: "結晶・小", role: "40pxでは小さいため置換", src: `${CRYSTAL_BASE}/accent-small.png`, status: "redraw" },
];

const COVERED_ADDITIONS: AssetSpec[] = [
  { name: "cell-covered-wide", label: "未開封・横長", role: "既存の雪面・厚い右下層を横長へ展開", src: `${CANDIDATE_BASE}/cell-covered-wide.png`, status: "add" },
  { name: "cell-covered-l", label: "未開封・L字", role: "正方形の連続を崩す凹形状", src: `${CANDIDATE_BASE}/cell-covered-l.png`, status: "add" },
  { name: "cell-covered-step", label: "未開封・段差", role: "2つの高さを持つ連結形状", src: `${CANDIDATE_BASE}/cell-covered-step.png`, status: "add" },
];

const REBUILT_ASSETS: AssetSpec[] = [
  { name: "cell-open-blue-unified", label: "開封・青／縁調整", role: "L字・青の色段階と1px境界へ合わせる", src: `${CANDIDATE_BASE}/cell-open-blue-unified.png`, status: "retouch" },
  { name: "crystal-cluster-small", label: "結晶・中小／置換", role: "結晶・大を基準に82×69pxで再構成", src: `${CANDIDATE_BASE}/crystal-cluster-small.png`, status: "redraw" },
  { name: "crystal-single", label: "単体クリスタル", role: "結晶・大の縦結晶と同じ面構成・色段階", src: `${CANDIDATE_BASE}/crystal-single.png`, status: "add" },
];

const OUTLINE_PAIRS = [
  { label: "結晶・大", before: `${CRYSTAL_BASE}/cluster-large.png`, after: `${CANDIDATE_BASE}/cluster-large-soft.png` },
  { label: "結晶・中", before: `${CRYSTAL_BASE}/cluster-medium.png`, after: `${CANDIDATE_BASE}/cluster-medium-soft.png` },
  { label: "結晶・横長", before: `${CRYSTAL_BASE}/cluster-wide.png`, after: `${CANDIDATE_BASE}/cluster-wide-soft.png` },
];

const STATUS_LABEL: Record<AssetStatus, string> = {
  keep: "継続",
  retouch: "既存ベース調整",
  redraw: "既存ベース再構成",
  add: "追加候補",
};

function PixelImage({ src, className = "" }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`${styles.assetImage} ${className}`} draggable={false} />
  );
}

function AssetCard({ asset }: { asset: AssetSpec }) {
  return (
    <article className={styles.assetCard}>
      <div className={styles.assetStage}><PixelImage src={asset.src} /></div>
      <div className={styles.assetCopy}>
        <span className={`${styles.status} ${styles[`status_${asset.status}`]}`}>{STATUS_LABEL[asset.status]}</span>
        <strong>{asset.label}</strong>
        <small>{asset.role}</small>
      </div>
    </article>
  );
}

export const metadata = {
  title: "共通モチーフ整理案 | CRYSTAL FIELD",
  robots: { index: false, follow: false },
};

export default function MotifSetPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>CRYSTAL FIELD / ASSET REVIEW</p>
            <h1>共通モチーフの追加・整理案</h1>
            <p>
              新案を別の絵柄で描き起こさず、既存PNGのパレット・1px境界・雪面の粒・右下の厚みを基準に再整理しました。
              この段階では背景配置と本番アセットへの反映は行いません。
            </p>
          </div>
          <nav className={styles.links}>
            <Link href="/style-lab/pixel-ui/crystal-field">CRYSTAL FIELDへ</Link>
            <Link href="/style-lab/pixel-ui">比較一覧へ</Link>
          </nav>
        </header>

        <section className={styles.panel}>
          <div className={styles.sectionTitle}>
            <div><span>01</span><h2>既存10種類と基準</h2></div>
            <p>新規形状にも、ここにある粒度と立体表現を引き継ぎます。</p>
          </div>
          <div className={styles.assetGrid}>
            {CURRENT_ASSETS.map((asset) => <AssetCard key={asset.name} asset={asset} />)}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionTitle}>
            <div><span>02</span><h2>未開封セルの形状追加</h2></div>
            <p>正方形だけにせず、横長・L字・段差を同じ雪セルとして追加します。</p>
          </div>
          <div className={styles.coveredReference}>
            <div><PixelImage src={`${MOTIF_BASE}/cell-covered-large.png`} /><small>基準：未開封・大</small></div>
            <span aria-hidden="true">→</span>
            <p>雪面の細かな粒、崩した雪際、右下へ張り出す青い層を各形状へ移植</p>
          </div>
          <div className={styles.candidateGridThree}>
            {COVERED_ADDITIONS.map((asset) => <AssetCard key={asset.name} asset={asset} />)}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionTitle}>
            <div><span>03</span><h2>既存ベースの調整・再構成</h2></div>
            <p>SVGの別案は撤回し、実PNGで既存の造形を引き継ぎました。</p>
          </div>
          <div className={styles.candidateGridThree}>
            {REBUILT_ASSETS.map((asset) => <AssetCard key={asset.name} asset={asset} />)}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionTitle}>
            <div><span>04</span><h2>クリスタル輪郭の実画像比較</h2></div>
            <p>形と内部の塗りは変えず、濃紺の輪郭だけを既存の青へ寄せます。</p>
          </div>
          <div className={styles.outlineGrid}>
            {OUTLINE_PAIRS.map((pair) => (
              <article className={styles.outlineCard} key={pair.label}>
                <strong>{pair.label}</strong>
                <div className={styles.outlineImages}>
                  <div><PixelImage src={pair.before} /><small>現在</small></div>
                  <span aria-hidden="true">→</span>
                  <div><PixelImage src={pair.after} /><small>調整後</small></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.summaryPanel}`}>
          <div className={styles.sectionTitle}>
            <div><span>05</span><h2>整理後の候補セット</h2></div>
            <p>セル9種類＋クリスタル5種類＝候補14種類です。</p>
          </div>
          <div className={styles.roleGrid}>
            <div><strong>セル系・9</strong><p>未開封 大／中／横長／L字／段差、開封 赤／青／紫横長、L字・青</p></div>
            <div><strong>クリスタル系・5</strong><p>大、中、横長、中小、単体</p></div>
            <div><strong>配置時の共通ルール</strong><p>総柄として画面外まで続け、モチーフ同士を重ねず、メニュー位置の空白も作らない。</p></div>
          </div>
          <p className={styles.nextStep}>
            このアセット構成の承認後、同じ候補セットから「半落ちの散布柄」と「ゲームマップ型」の2方式を比較ページに実装します。
          </p>
        </section>
      </div>
    </main>
  );
}
