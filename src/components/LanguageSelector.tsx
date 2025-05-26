"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";
import { Globe } from "lucide-react";

const languages = {
  en: { name: "English", flag: "🇺🇸" },
  ru: { name: "Русский", flag: "🇷🇺" },
};

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  const toggleLocale = () => {
    setLocale(locale === "en" ? "ru" : "en");
  };

  return (
    <Button variant="outline" size="sm" onClick={toggleLocale}>
      <Globe className="mr-2 h-4 w-4" />
      {languages[locale].flag} {languages[locale].name}
    </Button>
  );
}
