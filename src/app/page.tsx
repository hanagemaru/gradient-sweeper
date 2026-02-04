"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/i18n/useI18n";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

export default function Home() {
  const { t } = useI18n();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 gap-8">
      <h1 className="text-3xl font-bold">Gradient Sweeper</h1>
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          href="/game?mode=endless"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 px-6 rounded-lg text-xl font-semibold hover:opacity-90 transition-opacity"
        >
          <Icon name="infinity" />
          {t("home.endless")}
        </Link>
        
        <Link
          href="/ta"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 px-6 rounded-lg text-xl font-semibold hover:opacity-90 transition-opacity"
        >
          <Icon name="clock" />
          {t("home.timeAttack")}
        </Link>
        
        <Link
          href="/ranking"
          className="flex items-center justify-center gap-2 bg-gray-700 text-white py-4 px-6 rounded-lg text-xl font-semibold hover:opacity-90 transition-opacity"
        >
          <Icon name="trophy" />
          {t("home.ranking")}
        </Link>
      </div>
      
      <LanguageToggle />
    </main>
  );
}
