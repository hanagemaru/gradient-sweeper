"use client";

import Link from "next/link";
import {
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import "@fontsource/dotgothic16/japanese-400.css";
import { useI18n } from "@/i18n/useI18n";
import styles from "./pixel-ui.module.css";

const CRYSTAL_BASE = "/assets/frostbound/crystals-v2";
const MOTIF_BASE = "/assets/frostbound/motifs-v2";

function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(" ");
}

function DecorativeImage({
  base,
  name,
  className,
}: {
  base: string;
  name: string;
  className: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${base}/${name}.png`}
      alt=""
      className={cx(styles.decorativeImage, className)}
      draggable={false}
    />
  );
}

function PixelBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <DecorativeImage base={MOTIF_BASE} name="cell-covered-large" className={styles.mTopLeft} />
      <DecorativeImage base={MOTIF_BASE} name="cell-open-red" className={styles.mTopRed} />
      <DecorativeImage base={MOTIF_BASE} name="l-panel-blue" className={styles.mRightUpper} />
      <DecorativeImage base={MOTIF_BASE} name="cell-open-purple-wide" className={styles.mBottomLeft} />
      <DecorativeImage base={MOTIF_BASE} name="cell-covered-medium" className={styles.mBottomRight} />
      <DecorativeImage base={MOTIF_BASE} name="cell-open-blue" className={styles.mMidRight} />

      <DecorativeImage base={CRYSTAL_BASE} name="cluster-large" className={styles.cTopRight} />
      <DecorativeImage base={CRYSTAL_BASE} name="cluster-medium" className={styles.cBottomLeft} />
      <DecorativeImage base={CRYSTAL_BASE} name="cluster-wide" className={styles.cBottomRight} />
      <DecorativeImage base={CRYSTAL_BASE} name="accent-small" className={styles.cMidLeft} />
    </div>
  );
}

export function PixelScene({
  children,
  languageToggle = false,
  width = "normal",
}: {
  children: ReactNode;
  languageToggle?: boolean;
  width?: "normal" | "wide";
}) {
  return (
    <div className={styles.scene}>
      <PixelBackdrop />
      <main className={styles.content}>
        <div className={cx(styles.stack, width === "wide" && styles.stackWide)}>
          {children}
          {languageToggle && <PixelLanguageToggle />}
        </div>
      </main>
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
        <div className={styles.divider} aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
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
