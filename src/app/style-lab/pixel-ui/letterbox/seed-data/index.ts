import * as seed1 from "./seed-1";
import * as seed2 from "./seed-2";
import * as seed3 from "./seed-3";
import * as seed4 from "./seed-4";
import * as seed5 from "./seed-5";
import type { WorldData } from "../CanvasHome";

function toWorld(mod: typeof seed1): WorldData {
  return { items: mod.BACKGROUND_WORLD, width: mod.WORLD_WIDTH, height: mod.WORLD_HEIGHT };
}

export const SEEDS: Array<{ id: string; label: string; world: WorldData }> = [
  { id: "1", label: "シード1", world: toWorld(seed1) },
  { id: "2", label: "シード2", world: toWorld(seed2) },
  { id: "3", label: "シード3", world: toWorld(seed3) },
  { id: "4", label: "シード4", world: toWorld(seed4) },
  { id: "5", label: "シード5", world: toWorld(seed5) },
];
