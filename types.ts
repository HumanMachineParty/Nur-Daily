
export interface CustomTask {
  id: string;
  text: string;
  done: boolean;
}

export interface DailyEntry {
  id: string;
  date: string; // ISO string
  hijriDate: string;
  prayers: {
    fajr: boolean;
    zuhr: boolean;
    asar: boolean;
    maghrib: boolean;
    esha: boolean;
  };
  quran: 'Yes' | 'No' | null;
  workout: 'Yes' | 'No' | null;
  skill: {
    done: 'Yes' | 'No' | null;
    notes: string;
  };
  customTasks: CustomTask[];
  diary: string;
}

export interface TasbeehState {
  count: number;
  label: string;
  target?: number;
}

export interface DailyInspiration {
  ayah: {
    arabic: string;
    urdu: string;
    ref: string;
  };
  hadith: {
    arabic: string;
    urdu: string;
    ref: string;
  };
}

export type ThemeMode = 'light' | 'dark' | 'royal';

export interface PrayerAlarms {
  fajr: { enabled: boolean; time: string };
  zuhr: { enabled: boolean; time: string };
  asar: { enabled: boolean; time: string };
  maghrib: { enabled: boolean; time: string };
  esha: { enabled: boolean; time: string };
}

export interface AppSettings {
  theme: ThemeMode;
  notificationsEnabled: boolean;
  alarms: PrayerAlarms;
  autoPrayerTimes: boolean;
  dailyReminderTime: string;
  location?: { lat: number; lng: number };
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  RECORDS = 'RECORDS',
  ANALYTICS = 'ANALYTICS',
  TASBEEH = 'TASBEEH',
  SETTINGS = 'SETTINGS'
}
