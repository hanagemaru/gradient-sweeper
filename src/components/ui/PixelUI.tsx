"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/i18n/useI18n";
import styles from "./pixel-ui.module.css";
import {
  BACKGROUND_WORLD,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type BackgroundPlacement,
} from "@/lib/background-world";
import { GAME_SCENERY } from "@/lib/game-scenery";

function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(" ");
}

function PixelBackdrop({ placements }: { placements: BackgroundPlacement[] }) {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <div className={styles.world} style={{ width: WORLD_WIDTH, height: WORLD_HEIGHT }}>
        {placements.map((p, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${p.name}-${index}`}
            src={`${p.base}/${p.name}.png`}
            alt=""
            draggable={false}
            className={cx(styles.decorativeImage, styles.worldImage)}
            style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
          />
        ))}
      </div>
    </div>
  );
}

export function PixelScene({
  children,
  languageToggle = false,
  width = "normal",
  overlay = false,
  label,
  layout = "panel",
  scenery = "home",
}: {
  children: ReactNode;
  languageToggle?: boolean;
  width?: "menu" | "normal" | "wide";
  /**
   * 背景ワールドを描かず、いま表示されている画面の上に重ねるモード。
   *
   * 黒いレターボックスの代わりにビューポート全面の半透明の暗幕を敷き、
   * z-index を上げる。キャンバス（390x550）と transform は通常モードと
   * 共有しているので、どの画面の上に重ねてもパネルの寸法・位置・拡大率が
   * 一致する。
   */
  overlay?: boolean;
  /** overlay のときにダイアログへ付ける名前。 */
  label?: string;
  /**
   * キャンバス内側のレイアウト。
   *
   * - `panel` … 既定。上下に余白を取り、中央へパネルを積む（ホーム・TA選択・
   *   ランキング・リザルト）。
   * - `full` … 余白と最大幅の制限を外し、キャンバス全面をページ側に明け渡す。
   *   ゲーム画面のように HUD・盤面・操作ボタンを縦に配分したい画面で使う。
   */
  layout?: "panel" | "full";
  /**
   * 背景ワールドの絵柄。`overlay` のときは描かれない。
   *
   * ゲーム画面だけ別の配置表を使うのは、盤面と操作ボタンが占める領域が
   * ホームのパネルと違うため。ホームの配置をそのまま敷くと、モチーフが
   * 盤面の裏へほぼ隠れて縁から細い帯だけが覗く。
   */
  scenery?: "home" | "game";
}) {
  const { language } = useI18n();

  /*
   * overlay は `document.body` へポータルする。
   *
   * `.scene` は transform が掛かっているため、position:fixed な子孫の
   * containing block になる（CSS仕様）。ゲーム画面自身が `PixelScene` に
   * なった今、オーバーレイをその内側に置いたままにすると `.stage` の
   * inset:0 がキャンバス基準になり、さらに `.scene` の scale が親子で
   * 二重に掛かってしまう（実測: 430px 幅で 1.103 x 1.103 = 1.217倍）。
   * body へ逃がすことで、どの画面から開いても実ビューポート基準の
   * 同じ倍率になる。
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const tree = (
    // .stage が黒いレターボックス、.scene が 390x550 の固定キャンバス。
    // 中身がキャンバス高さを超えるページはキャンバス内の .scroll だけがスクロールし、
    // 背景と黒帯は動かない。
    // 高さ 550 の根拠は pixel-ui.module.css のコメントを参照（SE で左右の黒帯を
    // 消すために詰めた）。
    // overlay は実質モーダルなので、幕そのものに dialog の役割を持たせる。
    // ここを外側のラッパー div に付けると、中身が position:fixed のせいで
    // 高さ 0 の要素に role が乗ってしまう。
    <div
      className={cx(styles.stage, overlay && styles.stageOverlay)}
      role={overlay ? "dialog" : undefined}
      aria-modal={overlay ? true : undefined}
      aria-label={overlay ? label : undefined}
    >
      <div className={cx(styles.scene, language === "en" && styles.sceneEnglish)}>
        {!overlay && (
          <PixelBackdrop placements={scenery === "game" ? GAME_SCENERY : BACKGROUND_WORLD} />
        )}
        <div className={styles.scroll}>
          <main
            className={cx(
              styles.content,
              overlay && styles.contentOverlay,
              layout === "full" && styles.contentFull,
            )}
          >
            <div
              className={cx(
                styles.stack,
                width === "menu" && styles.stackMenu,
                width === "wide" && styles.stackWide,
                layout === "full" && styles.stackFull,
              )}
            >
              {children}
              {languageToggle && <PixelLanguageToggle />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );

  if (!overlay) return tree;
  if (!mounted) return null;
  return createPortal(tree, document.body);
}

/**
 * 破線＋中央の四角のディバイダー。
 * `PixelPanel` のタイトル下と、ゲーム画面の HUD で同じものを使う。
 */
export function PixelDivider() {
  return (
    <div className={styles.divider} aria-hidden="true">
      <span />
      <i />
      <span />
    </div>
  );
}

export function PixelPanel({
  title,
  subtitle,
  children,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={cx(styles.panel, compact && styles.panelCompact)}>
      <header className={styles.titleBlock}>
        <h1 className={styles.title}>{title}</h1>
        <PixelDivider />
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

type PixelButtonBase = {
  children: ReactNode;
  className?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "tab";
  size?: "sm" | "md" | "lg";
  block?: boolean;
};

type PixelButtonProps = PixelButtonBase &
  (
    | { href: string }
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
  );

export function PixelButton({
  children,
  className,
  leading,
  trailing,
  variant = "primary",
  size = "md",
  block = false,
  ...props
}: PixelButtonProps) {
  const buttonClassName = cx(
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    block && styles.buttonBlock,
    className,
  );

  const content = (
    <>
      {leading && <span className={styles.buttonLeading}>{leading}</span>}
      <span className={styles.buttonLabel}>{children}</span>
      {trailing && <span className={styles.buttonTrailing}>{trailing}</span>}
    </>
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={buttonClassName}>
        {content}
      </Link>
    );
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={buttonClassName} {...buttonProps}>
      {content}
    </button>
  );
}

export function PixelLanguageToggle() {
  const { language, setLanguage } = useI18n();

  return (
    <div className={styles.languageToggle} aria-label="Language">
      <button
        type="button"
        className={cx(styles.languageOption, language === "ja" && styles.languageOptionOn)}
        onClick={() => setLanguage("ja")}
        aria-pressed={language === "ja"}
      >
        <span className={styles.languageArrow}>{language === "ja" ? "▶" : " "}</span>
        JA
      </button>
      <span className={styles.languageDivider}>|</span>
      <button
        type="button"
        className={cx(styles.languageOption, language === "en" && styles.languageOptionOn)}
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
      >
        <span className={styles.languageArrow}>{language === "en" ? "▶" : " "}</span>
        EN
      </button>
    </div>
  );
}

export function PixelButtonGroup({ children }: { children: ReactNode }) {
  return <div className={styles.buttonGroup}>{children}</div>;
}

export function PixelTabs({ children }: { children: ReactNode }) {
  return <div className={styles.tabs}>{children}</div>;
}

export function PixelStats({
  items,
}: {
  items: Array<{
    label: string;
    value: ReactNode;
    emphasis?: boolean;
    danger?: boolean;
  }>;
}) {
  return (
    <ul className={styles.stats}>
      {items.map((item) => (
        <li key={item.label} className={cx(styles.stat, item.emphasis && styles.statEmphasis)}>
          <span>{item.label}</span>
          <strong className={item.danger ? styles.danger : undefined}>{item.value}</strong>
        </li>
      ))}
    </ul>
  );
}

type PixelTextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  optional?: string;
};

export function PixelTextField({ label, optional, ...props }: PixelTextFieldProps) {
  return (
    <label className={styles.field} htmlFor={props.id}>
      <span>
        {label}
        {optional && <small> ({optional})</small>}
      </span>
      <input className={styles.input} {...props} />
    </label>
  );
}

export function PixelTable({ children }: { children: ReactNode }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>{children}</table>
    </div>
  );
}

export function PixelMessage({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <div className={cx(styles.message, error && styles.messageError)}>{children}</div>;
}

export function PixelModal({
  isOpen,
  title,
  onClose,
  children,
}: {
  isOpen: boolean;
  title: string;
  onClose?: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalRoot} role="dialog" aria-modal="true" aria-label={title}>
      <button className={styles.modalBackdrop} type="button" onClick={onClose} aria-label="閉じる" />
      <div className={styles.modalPanel}>
        <PixelPanel title={title}>{children}</PixelPanel>
      </div>
    </div>
  );
}
