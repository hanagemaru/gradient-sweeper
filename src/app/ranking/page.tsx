"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GameMode, Difficulty } from "@/types/game";
import { PixelMessage, PixelPanel, PixelScene } from "@/components/ui/PixelUI";
import { RankingPanel } from "./RankingPanel";

function RankingLoading() {
  return (
    <PixelScene width="wide">
      <PixelPanel title="RANKING">
        <PixelMessage>Loading...</PixelMessage>
      </PixelPanel>
    </PixelScene>
  );
}

/**
 * ランキングのフルページ版。
 *
 * 通常の導線（ホームのボタン、スコア登録後）は `RankingOverlay` に移ったため、
 * こちらは直接URLアクセスと、`?mode=` 付きURLの共有のためのページとして残している。
 * 中身は `RankingPanel` をオーバーレイと共有している。
 */
function RankingContent() {
  const searchParams = useSearchParams();

  const initialMode = (searchParams.get("mode") as GameMode) || "endless";
  const initialDifficulty = searchParams.get("difficulty") as Difficulty | null;

  return (
    <PixelScene width="wide">
      <RankingPanel
        initialMode={initialMode}
        initialDifficulty={initialDifficulty ?? undefined}
        backHref="/"
      />
    </PixelScene>
  );
}

export default function RankingPage() {
  return (
    <Suspense fallback={<RankingLoading />}>
      <RankingContent />
    </Suspense>
  );
}
