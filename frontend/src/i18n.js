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
      "help_center": "Help Center",
      "profile": "Profile",
      "manage_alerts": "Manage Price Alerts",
      "language_preferences": "Language & Region",
      "danger_zone": "Danger Zone",
      "clear_data": "Clear Local Data",
      "save_prefs": "Save Preferences",
      "no_alerts": "No active price alerts found.",
      "acc_info": "Account Information",
      "appearance": "Appearance"
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
      "help_center": "උදව් මධ්‍යස්ථානය",
      "profile": "පැතිකඩ",
      "manage_alerts": "මිල ඇඟවීම් කළමනාකරණය",
      "language_preferences": "භාෂාව සහ කලාපය",
      "danger_zone": "අන්තරාදායක කලාපය",
      "clear_data": "සියලු දත්ත මකන්න",
      "save_prefs": "අභිරුචි සුරකින්න",
      "no_alerts": "ක්‍රියාකාරී මිල ඇඟවීම් හමු නොවීය.",
      "acc_info": "ගිණුමේ තොරතුරු",
      "appearance": "පෙනුම"
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
      "help_center": "உதவி மையம்",
      "profile": "சுயவிவரம்",
      "manage_alerts": "விலை எச்சரிக்கைகளை நிர்வகி",
      "language_preferences": "மொழி மற்றும் பிராந்தியம்",
      "danger_zone": "ஆபத்தான மண்டலம்",
      "clear_data": "தரவை அழி",
      "save_prefs": "விருப்பங்களைச் சேமி",
      "no_alerts": "செயலில் உள்ள விலை எச்சரிக்கைகள் இல்லை.",
      "acc_info": "கணக்குத் தகவல்",
      "appearance": "தோற்றம்"
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
