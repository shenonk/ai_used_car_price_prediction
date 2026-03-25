import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "price_check": "Price Check",
      "results": "Results",
      "financing": "Financing",
      "analytics": "Analytics",
      "notifications": "Notifications",
      "settings": "Settings",
      "logout": "Logout",
      "welcome": "Welcome back",
      "notification_preferences": "Notification Preferences",
      "help_center": "Help Center"
    }
  },
  si: {
    translation: {
      "dashboard": "මුහුණත",
      "price_check": "මිල පරීක්ෂාව",
      "results": "ප්‍රතිඵල",
      "financing": "මූල්ය පහසුකම්",
      "analytics": "විශ්ලේෂණ",
      "notifications": "නිවේදන",
      "settings": "සැකසුම්",
      "logout": "ඉවත් වන්න",
      "welcome": "නැවතත් සාදරයෙන් පිළිගනිමු",
      "notification_preferences": "නිවේදන අභිරුචි",
      "help_center": "උදව් මධ්‍යස්ථානය"
    }
  },
  ta: {
    translation: {
      "dashboard": "முகப்பு",
      "price_check": "விலை சரிபார்ப்பு",
      "results": "முடிவுகள்",
      "financing": "நிதி உதவி",
      "analytics": "பகுப்பாய்வு",
      "notifications": "அறிவிப்புகள்",
      "settings": "அமைப்புகள்",
      "logout": "வெளியேறு",
      "welcome": "மீண்டும் வருக",
      "notification_preferences": "அறிவிப்பு விருப்பங்கள்",
      "help_center": "உதவி மையம்"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
