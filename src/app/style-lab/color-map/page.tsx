import fs from "node:fs";
import path from "node:path";
import { getIceAsset } from "@/lib/tile-assets";
import { GRID_SIZE } from "@/types/game";
import { ColorMapExplorer, type AdjacencyState } from "./ColorMapExplorer";

export const metadata = {
  title: "色マッピング検証 | Gradient Sweeper",
};

function assetName(assetPath: string): string {
  return path.basename(assetPath, ".png");
}

/**
 * 隣接する赤・青の爆弾数から選ばれるタイルの全パターン。
 *
 * 表はハードコードせず、本番と同じ `getIceAsset()` を総当たりで呼んで導出する。
 * 写像を変更したらこのページの表示も自動で追従する。
 */
function deriveStates(): AdjacencyState[] {
  const states: AdjacencyState[] = [];

  // 9x9 盤面では 1 セルの隣接セルは最大 8。赤 + 青 <= 8 の組み合わせのみ起こりうる。
  for (let red = 0; red <= 8; red += 1) {
    for (let blue = 0; blue <= 8 - red; blue += 1) {
      // row/col は ice-clear のバリエーション選択にしか影響しない。
      // 意味の比較が目的なので、ここでは代表として原点のタイルを使う。
      states.push({ red, blue, asset: assetName(getIceAsset(red, blue, 0, 0)) });
    }
  }

  return states;
}

/**
 * 盤面上で実際に描画されうるタイルの集合。
 *
 * `ice-clear` は隣接数ではなく座標でバリエーションが決まるため、
 * 隣接数だけを総当たりすると `ice-clear-2` を取りこぼす。
 * 盤面の全座標を含めて回すことで、決め打ちなしに正しい集合が得られる。
 */
function collectRenderableAssets(): Set<string> {
  const renderable = new Set<string>();

  for (let red = 0; red <= 8; red += 1) {
    for (let blue = 0; blue <= 8 - red; blue += 1) {
      for (let row = 0; row < GRID_SIZE; row += 1) {
        for (let col = 0; col < GRID_SIZE; col += 1) {
          renderable.add(assetName(getIceAsset(red, blue, row, col)));
        }
      }
    }
  }

  return renderable;
}

/** `public/` に存在する氷タイルの実ファイル一覧 */
function readIceAssets(): string[] {
  const dir = path.join(process.cwd(), "public/assets/frostbound/tiles-v5");

  return fs
    .readdirSync(dir)
    .filter((file) => file.startsWith("ice-") && file.endsWith(".png"))
    .map((file) => assetName(file))
    .sort();
}

export default function ColorMapPage() {
  const renderable = collectRenderableAssets();
  const unusedAssets = readIceAssets().filter((asset) => !renderable.has(asset));

  return <ColorMapExplorer states={deriveStates()} unusedAssets={unusedAssets} />;
}
