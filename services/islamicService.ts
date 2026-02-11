
import { DailyInspiration } from '../types';
import { GoogleGenAI } from "@google/genai";

const HADITH_API_KEY = "$2y$10$BEAo9I5SDRzvtr0SwIgqexdYCU7OvCbiVcvl2N4sfTg4voY4aWm";
const QURAN_API_URL = "https://alquran-api.pages.dev/api/quran?lang=ur";
const HADITH_API_URL = `https://hadithapi.com/api/hadiths/?apiKey=${HADITH_API_KEY}`;

const getAiClient = () => {
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;
  if (!apiKey) throw new Error("API_KEY missing");
  return new GoogleGenAI({ apiKey });
};

/**
 * Highly accurate local Hijri date formatter using the Umm al-Qura calendar.
 */
export const getHijriDateFormatted = (date: Date): string => {
  try {
    return date.toLocaleDateString(
      "en-u-ca-islamic-umalqura",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ) + " AH";
  } catch (e) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + " (Syncing...)";
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

export const fetchDailyInspiration = async (): Promise<DailyInspiration> => {
  const todayStr = new Date().toDateString();
  const cached = getCachedInspiration();
  if (cached) return cached;

  let ayahInspiration = null;
  let hadithInspiration = null;

  // 1. Fetch Quranic Ayah
  try {
    const quranRes = await fetch(QURAN_API_URL, { cache: 'no-store' });
    if (!quranRes.ok) throw new Error("Quran API Status: " + quranRes.status);
    const quranData = await quranRes.json();
    
    const surahs = Array.isArray(quranData) ? quranData : (quranData.data || []);
    if (surahs.length > 0) {
      const randomSurah = surahs[Math.floor(Math.random() * surahs.length)];
      const ayahs = randomSurah.ayahs || [];
      if (ayahs.length > 0) {
        const randomAyah = ayahs[Math.floor(Math.random() * ayahs.length)];
        ayahInspiration = {
          arabic: randomAyah.text || "",
          urdu: randomAyah.translation || "ترجمہ دستیاب نہیں",
          ref: `Surah ${randomSurah.englishName || randomSurah.name} (${randomSurah.number}:${randomAyah.numberInSurah})`
        };
      }
    }
  } catch (error) {
    console.warn("Quran Fetch Failed, using fallback:", error);
    ayahInspiration = { 
      arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", 
      urdu: "بیشک تنگی کے ساتھ آسانی ہے۔", 
      ref: "Surah Ash-Sharh (94:6)" 
    };
  }

  // 2. Fetch Hadith
  try {
    const randomPage = Math.floor(Math.random() * 5) + 1; // Limit pages to avoid out-of-bounds
    const hadithRes = await fetch(`${HADITH_API_URL}&page=${randomPage}`, { cache: 'no-store' });
    if (!hadithRes.ok) throw new Error("Hadith API Status: " + hadithRes.status);
    const hadithData = await hadithRes.json();
    
    const hadithList = hadithData?.hadiths?.data || [];
    if (hadithList.length > 0) {
      const randomHadithItem = hadithList[Math.floor(Math.random() * hadithList.length)];
      hadithInspiration = {
        arabic: randomHadithItem?.hadithArabic || "حدیث دستیاب نہیں",
        urdu: randomHadithItem?.hadithUrdu || "ترجمہ دستیاب نہیں",
        ref: `${randomHadithItem?.bookName || "Hadith"} - ${randomHadithItem?.hadithNumber || ""}`
      };
    }
  } catch (error) {
    console.warn("Hadith Fetch Failed, using fallback:", error);
    hadithInspiration = { 
      arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", 
      urdu: "تم میں سے بہترین وہ ہے جو قرآن سیکھے اور سکھائے۔", 
      ref: "Sahih Bukhari - 5027" 
    };
  }

  const finalInspiration: DailyInspiration = {
    ayah: ayahInspiration || { arabic: "", urdu: "", ref: "" },
    hadith: hadithInspiration || { arabic: "", urdu: "", ref: "" }
  };

  localStorage.setItem('daily_inspiration_cache', JSON.stringify({ date: todayStr, data: finalInspiration }));
  return finalInspiration;
};

export const getCachedInspiration = (): DailyInspiration | null => {
  const cached = localStorage.getItem('daily_inspiration_cache');
  if (cached) {
    const { date, data } = JSON.parse(cached);
    if (date === new Date().toDateString()) return data;
  }
  return null;
};
