export const locales = ["en", "he"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const translations = {
  en: {
    today: "TODAY",
    totalBurn: "TOTAL BURN",
    activeBurn: "ACTIVE BURN",
    steps: "STEPS",
    distance: "DISTANCE",
    heartRate: "HEART RATE",
    updated: "Updated",
    connectOura: "Connect Oura",
    refresh: "Refresh",
    disconnect: "Disconnect",
    disconnectOura: "Disconnect Oura",
    appName: "Oura Home Widget",
    tagline: "Your Oura data, at a glance.",
    connectedToOura: "Connected to Oura",
    lastUpdated: "Last updated",
    errorUpdate: "We couldn't update your Oura data.",
    tryAgain: "Try again",
    reconnect: "Reconnect Oura",
    reconnectNeeded: "Your Oura connection needs to be renewed.",
    loginFailed: "We couldn't complete the Oura login. Please try again.",
    rateLimited: "Oura is temporarily busy. Try again in a few minutes.",
    unavailable: "Oura is temporarily unavailable.",
    forbidden: "Oura data isn't available for this account right now.",
    denied: "Oura access wasn't granted.",
    bpm: "bpm",
    km: "km",
    settings: "Settings",
    language: "Language",
    english: "English",
    hebrew: "עברית",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    attribution: "Data provided by Oura",
    widgetConnectHint:
      "Connect Oura in this window. A login in Chrome does not sign the widget in.",
    widgetLink: "Home-screen widget link",
    widgetLinkHint:
      "Paste this exact link into Website Widget. The ordinary /widget address cannot see your Chrome login.",
    copyWidgetLink: "Copy widget link",
    copied: "Copied",
    widgetExpired:
      "This widget link expired. Open Settings and copy a new one.",
    notTheOuraApp: "This is a personal dashboard, not the Oura app.",
    skipToContent: "Skip to content",
  },
  he: {
    today: "היום",
    totalBurn: "סה״כ שריפה",
    activeBurn: "שריפה מפעילות",
    steps: "צעדים",
    distance: "מרחק",
    heartRate: "קצב לב",
    updated: "עודכן",
    connectOura: "חיבור ל-Oura",
    refresh: "רענון",
    disconnect: "ניתוק",
    disconnectOura: "ניתוק מ-Oura",
    appName: "ווידג׳ט Oura",
    tagline: "נתוני Oura שלך, במבט אחד.",
    connectedToOura: "מחובר ל-Oura",
    lastUpdated: "עודכן לאחרונה",
    errorUpdate: "לא הצלחנו לעדכן את נתוני Oura.",
    tryAgain: "נסה שוב",
    reconnect: "חיבור מחדש ל-Oura",
    reconnectNeeded: "יש לחדש את החיבור ל-Oura.",
    loginFailed: "לא הצלחנו להשלים את החיבור ל-Oura. נסי שוב.",
    rateLimited: "Oura עמוס כרגע. נסה שוב בעוד כמה דקות.",
    unavailable: "Oura אינו זמין כרגע.",
    forbidden: "נתוני Oura אינם זמינים לחשבון זה כרגע.",
    denied: "הגישה ל-Oura לא אושרה.",
    bpm: "פעימות",
    km: "ק״מ",
    settings: "הגדרות",
    language: "שפה",
    english: "English",
    hebrew: "עברית",
    privacy: "מדיניות פרטיות",
    terms: "תנאי שימוש",
    attribution: "נתונים מסופקים על ידי Oura",
    widgetConnectHint:
      "חברי את Oura בחלון הזה. חיבור בדפדפן חיצוני לא נשמר בווידג׳ט.",
    widgetLink: "קישור לווידג׳ט במסך הבית",
    widgetLinkHint:
      "הדביקי את הקישור הזה באפליקציית הווידג׳ט. הכתובת הרגילה /widget לא רואה את החיבור מ-Chrome.",
    copyWidgetLink: "העתקת קישור",
    copied: "הועתק",
    widgetExpired: "פג תוקף הקישור. פתחי הגדרות והעתיקי קישור חדש.",
    notTheOuraApp: "זה לוח בקרה אישי, לא אפליקציית Oura.",
    skipToContent: "דלג לתוכן",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "he";
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return locale === "he" ? "rtl" : "ltr";
}
