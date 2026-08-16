import {
  PixelButton,
  PixelButtonGroup,
  PixelLanguageToggle,
  PixelPanel,
} from "@/components/ui/PixelUI";
import {
  BACKGROUND_WORLD,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type BackgroundPlacement,
} from "@/lib/background-world";
import type { LetterboxVariant } from "./variants";
import styles from "./canvas.module.css";

export type WorldData = {
  items: BackgroundPlacement[];
  width: number;
  height: number;
};

const DEFAULT_WORLD: WorldData = {
  items: BACKGROUND_WORLD,
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT,
};

function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(" ");
}

function World({ className, world }: { className: string; world: WorldData }) {
  return (
    <div className={className} style={{ width: world.width, height: world.height }}>
      {world.items.map((p, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${p.name}-${index}`}
          src={`${p.base}/${p.name}.png`}
          alt=""
          draggable={false}
          className={cx(styles.worldImage, styles.bleedImage)}
          style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
        />
      ))}
    </div>
  );
}

/*
 * 固定 390x844 キャンバス＋レターボックスの検証コンポーネント。
 * .canvas に transform:scale() を掛けると、そこが position:fixed な子の
 * containing block になる（CSS仕様）。これで .backdrop の inset:0 が
 * 実ビューポートではなくこのキャンバスの矩形を基準にする。
 */
export function CanvasHome({
  variant,
  tall = false,
  world = DEFAULT_WORLD,
}: {
  variant: LetterboxVariant;
  tall?: boolean;
  world?: WorldData;
}) {
  return (
    <div className={cx(styles.stage, styles[variant.stageClass])}>
      {variant.bleed && <World className={styles.bleedWorld} world={world} />}

      <div className={cx(styles.canvas, variant.framed && styles.canvasFramed)}>
        <div className={styles.backdrop} aria-hidden="true">
          <World className={styles.world} world={world} />
        </div>

        <div className={styles.scroll} data-testid="canvas-scroll">
          <main className={styles.content}>
            <div className={styles.stack}>
              <PixelPanel title="GRADIENT SWEEPER">
                <PixelButtonGroup>
                  <PixelButton href="#" size="lg" block leading="▶">
                    エンドレス
                  </PixelButton>
                  <PixelButton href="#" size="lg" block leading="▶">
                    タイムアタック
                  </PixelButton>
                  <PixelButton href="#" size="lg" block leading="▶">
                    ランキング
                  </PixelButton>
                  {tall &&
                    Array.from({ length: 16 }, (_, i) => (
                      <PixelButton key={i} href="#" size="md" block variant="ghost">
                        （キャンバス高さを超えるダミー項目 {i + 1}）
                      </PixelButton>
                    ))}
                </PixelButtonGroup>
              </PixelPanel>
              {/* 本番の PixelScene と同じく .stack の末尾に置く */}
              <PixelLanguageToggle />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
