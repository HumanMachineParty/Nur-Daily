
import { DailyInspiration } from '../types';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Fallback local calculation using Intl API (Umm al-Qura)
 */
const calculateHijriFallback = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return formatter.format(date) + " AH";
};

/**
 * Fetches the accurate Hijri date for a specific Gregorian date.
 * Implements aggressive caching to stay within API quotas and prevent 429 errors.
 */
export const fetchHijriDateOnline = async (date: Date): Promise<string> => {
  const dateKey = date.toISOString().split('T')[0];
  const cacheKey = `hijri_date_cache_${dateKey}`;
  
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const prompt = `What is the official Hijri date for the Gregorian date ${dateStr}? 
  Provide the date in "Day Month, Year AH" format (e.g., "20 Sha'ban, 1447 AH"). 
  Strictly use the Umm al-Qura calendar. 
  Only return the date string itself.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text?.trim();
    if (text && (text.includes('144') || text.includes('145') || text.includes('146'))) {
      localStorage.setItem(cacheKey, text);
      return text;
    }
    throw new Error("Invalid Hijri date format");
  } catch (error: any) {
    console.warn("Hijri API fetch failed, falling back to local calculation:", error.message);
    const fallback = calculateHijriFallback(date);
    localStorage.setItem(cacheKey, fallback);
    return fallback;
  }
};

const fallbackInspiration: DailyInspiration = {
  ayah: {
    arabic: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ",
    urdu: "اور جب میرے بندے آپ سے میرے بارے میں سوال کریں تو میں قریب ہوں۔",
    ref: "Al-Baqarah 2:186"
  },
  hadith: {
    text: "الدُّعَاءُ هُوَ الْعِبَادَةُ",
    urdu: "دعا ہی عبادت ہے۔",
    ref: "Tirmidhi"
  }
};

/**
 * Fetches daily spiritual inspiration. Uses local cache to ensure it only runs once per day.
 * Prompt refined to ensure variety and uniqueness for each day.
 */
export const fetchDailyInspiration = async (): Promise<DailyInspiration> => {
  const todayDate = new Date();
  const todayStr = todayDate.toDateString();
  
  const cached = getCachedInspiration();
  if (cached) return cached;
  
  const prompt = `Provide one unique authentic Quranic Ayah and one unique authentic Hadith specifically for today: ${todayStr}. 
  The selection should be inspiring and relevant to daily growth.
  Include:
  1. The Arabic text.
  2. The precise and beautiful Urdu translation (tarjuma).
  3. The accurate reference (Surah:Ayah or Hadith Book:Number).
  
  Return ONLY a JSON object in this format:
  {
    "ayah": { "arabic": "...", "urdu": "...", "ref": "..." },
    "hadith": { "text": "...", "urdu": "...", "ref": "..." }
  }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text);
    localStorage.setItem('daily_inspiration_cache', JSON.stringify({
      date: todayStr,
      data: result
    }));
    return result;
  } catch (error: any) {
    console.error("Error fetching inspiration:", error);
    return fallbackInspiration;
  }
};

export const getCachedInspiration = (): DailyInspiration | null => {
  const cached = localStorage.getItem('daily_inspiration_cache');
  if (cached) {
    try {
      const { date, data } = JSON.parse(cached);
      if (date === new Date().toDateString()) {
        return data;
      }
    } catch (e) {
      return null;
    }
  }
  return null;
};
