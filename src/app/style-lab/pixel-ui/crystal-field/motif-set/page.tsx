import Link from "next/link";
import styles from "./motif-set.module.css";

const MOTIF_BASE = "/assets/frostbound/motifs-v2";
const CRYSTAL_BASE = "/assets/frostbound/crystals-v2";

type AssetStatus = "keep" | "redraw" | "add";

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
    role: "大きな主役",
    src: `${CRYSTAL_BASE}/cluster-large.png`,
    status: "keep",
  },
  {
    name: "cluster-medium",
    label: "結晶・中",
    role: "縦長の中型",
    src: `${CRYSTAL_BASE}/cluster-medium.png`,
    status: "keep",
  },
  {
    name: "cluster-wide",
    label: "結晶・横長",
    role: "低いシルエット",
    src: `${CRYSTAL_BASE}/cluster-wide.png`,
    status: "keep",
  },
  {
    name: "accent-small",
    label: "結晶・小",
    role: "小さな隙間のアクセント",
    src: `${CRYSTAL_BASE}/accent-small.png`,
    status: "keep",
  },
];

const STATUS_LABEL: Record<AssetStatus, string> = {
  keep: "継続",
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
    <svg className={styles.candidateSvg} viewBox="0 0 48 48" aria-label="縁取りを統一した青いセル案">
      <g shapeRendering="crispEdges">
        <path fill="#155dc0" d="M5 2h38v2h3v38h-3v3H5v-3H2V5h3z" />
        <path fill="#d8efff" d="M7 4h34v2H7zM4 7h2v33H4z" />
        <path fill="#6ba9ed" d="M7 7h34v33H7z" />
        <path fill="#a9d5ff" d="M9 8h30v2H9zM8 10h2v25H8z" />
        <path fill="#2d79d5" d="M8 40h33v2H8zM41 8h2v32h-2z" />
        <path fill="#c6e6ff" d="M13 13h3v3h-3zM29 20h2v2h-2zM20 32h2v2h-2z" />
      </g>
    </svg>
  );
}

function StepCell() {
  return (
    <svg className={styles.candidateSvgWide} viewBox="0 0 72 52" aria-label="段差セル案">
      <g shapeRendering="crispEdges">
        <path fill="#8a3eb5" d="M4 2h40v12h24v34H30V36H2V4h2z" />
        <path fill="#f1c7ff" d="M6 4h36v2H6zM4 6h2v27H4zM44 16h22v2H44z" />
        <path fill="#bd6fd0" d="M7 7h34v26H7zM32 16h33v29H32z" />
        <path fill="#df9deb" d="M9 9h30v2H9zM34 18h29v2H34z" />
        <path fill="#722c9e" d="M7 33h25v2H7zM32 45h33v2H32zM65 18h2v27h-2z" />
        <path fill="#f0c1f7" d="M14 16h3v2h-3zM50 25h3v3h-3zM38 37h2v2h-2z" />
      </g>
    </svg>
  );
}

function SingleCrystal() {
  return (
    <svg className={styles.candidateCrystal} viewBox="0 0 34 48" aria-label="単体クリスタル案">
      <g shapeRendering="crispEdges">
        <path fill="#15509f" d="M16 1h3v3h3v4h3v33h-3v4H11v-3H8V10h3V7h2V4h3z" />
        <path fill="#d8f3ff" d="M16 4h3v3h2v4h-2v28h-7V11h2V7h2z" />
        <path fill="#79c0ef" d="M19 7h2v4h2v28h-4z" />
        <path fill="#2d78c8" d="M12 39h10v3H12zM21 11h2v28h-2z" />
        <path fill="#fff" d="M14 12h2v12h-2z" />
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
            <p>9種類は継続。青い単セルだけ、L字と同じ縁取りへ直します。</p>
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
              <h2>変更する3点</h2>
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
              note="大きなクラスターだけでは埋めづらい、小さな隙間を担当"
              status="add"
            >
              <SingleCrystal />
            </CandidateCard>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.summaryPanel}`}>
          <div className={styles.sectionTitle}>
            <div>
              <span>03</span>
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
              <p>大、中、横長、小、単体</p>
            </div>
            <div>
              <strong>共通ルール</strong>
              <p>光源は左上、影は右下、輪郭密度を統一。配置時は互いに重ねない。</p>
            </div>
          </div>
          <p className={styles.nextStep}>
            この3点を承認後、最終アセットを作り、同じ12種類で「半落ちの散布柄」と
            「ゲームマップ型」を並べます。
          </p>
        </section>
      </div>
    </main>
  );
}
