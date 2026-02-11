
import { DailyInspiration } from '../types';
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;
  if (!apiKey) throw new Error("API_KEY missing");
  return new GoogleGenAI({ apiKey });
};

/**
 * Uses the browser's native Intl API which is the industry standard for 
 * the Umm al-Qura (Saudi) calendar. This is local, zero-cost, and highly accurate.
 */
const getSystemHijriDate = (date: Date): string => {
  try {
    // 'en-u-ca-islamic-umalqura-nu-latn' provides English names, Umm al-Qura calendar, and Latin numbers.
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;
    
    // Manual formatting to match the "17 Shaban, 1446 AH" style strictly
    if (day && month && year) {
      return `${day} ${month}, ${year} AH`;
    }
    return formatter.format(date) + " AH";
  } catch (e) {
    console.error("System Hijri Error:", e);
    return "";
  }
};

/**
 * Fetches the Hijri date. To prevent 429 errors, it prioritizes local calculation.
 * It only calls Gemini if the cache is empty and the system date needs "beautification".
 */
export const fetchHijriDateOnline = async (date: Date): Promise<string> => {
  const dateKey = date.toISOString().split('T')[0];
  const cacheKey = `hijri_accurate_v6_${dateKey}`;
  const cached = localStorage.getItem(cacheKey);
  
  // Return cached value if it looks like an Islamic date
  const gregorianMonths = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  if (cached && !gregorianMonths.some(m => cached.toLowerCase().includes(m))) {
    return cached;
  }

  // Baseline is the highly accurate system Umalqura date
  const systemDate = getSystemHijriDate(date);
  if (!systemDate) return "Islamic Date Unavailable";

  // If we already have a system date, we only use AI to ensure naming conventions 
  // match user expectations (e.g., spelling of months). 
  // However, we wrap it in an aggressive try-catch to handle 429 (Quota) errors.
  try {
    const ai = getAiClient();
    const prompt = `Convert this system Islamic date "${systemDate}" (derived from Gregorian ${date.toDateString()}) to a formal English format.
    Return ONLY the date. Example: "17 Shaban, 1446 AH". 
    Use traditional month names: Muharram, Safar, Rabi al-Awwal, Rabi al-Thani, Jumada al-Ula, Jumada al-Akhira, Rajab, Shaban, Ramadan, Shawwal, Dhu al-Qidah, Dhu al-Hijjah.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    const text = response.text?.trim() || "";
    if (text.length > 5 && !gregorianMonths.some(m => text.toLowerCase().includes(m))) {
      localStorage.setItem(cacheKey, text);
      return text;
    }
    
    // If AI returns something weird, fallback to system
    localStorage.setItem(cacheKey, systemDate);
    return systemDate;
  } catch (error: any) {
    // If we hit 429 (Resource Exhausted), we gracefully fallback to the local system date.
    // This ensures the UI never hangs on "Syncing...".
    console.warn("Gemini Rate Limited or Error, falling back to System Hijri:", error.message);
    localStorage.setItem(cacheKey, systemDate);
    return systemDate;
  }
};

export const fetchPrayerTimesByLocation = async (lat: number, lng: number): Promise<any> => {
  const prompt = `Based on Lat: ${lat}, Lng: ${lng}, provide accurate 24h prayer times for today.
  Return ONLY JSON: {"fajr": "HH:MM", "zuhr": "HH:MM", "asar": "HH:MM", "maghrib": "HH:MM", "esha": "HH:MM"}`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  } catch (e) {
    return null;
  }
};

export const fetchDailyInspiration = async (): Promise<DailyInspiration> => {
  const todayStr = new Date().toDateString();
  const cached = getCachedInspiration();
  if (cached) return cached;
  
  const prompt = `Provide 1 authentic Quranic Ayah and 1 authentic Hadith. 
  For both, include the original Arabic text and a beautiful Urdu translation.
  JSON Format: 
  {
    "ayah": { "arabic": "...", "urdu": "...", "ref": "..." },
    "hadith": { "arabic": "...", "urdu": "...", "ref": "..." }
  }`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text);
    localStorage.setItem('daily_inspiration_cache', JSON.stringify({ date: todayStr, data: result }));
    return result;
  } catch (error) {
    return {
      ayah: { arabic: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ", urdu: "اور جب میرے بندے آپ سے میرے بارے میں سوال کریں تو میں قریب ہوں۔", ref: "2:186" },
      hadith: { arabic: "الدُّعَاءُ هُوَ الْعِبَادَةُ", urdu: "دعا ہی عبادت ہے۔", ref: "Tirmidhi" }
    };
  }
};

export const getCachedInspiration = (): DailyInspiration | null => {
  const cached = localStorage.getItem('daily_inspiration_cache');
  if (cached) {
    const { date, data } = JSON.parse(cached);
    if (date === new Date().toDateString()) return data;
  }
  return null;
};
