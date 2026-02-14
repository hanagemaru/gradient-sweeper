/**
 * スコア関連ユーティリティ
 * 
 * 新スコアリングシステム:
 * - エンドレス: セル開放ごとにリアルタイム加算（Reducer内で計算）
 * - タイムアタック: スコア概念なし（タイムのみ）
 * 
 * 旧 calculateScore() は廃止済み。
 */

/**
 * スコアをフォーマットして表示用文字列を返す
 */
export function formatScore(score: number): string {
  return score.toLocaleString();
}
