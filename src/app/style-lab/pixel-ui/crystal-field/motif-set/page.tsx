import Link from "next/link";
import styles from "./motif-set.module.css";

const MOTIF_BASE = "/assets/frostbound/motifs-v2";
const AUTOTILE_BASE = "/assets/frostbound/cell-autotile-v1";
const CRYSTAL_BASE = "/assets/frostbound/crystals-v2";
const CRYSTAL_CANDIDATE_BASE = "/assets/frostbound/motif-candidates-v1";

type AssetSpec = {
  name: string;
  label: string;
  role: string;
  src: string;
  grid?: string[];
};

const SHAPES = [
  { name: "square", label: "正方形", grid: ["11", "11"] },
  { name: "wide", label: "横長", grid: ["111", "111"] },
  { name: "tall", label: "縦長", grid: ["11", "11", "11"] },
  { name: "l", label: "L字", grid: ["110", "110", "111"] },
  { name: "step", label: "段差", grid: ["110", "111"] },
];

const COVERED_ASSETS: AssetSpec[] = SHAPES.map((shape) => ({
  ...shape,
  role: shape.name === "square" ? "基準形を再現する精度確認" : "同じ雪面部品から自動生成",
  src: `${AUTOTILE_BASE}/covered-${shape.name}.png`,
}));

const OPEN_ASSETS: AssetSpec[] = SHAPES.map((shape) => ({
  ...shape,
  role: shape.name === "l" ? "既存L字と同じ規則の再現確認" : "L字・青の部品から自動生成",
  src: `${AUTOTILE_BASE}/open-blue-${shape.name}.png`,
}));

const OUTLINE_PAIRS = [
  { label: "結晶・大", before: `${CRYSTAL_BASE}/cluster-large.png`, after: `${CRYSTAL_CANDIDATE_BASE}/cluster-large-soft.png` },
  { label: "結晶・中", before: `${CRYSTAL_BASE}/cluster-medium.png`, after: `${CRYSTAL_CANDIDATE_BASE}/cluster-medium-soft.png` },
  { label: "結晶・横長", before: `${CRYSTAL_BASE}/cluster-wide.png`, after: `${CRYSTAL_CANDIDATE_BASE}/cluster-wide-soft.png` },
];

function PixelImage({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={styles.assetImage} draggable={false} />
  );
}

function GridShape({ grid }: { grid: string[] }) {
  return (
    <span className={styles.gridShape} aria-label={grid.join("、")}>
      {grid.map((row, rowIndex) => (
        <span key={`${row}-${rowIndex}`}>
          {[...row].map((cell, columnIndex) => (
            <i className={cell === "1" ? styles.gridOn : undefined} key={`${cell}-${columnIndex}`} />
          ))}
        </span>
      ))}
    </span>
  );
}

function AssetCard({ asset }: { asset: AssetSpec }) {
  return (
    <article className={styles.assetCard}>
      <div className={styles.assetStage}><PixelImage src={asset.src} /></div>
      <div className={styles.assetCopy}>
        <div className={styles.assetHeading}>
          {asset.grid && <GridShape grid={asset.grid} />}
          <strong>{asset.label}</strong>
        </div>
        <small>{asset.role}</small>
      </div>
    </article>
  );
}

function MasterCard({ label, src, note }: { label: string; src: string; note: string }) {
  return (
    <article className={styles.masterCard}>
      <div className={styles.masterStage}><PixelImage src={src} /></div>
      <div>
        <span className={styles.masterBadge}>生成元</span>
        <strong>{label}</strong>
        <p>{note}</p>
      </div>
    </article>
  );
}

export const metadata = {
  title: "セル自動生成方式 | CRYSTAL FIELD",
  robots: { index: false, follow: false },
};

export default function MotifSetPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>CRYSTAL FIELD / AUTOTILE REVIEW</p>
            <h1>既存アセット基準のセル自動生成</h1>
            <p>
              形ごとの描き直しをやめ、既存PNGから抽出した縁・角・表面粒・右下層をコードで組み立てます。
              形状追加は0/1の配列変更だけで、画像生成AIや拡大縮小は使いません。
            </p>
          </div>
          <nav className={styles.links}>
            <Link href="/style-lab/pixel-ui/crystal-field">CRYSTAL FIELDへ</Link>
            <Link href="/style-lab/pixel-ui">比較一覧へ</Link>
          </nav>
        </header>

        <section className={styles.panel}>
          <div className={styles.sectionTitle}>
            <div><span>01</span><h2>世界観の基準にする2点</h2></div>
            <p>新しく絵柄を考えず、この2点をマスターとして使います。</p>
          </div>
          <div className={styles.masterGrid}>
            <MasterCard
              label="未開封・大"
              src={`${MOTIF_BASE}/cell-covered-large.png`}
              note="雪面の粒をピクセル塊のまま抽出。雪際、1px境界、右下へ張り出す青い層も数値化します。"
            />
            <MasterCard
              label="L字・青"
              src={`${MOTIF_BASE}/l-panel-blue.png`}
              note="開封面の色段階、粒、凸角・凹角、上下左右の縁、右下層を開封セルの共通部品にします。"
            />
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionTitle}>
            <div><span>02</span><h2>形状指定と生成規則</h2></div>
            <p>白いマスをつなげるだけで、同じ規則を全外周へ自動適用します。</p>
          </div>
          <div className={styles.ruleGrid}>
            <div><strong>形状</strong><p>正方形、横長、縦長、L字、段差を0/1配列で指定。今後も配列を足すだけです。</p></div>
            <div><strong>共通部品</strong><p>上下左右の縁、凸角・凹角、面、右下層を隣接状態から自動選択します。</p></div>
            <div><strong>表面ディテール</strong><p>既存PNGから抽出した粒を、固定シードで再配置。毎回同じ結果になります。</p></div>
            <div><strong>ピクセル密度</strong><p>全処理を実寸1pxで行い、拡大縮小やぼかしを使用しません。</p></div>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionTitle}>
            <div><span>03</span><h2>未開封：同じ生成器で5形状</h2></div>
            <p>特に「未開封・大」の雪面と右下の厚みに寄せた結果です。</p>
          </div>
          <div className={styles.assetGridFive}>
            {COVERED_ASSETS.map((asset) => <AssetCard asset={asset} key={asset.name} />)}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionTitle}>
            <div><span>04</span><h2>開封・青：L字・青ベースの5形状</h2></div>
            <p>段差形状も復活。正方形だけを別方式で描くことはありません。</p>
          </div>
          <div className={styles.assetGridFive}>
            {OPEN_ASSETS.map((asset) => <AssetCard asset={asset} key={asset.name} />)}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionTitle}>
            <div><span>05</span><h2>クリスタル輪郭は前回案を保持</h2></div>
            <p>セル生成方式とは分離し、今回の確認対象を混ぜません。</p>
          </div>
          <div className={styles.outlineGrid}>
            {OUTLINE_PAIRS.map((pair) => (
              <article className={styles.outlineCard} key={pair.label}>
                <strong>{pair.label}</strong>
                <div className={styles.outlineImages}>
                  <div><PixelImage src={pair.before} /><small>現在</small></div>
                  <span aria-hidden="true">→</span>
                  <div><PixelImage src={pair.after} /><small>輪郭調整後</small></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.summaryPanel}`}>
          <div className={styles.sectionTitle}>
            <div><span>06</span><h2>承認後の進め方</h2></div>
            <p>採用形状を選んでから背景配置へ進みます。</p>
          </div>
          <div className={styles.roleGrid}>
            <div><strong>形の追加</strong><p>縦横サイズや0/1配列を追加して、同じ生成器からPNGを書き出します。</p></div>
            <div><strong>色違い</strong><p>形状ロジックは共通のまま、既存の赤・紫パレットへ置換できます。</p></div>
            <div><strong>背景比較</strong><p>承認された形だけで「半落ちの散布柄」と「ゲームマップ型」を作ります。</p></div>
          </div>
          <p className={styles.nextStep}>背景本体と本番アセットは、まだ変更していません。</p>
        </section>
      </div>
    </main>
  );
}
