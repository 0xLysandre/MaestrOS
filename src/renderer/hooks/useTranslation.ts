import { useStore } from '../store';
import { translations } from '../i18n/translations';
import type { Language } from '../types';

export function useTranslation() {
  const { settings, updateSettings } = useStore();
  const language = settings.language || 'fr';
  const t = translations[language];

  const setLanguage = (lang: Language) => {
    updateSettings({ language: lang });
  };

  return { t, language, setLanguage };
}
