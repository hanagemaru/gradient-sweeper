/*
 * 背景モチーフ配置(シード違い)の比較ページ。
 * 固定キャンバス+レターボックスの仕組みは letterbox/black と同じ。
 * 余白は「黒べたでいい」という決定を反映し、常に黒固定にしている。
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CanvasHome } from "../../CanvasHome";
import { LETTERBOX_VARIANTS } from "../../variants";
import { SEEDS } from "../../seed-data";
import styles from "../../canvas.module.css";

const BLACK_VARIANT = LETTERBOX_VARIANTS.find((v) => v.id === "black")!;

export function generateStaticParams() {
  return SEEDS.map(({ id }) => ({ seed: id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seed: string }>;
}): Promise<Metadata> {
  const { seed } = await params;
  const found = SEEDS.find((s) => s.id === seed);

  return {
    title: found ? `${found.label} | 背景モチーフ比較` : "背景モチーフ比較",
    robots: { index: false, follow: false },
  };
}

export default async function SeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ seed: string }>;
  searchParams: Promise<{ bare?: string }>;
}) {
  const { seed } = await params;
  const { bare } = await searchParams;
  const found = SEEDS.find((s) => s.id === seed);

  if (!found) {
    notFound();
  }

  // 切り替えバーはキャンバス上端に重なり、パネル上のクリスタル帯を隠してしまう。
  // ?bare=1 で外して素の状態を確認できるようにする（本番にこのバーは無い）。
  if (bare) {
    return <CanvasHome variant={BLACK_VARIANT} world={found.world} />;
  }

  return (
    <>
      <nav className={styles.nav}>
        <span className={styles.navTitle}>{found.label}</span>
        {SEEDS.map(({ id, label }) => (
          <Link
            key={id}
            href={`/style-lab/pixel-ui/letterbox/seeds/${id}`}
            className={`${styles.navLink} ${id === found.id ? styles.navLinkOn : ""}`}
          >
            {label}
          </Link>
        ))}
        <div className={styles.navSpacer} />
        <Link
          href={`/style-lab/pixel-ui/letterbox/seeds/${found.id}?bare=1`}
          className={styles.navLink}
        >
          バー無しで見る
        </Link>
        <Link href="/style-lab/pixel-ui/letterbox" className={styles.navLink}>
          余白比較へ
        </Link>
      </nav>
      <CanvasHome variant={BLACK_VARIANT} world={found.world} />
    </>
  );
}
