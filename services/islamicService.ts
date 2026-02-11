
import { DailyInspiration } from '../types';
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;
  if (!apiKey) throw new Error("API_KEY missing");
  return new GoogleGenAI({ apiKey });
};

/**
 * Fetches the Hijri date from the requested online source: habibur.com
 * Falls back to AI formatting if the external API is unreachable.
 */
export const fetchHijriDateOnline = async (date: Date): Promise<string> => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Target URL: https://hijri.habibur.com/api01/date/YYYY/MM/DD
  const url = `https://hijri.habibur.com/api01/date/${year}/${month}/${day}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Hijri API Error");
    const data = await response.json();
    
    // Attempt to extract Hijri date from common API response structures
    if (data && data.hijri) {
      // Assuming structure like { hijri: { day: 25, month: "Sha'ban", year: 1446, ... } }
      const h = data.hijri;
      return `${h.day} ${h.month} ${h.year}`;
    } else if (typeof data === 'string') {
      return data;
    }
    
    throw new Error("Invalid response format");
  } catch (error) {
    console.warn("External Hijri API failed, falling back to AI:", error);
    
    // Fallback: Use AI to get accurate Hijri date string for the selected date
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `What is the Hijri date for ${date.toDateString()}? Provide ONLY the Hijri date in English (e.g. 25 Sha'ban 1446 AH).`,
      });
      return response.text?.trim() || date.toLocaleDateString('en-u-ca-islamic-umalqura');
    } catch (e) {
      // Last resort native JS fallback
      return date.toLocaleDateString("en-u-ca-islamic-umalqura", { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }
};

/**
 * Fetches prayer times using Gemini AI based on coordinates.
 */
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
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return null;
  }
};

/**
 * Fetches an Ayah and a Hadith from Gemini AI to ensure authentic sources and high-quality translations.
 */
export const fetchDailyInspiration = async (): Promise<DailyInspiration> => {
  const todayStr = new Date().toDateString();
  const cached = getCachedInspiration();
  if (cached) return cached;

  const prompt = `Provide one daily Islamic inspiration containing:
  1. One Quranic Ayah (Arabic text + professional Urdu translation + precise Reference like 'Surah Al-Baqarah 2:183').
  2. One authentic Hadith (Arabic text + professional Urdu translation + Reference like 'Sahih Bukhari 5027').
  
  Return strictly as JSON:
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

    const result = JSON.parse(response.text || '{}') as DailyInspiration;
    localStorage.setItem('daily_inspiration_cache', JSON.stringify({ date: todayStr, data: result }));
    return result;
  } catch (error) {
    console.warn("AI Inspiration Fetch Failed:", error);
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
