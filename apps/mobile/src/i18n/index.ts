import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const resources = {
  en: {
    translation: {
      dashboard: "Dashboard",
      issues: "Issues",
      members: "Members",
      settings: "Settings",
      welcome: "Welcome back",
      search: "Search...",
      createIssue: "Create Issue",
      status: "Status",
      priority: "Priority",
      all: "All",
      open: "Open",
      inProgress: "In Progress",
      resolved: "Resolved",
      closed: "Closed"
    }
  },
  am: {
    translation: {
      dashboard: "ዳሽቦርድ",
      issues: "ጉዳዮች",
      members: "አባላት",
      settings: "ቅንብሮች",
      welcome: "እንኳን ደህና መጡ",
      search: "ፈልግ...",
      createIssue: "ጉዳይ ፍጠር",
      status: "ሁኔታ",
      priority: "ቅድሚያ",
      all: "ሁሉም",
      open: "ክፍት",
      inProgress: "በሂደት ላይ",
      resolved: "ተፈትቷል",
      closed: "ተዘግቷል"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.getLocales()?.[0]?.languageCode ?? 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
