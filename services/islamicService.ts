
import { DailyInspiration } from '../types';
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;
  if (!apiKey) throw new Error("API_KEY missing");
  return new GoogleGenAI({ apiKey });
};

/**
 * Checks if a string contains any Gregorian month names to verify correct Hijri formatting.
 */
const isGregorianResult = (str: string): boolean => {
  const gregorianMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return gregorianMonths.some(m => str.includes(m));
};

/**
 * Highly accurate local Hijri date formatter using the Umm al-Qura calendar.
 * Fixed for mobile browsers that often default to Gregorian months.
 */
export const getHijriDateFormatted = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  try {
    let result = date.toLocaleDateString("en-u-ca-islamic-umalqura", options);
    
    if (isGregorianResult(result)) {
      result = date.toLocaleDateString("en-SA-u-ca-islamic-umalqura", options);
    }
    
      return result ;
  } catch (e) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + " (Date Error)";
  }
};

export const fetchHijriDateOnline = async (date: Date): Promise<string> => {
  return getHijriDateFormatted(date);
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

/**
 * Fetches an Ayah and a Hadith from Gemini AI to ensure authentic sources and translations.
 */
export const fetchDailyInspiration = async (): Promise<DailyInspiration> => {
  const todayStr = new Date().toDateString();
  const cached = getCachedInspiration();
  if (cached) return cached;

  const prompt = `Provide one daily Islamic inspiration containing one Quranic Ayah and one authentic Hadith (Sahih Bukhari, Sahih Muslim, etc.). 
  Requirements:
  1. Both must include the original Arabic text.
  2. Both must include a high-quality, professional Urdu translation.
  3. Both must include an authentic reference (e.g., "Surah Al-Baqarah 2:183" or "Sahih Bukhari 5027").
  Return the result strictly in JSON format with keys: ayah (object with keys: arabic, urdu, ref) and hadith (object with keys: arabic, urdu, ref).`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text) as DailyInspiration;
    localStorage.setItem('daily_inspiration_cache', JSON.stringify({ date: todayStr, data: result }));
    return result;
  } catch (error) {
    console.warn("AI Inspiration Fetch Failed:", error);
    // Reliable Fallback
    const fallback: DailyInspiration = {
      ayah: { 
        arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", 
        urdu: "بیشک ہر مشکل کے ساتھ آسانی ہے۔", 
        ref: "Surah Ash-Sharh (94:6)" 
      },
      hadith: { 
        arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", 
        urdu: "تم میں سے بہترین وہ ہے جس نے قرآن سیکھا اور دوسروں کو سکھایا۔", 
        ref: "Sahih Bukhari - 5027" 
      }
    };
    return fallback;
  }
};

export const getCachedInspiration = (): DailyInspiration | null => {
  const cached = localStorage.getItem('daily_inspiration_cache');
  if (cached) {
    try {
      const { date, data } = JSON.parse(cached);
      if (date === new Date().toDateString()) return data;
    } catch (e) {
      return null;
    }
  }
  return null;
};
