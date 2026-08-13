"use client";

/*
 * CRYSTAL FIELD 案の4画面。
 *
 * A/B/C の比較セットとは別に、参考画像を基準に独立して作っている。
 * 言語選択の固定幅レイアウトや背景のクリスタル配置など、
 * A/B/C の共有マークアップ（MockScreens.tsx）には無い要素が多いため。
 *
 * 背景の装飾（セルモチーフ・クリスタル）は4画面で共通のレイヤーとして持ち、
 * 前面のパネルだけが画面ごとに変わる。
 */

import { createContext, useContext, useState, type ReactNode } from "react";
import styles from "./crystal-field.module.css";

const CRYSTAL_BASE = "/assets/frostbound/crystals-v2";
const MOTIF_BASE = "/assets/frostbound/motifs-v2";

function cx(...names: Array<string | false | undefined>): string {
  return names.filter(Boolean).join(" ");
}

type JapaneseFont = "dotgothic" | "marumonica" | "pixelmplus";

const FONT_OPTIONS: Array<{
  id: JapaneseFont;
  label: string;
  note: string;
}> = [
  { id: "dotgothic", label: "現行 DotGothic16", note: "読みやすさ優先" },
  { id: "marumonica", label: "候補A マルモニカ", note: "丸み・MOTHER系" },
  { id: "pixelmplus", label: "候補B PixelMplus12", note: "角張り・初期携帯機系" },
];

const FontContext = createContext<JapaneseFont>("dotgothic");

export function FontPreviewProvider({ children }: { children: ReactNode }) {
  const [font, setFont] = useState<JapaneseFont>("dotgothic");

  return (
    <FontContext.Provider value={font}>
      <aside className={styles.fontPicker} aria-label="日本語フォント比較">
        <div className={styles.fontPickerHeading}>
          <strong>日本語フォント比較</strong>
          <span>画面構成は変えず、文字だけ切り替え</span>
        </div>
        <div className={styles.fontOptions}>
          {FONT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={cx(styles.fontOption, font === option.id && styles.fontOptionOn)}
              onClick={() => setFont(option.id)}
              aria-pressed={font === option.id}
            >
              <span>{option.label}</span>
              <small>{option.note}</small>
            </button>
          ))}
        </div>
      </aside>
      {children}
    </FontContext.Provider>
  );
}

function BackgroundAsset({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${MOTIF_BASE}/${name}.png`}
      alt=""
      className={cx(styles.backgroundAsset, className)}
      draggable={false}
    />
  );
}

function Crystal({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${CRYSTAL_BASE}/${name}.png`}
      alt=""
      className={cx(styles.crystal, className)}
      draggable={false}
    />
  );
}

/**
 * 背景レイヤー + 前景コンテンツをまとめるシーン。4画面で共通の配置にする。
 * セルモチーフの一部はパネルの背面へ自然に続くよう、パネルより下の z-index に置きつつ
 * パネルの外周にはみ出す座標で配置している（配置は crystal-field.module.css 側）。
 */
export function Scene({ children }: { children: ReactNode }) {
  const font = useContext(FontContext);

  return (
    <div
      className={cx(
        styles.screen,
        font === "marumonica" && styles.fontMaruMonica,
        font === "pixelmplus" && styles.fontPixelMplus,
      )}
    >
      <div className={styles.backdrop} aria-hidden="true">
        <BackgroundAsset name="cell-covered-large" className={styles.mTopLeft} />
        <BackgroundAsset name="cell-open-red" className={styles.mTopRed} />
        <BackgroundAsset name="l-panel-blue" className={styles.mRightUpper} />
        <BackgroundAsset name="cell-open-purple-wide" className={styles.mBottomLeft} />
        <BackgroundAsset name="cell-covered-medium" className={styles.mBottomRight} />
        <BackgroundAsset name="cell-open-blue" className={styles.mMidRight} />

        <Crystal name="cluster-large" className={styles.cTopRight} />
        <Crystal name="cluster-medium" className={styles.cBottomLeft} />
        <Crystal name="cluster-wide" className={styles.cBottomRight} />
        <Crystal name="accent-small" className={styles.cMidLeft} />
      </div>

      <div className={styles.inner}>{children}</div>
    </div>
  );
}

function LanguageToggle() {
  const [lang, setLang] = useState<"ja" | "en">("ja");

  return (
    <div className={styles.langGroup}>
      <button
        type="button"
        className={cx(styles.langOption, lang === "ja" && styles.langOn)}
        onClick={() => setLang("ja")}
      >
        <span className={styles.langArrow}>{lang === "ja" ? "▶" : " "}</span>
        <span className={styles.langText}>JA</span>
      </button>
      <span className={styles.langDivider}>|</span>
      <button
        type="button"
        className={cx(styles.langOption, lang === "en" && styles.langOn)}
        onClick={() => setLang("en")}
      >
        <span className={styles.langArrow}>{lang === "en" ? "▶" : " "}</span>
        <span className={styles.langText}>EN</span>
      </button>
    </div>
  );
}

function TitleBlock({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className={styles.titleBlock}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerDot} aria-hidden="true" />
        <span className={styles.dividerLine} />
      </div>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </header>
  );
}

function MenuButton({
  icon,
  label,
  meta,
}: {
  icon?: string;
  label: string;
  meta?: string;
}) {
  return (
    <button type="button" className={styles.menuBtn}>
      {icon && (
        <span className={styles.menuIcon} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={styles.menuLabel}>{label}</span>
      {meta && <span className={styles.menuMeta}>{meta}</span>}
    </button>
  );
}

export function HomeScreen() {
  return (
    <Scene>
      <div className={styles.panelGroup}>
        <section className={styles.panel}>
          <TitleBlock title="GRADIENT SWEEPER" subtitle="" />
          <nav className={styles.menu}>
            <MenuButton icon="▶" label="エンドレス" />
            <MenuButton icon="▶" label="タイムアタック" />
            <MenuButton icon="▶" label="ランキング" />
          </nav>
        </section>
        <LanguageToggle />
      </div>
    </Scene>
  );
}

export function TimeAttackSelectScreen() {
  const items = [
    { name: "かんたん", bombs: 10 },
    { name: "ふつう", bombs: 20 },
    { name: "むずかしい", bombs: 30 },
  ];

  return (
    <Scene>
      <div className={styles.panelGroup}>
        <section className={styles.panel}>
          <TitleBlock title="TIME ATTACK" subtitle="難易度を選択" />
          <nav className={styles.menu}>
            {items.map(({ name, bombs }) => (
              <MenuButton key={name} icon="▶" label={name} meta={`爆弾 ${bombs}`} />
            ))}
          </nav>
          <button type="button" className={styles.backLink}>
            ← ホームへ
          </button>
        </section>
        <LanguageToggle />
      </div>
    </Scene>
  );
}

export function ResultScreen() {
  return (
    <Scene>
      <div className={styles.panelGroup}>
        <section className={styles.panel}>
          <TitleBlock title="RESULT" subtitle="ENDLESS" />
          <ul className={styles.rows}>
            <li className={styles.row}>
              <span className={styles.rowLabel}>到達レベル</span>
              <span className={styles.rowValue}>12</span>
            </li>
            <li className={styles.row}>
              <span className={styles.rowLabel}>ミス</span>
              <span className={styles.rowValue}>2</span>
            </li>
            <li className={cx(styles.row, styles.rowMain)}>
              <span className={styles.rowLabel}>スコア</span>
              <span className={styles.rowValue}>8,420</span>
            </li>
          </ul>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>プレイヤー名（任意）</span>
            <input className={styles.input} type="text" defaultValue="ゆき" maxLength={50} />
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.menuBtn}>
              <span className={styles.menuLabel}>登録してランキングへ</span>
            </button>
            <button type="button" className={styles.ghostBtn}>
              スキップ
            </button>
          </div>
        </section>
        <LanguageToggle />
      </div>
    </Scene>
  );
}

const RANKING_ROWS = [
  { rank: 1, name: "ゆき", score: "12,480", level: 16 },
  { rank: 2, name: "SNOWDRIFT", score: "10,110", level: 14 },
  { rank: 3, name: "こおり", score: "9,260", level: 13 },
  { rank: 4, name: "Anonymous", score: "7,040", level: 11 },
  { rank: 5, name: "GLACIER", score: "5,880", level: 9 },
];

export function RankingScreen() {
  return (
    <Scene>
      <div className={styles.panelGroup}>
        <section className={styles.panel}>
          <TitleBlock title="RANKING" subtitle="" />
          <div className={styles.tabs}>
            <button type="button" className={cx(styles.tab, styles.tabOn)}>
              エンドレス
            </button>
            <button type="button" className={styles.tab}>
              タイムアタック
            </button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">RANK</th>
                  <th scope="col">NAME</th>
                  <th scope="col" className={styles.num}>
                    SCORE
                  </th>
                  <th scope="col" className={styles.num}>
                    LV
                  </th>
                </tr>
              </thead>
              <tbody>
                {RANKING_ROWS.map(({ rank, name, score, level }) => (
                  <tr key={rank}>
                    <td className={rank <= 3 ? styles.medal : undefined}>#{rank}</td>
                    <td>{name}</td>
                    <td className={styles.num}>{score}</td>
                    <td className={styles.num}>{level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className={styles.backLink}>
            ← ホームへ
          </button>
        </section>
        <LanguageToggle />
      </div>
    </Scene>
  );
}
