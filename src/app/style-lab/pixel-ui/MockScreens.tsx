/*
 * 方向性比較用のモック画面。
 *
 * 3案とも同じマークアップを共有し、渡された CSS Module だけを差し替える。
 * こうしておくと「構造の違い」ではなく「見た目の方向性」だけを比較できる。
 *
 * 各方向性のモジュールは、下で使っているクラス名をすべて定義する契約になっている。
 * このディレクトリは方向性が決まったら丸ごと削除してよい検証用ページ。
 */

export type PixelUiStyles = Readonly<Record<string, string>>;

function cx(...names: Array<string | false | undefined>): string {
  return names.filter(Boolean).join(" ");
}

const RANKING_ROWS = [
  { rank: 1, name: "ゆき", score: "12,480", level: 16 },
  { rank: 2, name: "SNOWDRIFT", score: "10,110", level: 14 },
  { rank: 3, name: "こおり", score: "9,260", level: 13 },
  { rank: 4, name: "Anonymous", score: "7,040", level: 11 },
  { rank: 5, name: "GLACIER", score: "5,880", level: 9 },
];

export function HomeScreen({ s }: { s: PixelUiStyles }) {
  return (
    <div className={s.screen}>
      <div className={s.inner}>
        <header className={s.titleBar}>
          <span className={s.mark} aria-hidden="true">
            ❄
          </span>
          <span className={s.titleWrap}>
            <strong className={s.title}>GRADIENT SWEEPER</strong>
            <small className={s.subtitle}>FROSTBOUND FIELD</small>
          </span>
        </header>

        <nav className={s.menu}>
          <button type="button" className={cx(s.btn, s.primary)}>
            <span className={s.btnIcon} aria-hidden="true">
              ∞
            </span>
            <span className={s.btnLabel}>エンドレス</span>
          </button>
          <button type="button" className={cx(s.btn, s.secondary)}>
            <span className={s.btnIcon} aria-hidden="true">
              ◷
            </span>
            <span className={s.btnLabel}>タイムアタック</span>
          </button>
          <button type="button" className={cx(s.btn, s.tertiary)}>
            <span className={s.btnIcon} aria-hidden="true">
              ★
            </span>
            <span className={s.btnLabel}>ランキング</span>
          </button>
        </nav>

        <div className={s.footRow}>
          <button type="button" className={s.lang}>
            EN
          </button>
        </div>
      </div>
    </div>
  );
}

export function DifficultyScreen({ s }: { s: PixelUiStyles }) {
  const items = [
    { name: "かんたん", bombs: 10 },
    { name: "ふつう", bombs: 20 },
    { name: "むずかしい", bombs: 30 },
  ];

  return (
    <div className={s.screen}>
      <div className={s.inner}>
        <header className={s.titleBar}>
          <span className={s.mark} aria-hidden="true">
            ◷
          </span>
          <span className={s.titleWrap}>
            <strong className={s.title}>タイムアタック</strong>
            <small className={s.subtitle}>SELECT DIFFICULTY</small>
          </span>
        </header>

        <nav className={s.menu}>
          {items.map(({ name, bombs }, i) => (
            <button
              key={name}
              type="button"
              className={cx(s.btn, i === 0 && s.primary, i === 1 && s.secondary, i === 2 && s.tertiary)}
            >
              <span className={s.btnLabel}>{name}</span>
              <span className={s.btnMeta}>爆弾 {bombs}</span>
            </button>
          ))}
        </nav>

        <div className={s.footRow}>
          <button type="button" className={s.back}>
            ← ホームへ
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResultScreen({ s }: { s: PixelUiStyles }) {
  return (
    <div className={s.screen}>
      <div className={s.inner}>
        <header className={s.titleBar}>
          <span className={s.mark} aria-hidden="true">
            ★
          </span>
          <span className={s.titleWrap}>
            <strong className={s.title}>リザルト</strong>
            <small className={s.subtitle}>ENDLESS</small>
          </span>
        </header>

        <section className={s.panel}>
          <ul className={s.rows}>
            <li className={s.row}>
              <span className={s.rowLabel}>到達レベル</span>
              <span className={s.rowValue}>12</span>
            </li>
            <li className={s.row}>
              <span className={s.rowLabel}>ミス</span>
              <span className={s.rowValue}>2</span>
            </li>
            <li className={cx(s.row, s.rowMain)}>
              <span className={s.rowLabel}>スコア</span>
              <span className={s.rowValue}>8,420</span>
            </li>
          </ul>
        </section>

        <section className={s.panel}>
          <div className={s.field}>
            <span className={s.fieldLabel}>プレイヤー名（任意）</span>
            <input className={s.input} type="text" defaultValue="ゆき" maxLength={50} />
          </div>
          <div className={s.actions}>
            <button type="button" className={cx(s.btn, s.primary)}>
              <span className={s.btnLabel}>登録してランキングへ</span>
            </button>
            <button type="button" className={cx(s.btn, s.tertiary)}>
              <span className={s.btnLabel}>スキップ</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function RankingScreen({ s }: { s: PixelUiStyles }) {
  return (
    <div className={s.screen}>
      <div className={s.inner}>
        <header className={s.titleBar}>
          <span className={s.mark} aria-hidden="true">
            ★
          </span>
          <span className={s.titleWrap}>
            <strong className={s.title}>ランキング</strong>
            <small className={s.subtitle}>LEADERBOARD</small>
          </span>
        </header>

        <div className={s.tabs}>
          <button type="button" className={cx(s.tab, s.tabOn)}>
            エンドレス
          </button>
          <button type="button" className={s.tab}>
            タイムアタック
          </button>
        </div>

        <section className={s.panel}>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">RANK</th>
                  <th scope="col">NAME</th>
                  <th scope="col" className={s.num}>
                    SCORE
                  </th>
                  <th scope="col" className={s.num}>
                    LV
                  </th>
                </tr>
              </thead>
              <tbody>
                {RANKING_ROWS.map(({ rank, name, score, level }) => (
                  <tr key={rank}>
                    <td className={rank <= 3 ? s.medal : undefined}>#{rank}</td>
                    <td>{name}</td>
                    <td className={s.num}>{score}</td>
                    <td className={s.num}>{level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className={s.footRow}>
          <button type="button" className={s.back}>
            ← ホームへ
          </button>
        </div>
      </div>
    </div>
  );
}

export const SCREENS: Array<{
  id: string;
  label: string;
  Component: (props: { s: PixelUiStyles }) => React.JSX.Element;
}> = [
  { id: "home", label: "ホーム", Component: HomeScreen },
  { id: "difficulty", label: "難易度選択", Component: DifficultyScreen },
  { id: "result", label: "リザルト", Component: ResultScreen },
  { id: "ranking", label: "ランキング", Component: RankingScreen },
];
