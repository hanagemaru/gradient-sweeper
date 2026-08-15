/*
 * 固定キャンバス＋レターボックス案を実ビューポートで見るページ。
 * 横長にすれば左右が、縦長にすれば上下が余白として切れる様子を
 * 実機の回転・ウィンドウのリサイズで確認できる。
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CanvasHome } from "../CanvasHome";
import { LETTERBOX_VARIANTS } from "../variants";
import styles from "../canvas.module.css";

export function generateStaticParams() {
  return LETTERBOX_VARIANTS.map(({ id }) => ({ variant: id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ variant: string }>;
}): Promise<Metadata> {
  const { variant } = await params;
  const found = LETTERBOX_VARIANTS.find((v) => v.id === variant);

  return {
    title: found
      ? `${found.name} ${found.tagline} | 固定キャンバス比較`
      : "固定キャンバス比較",
    robots: { index: false, follow: false },
  };
}

export default async function LetterboxVariantPage({
  params,
  searchParams,
}: {
  params: Promise<{ variant: string }>;
  searchParams: Promise<{ tall?: string }>;
}) {
  const { variant } = await params;
  const { tall } = await searchParams;
  const found = LETTERBOX_VARIANTS.find((v) => v.id === variant);

  if (!found) {
    notFound();
  }

  const query = tall ? "?tall=1" : "";

  return (
    <>
      <nav className={styles.nav}>
        <span className={styles.navTitle}>{found.name}</span>
        {LETTERBOX_VARIANTS.map(({ id, name }) => (
          <Link
            key={id}
            href={`/style-lab/pixel-ui/letterbox/${id}${query}`}
            className={`${styles.navLink} ${id === found.id ? styles.navLinkOn : ""}`}
          >
            {name}
          </Link>
        ))}
        <div className={styles.navSpacer} />
        <Link
          href={`/style-lab/pixel-ui/letterbox/${found.id}${tall ? "" : "?tall=1"}`}
          className={`${styles.navLink} ${tall ? styles.navLinkOn : ""}`}
        >
          はみ出しテスト
        </Link>
        <Link href="/style-lab/pixel-ui/letterbox" className={styles.navLink}>
          一覧へ
        </Link>
      </nav>
      <CanvasHome variant={found} tall={tall === "1"} />
    </>
  );
}
