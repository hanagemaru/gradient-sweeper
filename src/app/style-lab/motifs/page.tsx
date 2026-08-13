import Link from "next/link";
import { proposedColor } from "@/lib/ice-colors";
import { MOTIFS, motifAsset } from "@/lib/motifs";
import { maskAssetForTotal } from "@/lib/tile-masks";
import styles from "./motifs.module.css";

export const metadata = {
  title: "背景モチーフの検証 | Gradient Sweeper",
};

/** 装飾に使う色。盤面のパレットからそのまま取る */
const TONES = {
  snow: proposedColor(0, 0).hex,
  blue: proposedColor(0, 6).hex,
  purple: proposedColor(3, 3).hex,
  red: proposedColor(6, 0).hex,
} as const;

type ToneName = keyof typeof TONES;

/** 盤面と同じ「背景色 + マスクを overlay」でモチーフを描く */
function Motif({
  name,
  width,
  height,
  tone,
}: {
  name: string;
  width: number;
  height: number;
  tone: ToneName;
}) {
  const src = motifAsset(name);

  return (
    <span
      className={styles.motif}
      style={{
        width,
        height,
        background: TONES[tone],
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className={styles.motifTexture} draggable={false} />
    </span>
  );
}

/** 比較用の盤面タイル。実際のゲームと同じ描き方 */
function BoardTile({ red, blue }: { red: number; blue: number }) {
  const color = proposedColor(red, blue);
  const mask = maskAssetForTotal(red + blue);

  return (
    <span
      className={styles.tile}
      style={{ width: 36, height: 36, background: color.hex }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mask} alt="" className={styles.tileTexture} draggable={false} />
    </span>
  );
}

export default function MotifsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.panel}>
          <h1>背景モチーフの検証</h1>
          <p className={styles.note}>
            背景装飾を、既存タイルの<strong>拡大ではなく生成</strong>で作った結果です。
            拡大すると1ドットが数px角になり、盤面よりザラつきが粗くなって
            画面内でドットの大きさが揃わなくなります。
            ここでは最初から表示サイズぶんのドット数で描いています。
          </p>
        </header>

        <section className={styles.panel}>
          <h2>1. 盤面タイルとの粒の比較</h2>
          <p className={styles.note}>
            左が実際の盤面タイル（36px）、右が生成したモチーフ。
            <strong>縁の太さ・粒の細かさが同じなら成功</strong>です。
            角の丸みだけは図形の大きさに応じて変えています。
            線の太さは「ドットの粒」ですが、角の丸みは「形」なので性質が違うためです。
          </p>

          <div className={styles.compareRow}>
            <div className={styles.compareItem}>
              <div className={styles.swatchBox}>
                <BoardTile red={6} blue={0} />
              </div>
              <span>盤面タイル 36px</span>
            </div>
            <div className={styles.compareItem}>
              <div className={styles.swatchBox}>
                <Motif name="square-sm" width={84} height={84} tone="red" />
              </div>
              <span>モチーフ 84px</span>
            </div>
            <div className={styles.compareItem}>
              <div className={styles.swatchBox}>
                <Motif name="square-lg" width={168} height={168} tone="red" />
              </div>
              <span>モチーフ 168px</span>
            </div>
          </div>

          <p className={styles.note}>
            以下は<strong>等倍のまま隣接させた</strong>もの。
            拡大表示するとマスクが補間されて輪郭が鈍り、比較になりません。
            縁の線の太さと粒の細かさが、盤面タイルとモチーフで同じであることを確認してください。
          </p>

          <div className={styles.adjacentRow}>
            <BoardTile red={6} blue={0} />
            <BoardTile red={6} blue={0} />
            <Motif name="square-sm" width={84} height={84} tone="red" />
            <BoardTile red={0} blue={6} />
            <Motif name="square-md" width={120} height={120} tone="blue" />
          </div>
        </section>

        <section className={styles.panel}>
          <h2>2. 生成した形</h2>
          <p className={styles.note}>
            正方形・長方形・L字。大きさは違っても縁の文法は共通です。
          </p>
          <div className={styles.shapeGrid}>
            {MOTIFS.map((motif, index) => (
              <div key={motif.name} className={styles.shapeItem}>
                <Motif
                  name={motif.name}
                  width={motif.width}
                  height={motif.height}
                  tone={(["snow", "blue", "purple", "red"] as ToneName[])[index % 4]}
                />
                <span>
                  {motif.name} {motif.width}×{motif.height}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <h2>3. 色替え</h2>
          <p className={styles.note}>
            色は <code>src/lib/ice-colors.ts</code> のパレットをそのまま当てています。
            アセットは1枚で、色はコード側で決まります。
          </p>
          <div className={styles.toneRow}>
            {(Object.keys(TONES) as ToneName[]).map((tone) => (
              <div key={tone} className={styles.shapeItem}>
                <Motif name="square-md" width={120} height={120} tone={tone} />
                <span>{tone}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <h2>4. 重なりと影</h2>
          <p className={styles.note}>
            光源は左上、影は右下。影はぼかさずハードなピクセル影にしています。
          </p>
          <div className={styles.scene}>
            <span className={styles.place} style={{ left: 0, top: 0 }}>
              <Motif name="rect-wide" width={192} height={108} tone="snow" />
            </span>
            <span className={styles.place} style={{ left: 150, top: 60 }}>
              <Motif name="l-shape" width={180} height={180} tone="blue" />
            </span>
            <span className={styles.place} style={{ left: 60, top: 190 }}>
              <Motif name="square-md" width={120} height={120} tone="purple" />
            </span>
            <span className={styles.place} style={{ left: 290, top: 20 }}>
              <Motif name="square-sm" width={84} height={84} tone="red" />
            </span>
          </div>
        </section>

        <div className={styles.links}>
          <Link href="/style-lab" className={styles.backLink}>
            ← スタイルラボ
          </Link>
        </div>
      </div>
    </main>
  );
}
