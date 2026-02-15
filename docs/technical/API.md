# API仕様

## 概要

すべてのAPIはNext.jsのAPI Routes（App Router）で実装する。
クライアントからSupabaseへの直接アクセスは禁止し、必ずAPI経由とする。

---

## エンドポイント一覧

| メソッド | パス | 説明 |
|----------|------|------|
| POST | /api/score | スコア登録 |
| GET | /api/leaderboard | ランキング取得 |

---

## POST /api/score

スコアを登録する。

### リクエスト

```typescript
// Content-Type: application/json
interface ScoreRequest {
  mode: 'endless' | 'ta';
  difficulty?: 'easy' | 'mid' | 'hard';  // TAの場合必須
  // Endless用
  score?: number;                         // Endlessの場合必須（クライアント算出スコア）
  endless_level?: number;                 // Endlessの場合必須
  // TA用
  time_ms?: number;                       // TAの場合必須（プレイ時間ミリ秒）
  penalty_ms?: number;                    // TA用（復活ペナルティ合計、省略時0）
  // 共通
  miss_count: number;
  revive_count: number;
  player_name?: string;                   // 任意（最大50文字）
}
```

### レスポンス

#### 成功時 (201 Created)

```typescript
interface ScoreResponse {
  success: true;
  id: string;  // 登録されたスコアのUUID
}
```

#### エラー時 (400 Bad Request)

```typescript
interface ErrorResponse {
  success: false;
  error: string;
}
```

### バリデーション

| 項目 | ルール |
|------|--------|
| mode | 'endless' または 'ta' |
| difficulty | TAの場合必須、'easy'/'mid'/'hard' |
| score | Endlessの場合必須、0以上 |
| endless_level | Endlessの場合必須、1以上 |
| time_ms | TAの場合必須、0以上、86400000以下（24時間） |
| penalty_ms | TA用、省略可、0以上 |
| miss_count | 0以上 |
| revive_count | 0以上 |
| player_name | 任意、50文字以内 |

### レート制限

- IP単位で1分あたり10回まで
- 超過時: 429 Too Many Requests

### 実装例

```typescript
// app/api/score/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // バリデーション
  if (!isValidScore(body)) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }

  // レート制限チェック
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: 'Rate limited' },
      { status: 429 }
    );
  }

  // スコア計算
  // Endless: クライアントから受け取った score をそのまま使用
  // TA: 最終タイム = time_ms + penalty_ms をスコアとして保存
  let dbScore: number;
  if (body.mode === 'endless') {
    dbScore = body.score!;
  } else {
    dbScore = (body.time_ms || 0) + (body.penalty_ms || 0);
  }

  // DB登録
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scores')
    .insert({
      mode: body.mode,
      difficulty: body.mode === 'ta' ? body.difficulty : null,
      time_ms: body.mode === 'ta' ? body.time_ms : null,
      penalty_ms: body.penalty_ms || null,
      endless_level: body.mode === 'endless' ? body.endless_level : null,
      miss_count: body.miss_count,
      revive_count: body.revive_count,
      player_name: body.player_name || null,
      score: dbScore,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: 'Database error' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, id: data.id },
    { status: 201 }
  );
}
```

---

## GET /api/leaderboard

ランキングを取得する。

### クエリパラメータ

| パラメータ | 必須 | 説明 |
|------------|------|------|
| mode | Yes | 'endless' または 'ta' |
| difficulty | TAの場合 | 'easy', 'mid', 'hard' |

### リクエスト例

```
GET /api/leaderboard?mode=endless
GET /api/leaderboard?mode=ta&difficulty=hard
```

### レスポンス

#### 成功時 (200 OK)

```typescript
interface LeaderboardResponse {
  success: true;
  data: LeaderboardEntry[];
}

interface LeaderboardEntry {
  rank: number;
  player_name?: string;
  score: number;
  time_ms: number;
  endless_level?: number;  // Endlessのみ
  miss_count: number;
  revive_count: number;
  created_at: string;      // ISO 8601形式
}
```

#### エラー時 (400 Bad Request)

```typescript
interface ErrorResponse {
  success: false;
  error: string;
}
```

### ソート順

| モード | ソート | 備考 |
|--------|--------|------|
| Endless | score DESC | 高スコアが上位 |
| Time Attack | score ASC | scoreに最終タイム(ms)を格納。短タイムが上位 |

### 実装例

```typescript
// app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const difficulty = searchParams.get('difficulty');
  
  // バリデーション
  if (!mode || !['endless', 'ta'].includes(mode)) {
    return NextResponse.json(
      { success: false, error: 'Invalid mode' },
      { status: 400 }
    );
  }
  
  if (mode === 'ta' && (!difficulty || !['easy', 'mid', 'hard'].includes(difficulty))) {
    return NextResponse.json(
      { success: false, error: 'Difficulty required for TA mode' },
      { status: 400 }
    );
  }
  
  const supabase = createClient();

  // Endless: スコア降順（高スコアが上位）
  // TA: スコア昇順（短タイムが上位。scoreには最終タイム(ms)が格納されている）
  const ascending = mode === 'ta';

  let query = supabase
    .from('scores')
    .select('player_name, score, time_ms, penalty_ms, endless_level, miss_count, revive_count, created_at')
    .eq('mode', mode)
    .order('score', { ascending })
    .limit(100);

  if (mode === 'ta') {
    query = query.eq('difficulty', difficulty);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { success: false, error: 'Database error' },
      { status: 500 }
    );
  }

  // rankを付与
  const rankedData = (data || []).map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));

  return NextResponse.json({ success: true, data: rankedData });
}
```

---

## エラーコード一覧

| HTTPステータス | 意味 |
|----------------|------|
| 200 | 成功（GET） |
| 201 | 作成成功（POST） |
| 400 | リクエスト不正 |
| 429 | レート制限超過 |
| 500 | サーバーエラー |

---

*最終更新: 2026-02-15*
