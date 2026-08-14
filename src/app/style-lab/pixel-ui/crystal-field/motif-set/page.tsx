import Link from "next/link";
import styles from "./motif-set.module.css";

const MOTIF_BASE = "/assets/frostbound/motifs-v2";
const CRYSTAL_BASE = "/assets/frostbound/crystals-v2";

type AssetStatus = "keep" | "retouch" | "redraw" | "add";

type AssetSpec = {
  name: string;
  label: string;
  role: string;
  src?: string;
  status: AssetStatus;
};

const CURRENT_ASSETS: AssetSpec[] = [
  {
    name: "cell-covered-large",
    label: "未開封・大",
    role: "大きな面を作る主役",
    src: `${MOTIF_BASE}/cell-covered-large.png`,
    status: "keep",
  },
  {
    name: "cell-covered-medium",
    label: "未開封・中",
    role: "間隔を調整する中型",
    src: `${MOTIF_BASE}/cell-covered-medium.png`,
    status: "keep",
  },
  {
    name: "cell-open-red",
    label: "開封・赤",
    role: "暖色アクセント",
    src: `${MOTIF_BASE}/cell-open-red.png`,
    status: "keep",
  },
  {
    name: "cell-open-blue",
    label: "開封・青",
    role: "縁取りをL字と統一して再制作",
    src: `${MOTIF_BASE}/cell-open-blue.png`,
    status: "redraw",
  },
  {
    name: "cell-open-purple-wide",
    label: "開封・紫横長",
    role: "横方向の流れを作る",
    src: `${MOTIF_BASE}/cell-open-purple-wide.png`,
    status: "keep",
  },
  {
    name: "l-panel-blue",
    label: "L字・青",
    role: "地形らしい大きな変化",
    src: `${MOTIF_BASE}/l-panel-blue.png`,
    status: "keep",
  },
  {
    name: "cluster-large",
    label: "結晶・大",
    role: "輪郭色と面の境界を弱める",
    src: `${CRYSTAL_BASE}/cluster-large.png`,
    status: "retouch",
  },
  {
    name: "cluster-medium",
    label: "結晶・中",
    role: "輪郭色と面の境界を弱める",
    src: `${CRYSTAL_BASE}/cluster-medium.png`,
    status: "retouch",
  },
  {
    name: "cluster-wide",
    label: "結晶・横長",
    role: "輪郭色と面の境界を弱める",
    src: `${CRYSTAL_BASE}/cluster-wide.png`,
    status: "retouch",
  },
  {
    name: "accent-small",
    label: "結晶・小",
    role: "小さすぎるため中小サイズで再制作",
    src: `${CRYSTAL_BASE}/accent-small.png`,
    status: "redraw",
  },
];

const STATUS_LABEL: Record<AssetStatus, string> = {
  keep: "継続",
  retouch: "輪郭調整",
  redraw: "再制作",
  add: "追加候補",
};

function AssetCard({ asset }: { asset: AssetSpec }) {
  return (
    <article className={styles.assetCard}>
      <div className={styles.assetStage}>
        {asset.src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.src} alt="" className={styles.assetImage} draggable={false} />
        )}
      </div>
      <div className={styles.assetCopy}>
        <span className={`${styles.status} ${styles[`status_${asset.status}`]}`}>
          {STATUS_LABEL[asset.status]}
        </span>
        <strong>{asset.label}</strong>
        <small>{asset.role}</small>
      </div>
    </article>
  );
}

function UnifiedBlueCell() {
  return (
    <svg className={styles.candidateSvg} viewBox="0 0 96 96" aria-label="縁取りを統一した青いセル案">
      <g shapeRendering="crispEdges">
        <path fill="#3479c9" d="M13 3h70v2h5v4h3v74h-3v5h-5v3H13v-3H8v-5H5V13h3V8h5z" />
        <path fill="#d9efff" d="M14 5h68v1H14zM10 8h74v1H10zM8 11h1v70H8zM11 8h1v75h-1z" />
        <path fill="#79afe8" d="M13 10h70v73H13z" />
        <path fill="#a9d3f6" d="M14 11h68v1H14zM13 12h1v67h-1z" />
        <path fill="#4f91d5" d="M14 82h69v2H14zM82 12h2v70h-2z" />
        <path fill="#cde8ff" d="M21 20h3v3h-3zM63 31h2v2h-2zM39 68h2v2h-2zM70 62h3v2h-3z" />
      </g>
    </svg>
  );
}

function StepCell() {
  return (
    <svg className={styles.candidateSvgWide} viewBox="0 0 160 112" aria-label="段差セル案">
      <g shapeRendering="crispEdges">
        <path fill="#8847ad" d="M10 3h88v4h5v24h47v4h5v67h-4v5h-5v2H67v-3h-5V78H10v-3H5v-5H3V12h2V7h5z" />
        <path fill="#efcefa" d="M12 5h84v1H12zM8 8h91v1H8zM6 11h1v57H6zM9 9h1v63H9zM103 33h45v1h-45z" />
        <path fill="#bd75cf" d="M11 10h86v65H11zM65 36h84v68H65z" />
        <path fill="#dfa7e8" d="M12 11h84v1H12zM66 37h82v1H66zM11 12h1v59H11zM65 38h1v62H65z" />
        <path fill="#8d4bb0" d="M12 74h53v2H12zM66 103h83v2H66zM148 38h2v65h-2z" />
        <path fill="#f0c8f4" d="M26 25h3v2h-3zM77 51h2v2h-2zM126 61h3v3h-3zM91 89h2v2h-2z" />
      </g>
    </svg>
  );
}

function SingleCrystal() {
  return (
    <svg className={styles.candidateCrystal} viewBox="0 0 64 88" aria-label="単体クリスタル案">
      <g shapeRendering="crispEdges">
        <path fill="#3974af" d="M31 2h3v4h3v4h3v5h3v58h-3v5h-4v4h-4v3H22v-3h-4v-4h-3v-5h-2V18h3v-6h3V8h4V5h4V2z" />
        <path fill="#e4f5ff" d="M29 5h4v4h3v4h3v5h-1v53h-3v5h-3v3H23v-3h-3v-5h-2V19h2v-5h3v-4h3V7h3z" />
        <path fill="#84bee9" d="M33 9h3v4h3v5h2v53h-3v5h-3v3h-3V20z" />
        <path fill="#5c96cc" d="M32 20h1v59h-1zM23 79h12v2H23zM39 19h2v52h-2z" />
        <path fill="#fff" d="M23 18h2v28h-2zM26 13h2v14h-2z" />
      </g>
    </svg>
  );
}

function SmallCrystalCluster() {
  return (
    <svg className={styles.candidateCluster} viewBox="0 0 72 64" aria-label="中小サイズのクリスタル案">
      <g shapeRendering="crispEdges">
        <path fill="#3974af" d="M35 3h3v4h3v5h3v33h8V28h3v-4h4v4h3v25h6v5h-3v3H9v-3H5v-5h8V39h3v-4h4v4h3v7h7V12h2V7h3z" />
        <path fill="#e7f7ff" d="M35 6h2v4h3v4h1v31h-8V13h2zM17 38h2v4h2v11h-6V41h2zM55 28h2v5h2v20h-5V32h1z" />
        <path fill="#7fb9e5" d="M37 10h3v4h2v32h-5zM19 42h2v11h-2zM57 33h2v20h-2z" />
        <path fill="#5b95cb" d="M33 46h9v2h-9zM54 53h5v2h-5zM15 53h6v2h-6z" />
        <path fill="#d9efff" d="M10 55h53v3H10z" />
        <path fill="#82bce7" d="M13 58h50v2H13z" />
      </g>
    </svg>
  );
}

function CandidateCard({
  label,
  note,
  children,
  status,
}: {
  label: string;
  note: string;
  children: React.ReactNode;
  status: "redraw" | "add";
}) {
  return (
    <article className={styles.candidateCard}>
      <div className={styles.candidateStage}>{children}</div>
      <div className={styles.assetCopy}>
        <span className={`${styles.status} ${styles[`status_${status}`]}`}>
          {STATUS_LABEL[status]}
        </span>
        <strong>{label}</strong>
        <small>{note}</small>
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
              半落ちの散布柄とゲームマップ型を、同じ12種類で比較するための事前確認です。
              この段階では背景配置と最終PNGはまだ作りません。
            </p>
          </div>
          <nav className={styles.links}>
            <Link href="/style-lab/pixel-ui/crystal-field">CRYSTAL FIELDへ</Link>
            <Link href="/style-lab/pixel-ui">比較一覧へ</Link>
          </nav>
        </header>

        <section className={styles.panel}>
          <div className={styles.sectionTitle}>
            <div>
              <span>01</span>
              <h2>現在の10種類</h2>
            </div>
            <p>セルは青い単セルを再制作。クリスタル4種は輪郭を調整します。</p>
          </div>
          <div className={styles.assetGrid}>
            {CURRENT_ASSETS.map((asset) => (
              <AssetCard key={asset.name} asset={asset} />
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionTitle}>
            <div>
              <span>02</span>
              <h2>形状を変更する4点</h2>
            </div>
            <p>形の不足を補いながら、両方式で使いやすい役割に絞ります。</p>
          </div>
          <div className={styles.candidateGrid}>
            <CandidateCard
              label="青い単セルを再制作"
              note="L字と同じ1pxの明線・内側線・右下の濃い縁へ統一"
              status="redraw"
            >
              <UnifiedBlueCell />
            </CandidateCard>
            <CandidateCard
              label="段差セルを追加"
              note="行列を崩し、ゲームマップ型では地形のつながりを作る"
              status="add"
            >
              <StepCell />
            </CandidateCard>
            <CandidateCard
              label="単体クリスタルを追加"
              note="表示上1pxの輪郭で作り、セル系より線が強く見えない濃さに調整"
              status="add"
            >
              <SingleCrystal />
            </CandidateCard>
            <CandidateCard
              label="結晶・小を中小サイズへ"
              note="40pxから約72pxへ。背景でも形を認識できる大きさにする"
              status="redraw"
            >
              <SmallCrystalCluster />
            </CandidateCard>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionTitle}>
            <div>
              <span>03</span>
              <h2>クリスタル共通の輪郭調整</h2>
            </div>
            <p>大・中・横長・中小・単体の全5種類へ適用します。</p>
          </div>
          <div className={styles.outlineRule}>
            <div>
              <strong>現在</strong>
              <p>濃い紺の外周と面境界が強く、セルより切り抜いたように見える。</p>
            </div>
            <span aria-hidden="true">→</span>
            <div>
              <strong>修正後</strong>
              <p>外周・面境界とも表示上1px。線色を明るい青へ寄せ、塗りとの明度差も縮める。</p>
            </div>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.summaryPanel}`}>
          <div className={styles.sectionTitle}>
            <div>
              <span>04</span>
              <h2>整理後の共通セット</h2>
            </div>
            <p>セル7種類＋クリスタル5種類＝合計12種類です。</p>
          </div>
          <div className={styles.roleGrid}>
            <div>
              <strong>セル系・7</strong>
              <p>未開封 大／中、赤、青、紫横長、L字、段差</p>
            </div>
            <div>
              <strong>クリスタル系・5</strong>
              <p>大、中、横長、中小、単体</p>
            </div>
            <div>
              <strong>共通ルール</strong>
              <p>光源は左上、影は右下、輪郭密度を統一。配置時は互いに重ねない。</p>
            </div>
          </div>
          <p className={styles.nextStep}>
            この調整を承認後、最終アセットを作り、同じ12種類で「半落ちの散布柄」と
            「ゲームマップ型」を並べます。
          </p>
        </section>
      </div>
    </main>
  );
}
