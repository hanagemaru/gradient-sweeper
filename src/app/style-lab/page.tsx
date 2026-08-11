import Image from "next/image";
import Link from "next/link";
import styles from "./style-lab.module.css";

type TileKind = "snow" | "flag" | "ice";
type IceTone = "clear" | "red" | "blue" | "mix";

interface TileSpec {
  kind: TileKind;
  tone?: IceTone;
  level?: 0 | 1 | 2 | 3 | 4;
  variant?: 1 | 2 | 3;
}

const BOARD_PATTERN = [
  ["s1", "s2", "s3", "r1", "r2", "r4", "s2", "s1", "s3"],
  ["s3", "r1", "r1", "r2", "r3", "r4", "r4", "s1", "f2"],
  ["s2", "s1", "r1", "r2", "r2", "r3", "r4", "r4", "s1"],
  ["s1", "m1", "m1", "m1", "r1", "m2", "m3", "r3", "r4"],
  ["s3", "s2", "m1", "m2", "m2", "m3", "m3", "m4", "m4"],
  ["f1", "s3", "b1", "b1", "b1", "b2", "b3", "b3", "b4"],
  ["b1", "b1", "b1", "b2", "b2", "b3", "s1", "s3", "s2"],
  ["b2", "b2", "b2", "b3", "b3", "b4", "s2", "s1", "s3"],
  ["f3", "s1", "b3", "b3", "b3", "b4", "s2", "f2", "s3"],
] as const;

function parseTile(token: string): TileSpec {
  const level = Number(token.slice(1)) as 1 | 2 | 3 | 4;
  const variant = Math.min(3, level) as 1 | 2 | 3;

  if (token.startsWith("s")) return { kind: "snow", variant };
  if (token.startsWith("f")) return { kind: "flag", variant };
  if (token.startsWith("r")) return { kind: "ice", tone: "red", level, variant };
  if (token.startsWith("b")) return { kind: "ice", tone: "blue", level, variant };
  return { kind: "ice", tone: "mix", level, variant };
}

function getTileAsset(spec: TileSpec): string {
  const base = "/assets/frostbound/tiles-v5";
  const variant = spec.variant ?? 1;

  if (spec.kind === "snow") return `${base}/snow-${variant}.png`;
  if (spec.kind === "flag") return `${base}/snow-${variant}.png`;
  if (spec.tone === "clear") return `${base}/ice-clear-${variant === 2 ? 2 : 1}.png`;

  const tone = spec.tone ?? "mix";
  const level = Math.max(1, Math.min(4, spec.level ?? 1));
  return `${base}/ice-${tone}-${level}.png`;
}

function Tile({
  spec,
  label,
  castShadow = false,
}: {
  spec: TileSpec;
  label?: string;
  castShadow?: boolean;
}) {
  const covered = spec.kind !== "ice";
  const classNames = [
    styles.tile,
    covered ? styles.coveredTile : styles.openedTile,
  ].join(" ");

  return (
    <div className={classNames} title={label}>
      {covered && castShadow && <span className={styles.snowCastShadow} aria-hidden="true" />}
      {covered && (
        <Image
          src="/assets/frostbound/tiles-v5/snow-underlay.png"
          alt=""
          width={36}
          height={38}
          className={styles.snowUnderlay}
          draggable={false}
          unoptimized
        />
      )}
      <Image
        src={getTileAsset(spec)}
        alt=""
        width={36}
        height={covered ? 38 : 36}
        className={styles.tileImage}
        draggable={false}
        unoptimized
      />
      {spec.kind === "flag" && (
        <Image
          src="/assets/frostbound/tiles-v5/flag-overlay.png"
          alt=""
          width={18}
          height={22}
          className={styles.flagOverlay}
          draggable={false}
          unoptimized
        />
      )}
      {label && <span className={styles.tileLabel}>{label}</span>}
    </div>
  );
}

function StatusCard({ icon, label, value }: {
  icon: "time" | "red" | "blue" | "flags";
  label: string;
  value: string;
}) {
  return (
    <div className={styles.statusCard}>
      <span className={`${styles.statusIcon} ${styles[`${icon}Icon`]}`} aria-hidden="true" />
      <span className={styles.statusCopy}>
        <span className={styles.statusLabel}>{label}</span>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

const SAMPLE_TILES: Array<{ spec: TileSpec; label: string }> = [
  { spec: { kind: "ice", tone: "clear", level: 0, variant: 1 }, label: "0" },
  { spec: { kind: "ice", tone: "red", level: 1, variant: 2 }, label: "R1" },
  { spec: { kind: "ice", tone: "red", level: 4, variant: 3 }, label: "R4" },
  { spec: { kind: "ice", tone: "mix", level: 2, variant: 1 }, label: "M2" },
  { spec: { kind: "ice", tone: "mix", level: 4, variant: 2 }, label: "M4" },
  { spec: { kind: "ice", tone: "blue", level: 1, variant: 3 }, label: "B1" },
  { spec: { kind: "ice", tone: "blue", level: 4, variant: 1 }, label: "B4" },
];

export default function StyleLabPage() {
  return (
    <main className={styles.page}>
      <div className={styles.aurora} aria-hidden="true" />
      <div className={`${styles.crystalCluster} ${styles.crystalLeft}`} aria-hidden="true">
        <i /><i /><i />
      </div>
      <div className={`${styles.crystalCluster} ${styles.crystalRight}`} aria-hidden="true">
        <i /><i /><i />
      </div>

      <section className={styles.gameShell} aria-label="雪と氷テーマの見本画面">
        <header className={styles.hud}>
          <div className={styles.hudTitle}>
            <span className={styles.snowflake}>❄</span>
            <span>
              <strong>GRADIENT GLACIER</strong>
              <small>FROSTBOUND FIELD</small>
            </span>
            <span className={styles.gear} aria-hidden="true">⚙</span>
          </div>

          <div className={styles.statusGrid}>
            <StatusCard icon="time" label="TIME" value="01:32" />
            <StatusCard icon="red" label="RED" value="10" />
            <StatusCard icon="blue" label="BLUE" value="10" />
            <StatusCard icon="flags" label="FLAGS" value="04/20" />
          </div>
        </header>

        <div className={styles.boardFrame}>
          <div className={styles.board}>
            {BOARD_PATTERN.flatMap((row, rowIndex) =>
              row.map((token, colIndex) => (
                <Tile
                  key={`${rowIndex}-${colIndex}`}
                  spec={parseTile(token)}
                  castShadow={rowIndex < BOARD_PATTERN.length - 1}
                />
              )),
            )}
          </div>
        </div>

        <p className={styles.boardHint}>
          雪を掘ると、赤と青の気配が氷面いっぱいに広がります
        </p>

        <div className={styles.controls}>
          <div className={styles.controlButton}>
            <span className={styles.largeFlag}><span className={styles.flagIcon} /></span>
            <small>FLAG</small>
          </div>
          <div className={styles.controlButton}>
            <span className={styles.pauseIcon}><i /><i /></span>
            <small>PAUSE</small>
          </div>
        </div>

        <section className={styles.palettePanel} aria-labelledby="palette-title">
          <div className={styles.sectionHeading}>
            <span id="palette-title">ICE COLOR MAP</span>
            <small>36px native pixel sprites</small>
          </div>
          <div className={styles.sampleRow}>
            {SAMPLE_TILES.map(({ spec, label }) => (
              <Tile key={label} spec={spec} label={label} />
            ))}
          </div>
          <div className={styles.legend}>
            <span><i className={styles.legendRed} />赤が多い</span>
            <span><i className={styles.legendMix} />赤青混合</span>
            <span><i className={styles.legendBlue} />青が多い</span>
          </div>
          <Link href="/style-lab/color-map" className={styles.colorMapLink}>
            隣接数との対応を全パターン見る →
          </Link>
        </section>

        <Link href="/" className={styles.backLink}>← ホームへ戻る</Link>
      </section>
    </main>
  );
}
