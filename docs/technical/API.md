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
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: 'Rate limited' },
      { status: 429 }
    );
  }
  
  // DB登録
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scores')
    .insert(body)
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

| モード | ソート |
|--------|--------|
| Endless | score DESC |
| Time Attack | score DESC |

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
  
  let query = supabase
    .from('scores')
    .select('time_ms, endless_level, miss_count, created_at')
    .eq('mode', mode)
    .limit(100);
  
  if (mode === 'endless') {
    query = query.order('endless_level', { ascending: false })
                 .order('time_ms', { ascending: true });
  } else {
    query = query.eq('difficulty', difficulty)
                 .order('time_ms', { ascending: true });
  }
  
  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json(
      { success: false, error: 'Database error' },
      { status: 500 }
    );
  }
  
  // rankを付与
  const rankedData = data.map((entry, index) => ({
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
