
import React, { useRef } from 'react';
import { AppSettings, ThemeMode, PrayerAlarms, DailyEntry } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (s: Partial<AppSettings>) => void;
  onExportJSON: () => void;
  onRestoreJSON: (entries: DailyEntry[]) => void;
  onReset: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings, onExportJSON, onRestoreJSON, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateAlarm = (prayer: keyof PrayerAlarms, field: 'enabled' | 'time', value: any) => {
    const newAlarms = {
      ...settings.alarms,
      [prayer]: { ...settings.alarms[prayer], [field]: value }
    };
    onUpdateSettings({ alarms: newAlarms });
  };

  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      onUpdateSettings({ notificationsEnabled: true });
      new Notification("Nur Daily", { body: "Notifications enabled successfully!" });
    } else {
      alert("Notification permission denied. Please enable it in browser settings.");
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm("This will replace your current entries with the backup data. Do you want to continue?")) {
      event.target.value = ''; // Reset input
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        onRestoreJSON(data);
      } catch (err) {
        console.error("Failed to parse backup file", err);
        alert("Failed to restore: The file is not a valid Nur Daily backup JSON.");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input for next time
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">
      <h2 className="text-3xl font-bold text-emerald-900 dark:text-emerald-400">Settings</h2>

      {/* Appearance */}
      <section className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
        <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Appearance
        </h3>
        <div className="flex flex-wrap gap-3">
          {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onUpdateSettings({ theme: mode })}
              className={`
                px-6 py-2.5 rounded-xl font-bold capitalize transition-all
                ${settings.theme === mode 
                  ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/20' 
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}
              `}
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
        <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          Notifications
        </h3>
        <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">Stay updated with spiritual reminders and daily Ayah/Hadith.</p>
        {!settings.notificationsEnabled ? (
          <button 
            onClick={requestNotificationPermission}
            className="px-6 py-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold hover:bg-emerald-200 transition-all"
          >
            Enable Browser Notifications
          </button>
        ) : (
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Notifications Active
          </div>
        )}
      </section>

      {/* Alarms */}
      <section className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Prayer Alarms
          </h3>
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Auto Mode</span>
             <button 
               onClick={() => onUpdateSettings({ autoPrayerTimes: !settings.autoPrayerTimes })}
               className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoPrayerTimes ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'}`}
             >
               <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.autoPrayerTimes ? 'translate-x-6' : ''}`} />
             </button>
          </div>
        </div>

        <div className="space-y-4">
          {(Object.keys(settings.alarms) as Array<keyof PrayerAlarms>).map((prayer) => (
            <div key={prayer} className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-4">
                <input 
                  type="checkbox" 
                  checked={settings.alarms[prayer].enabled}
                  onChange={(e) => updateAlarm(prayer, 'enabled', e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500"
                />
                <span className="font-bold text-emerald-900 dark:text-emerald-200 capitalize w-20">{prayer}</span>
              </div>
              <input 
                type="time" 
                value={settings.alarms[prayer].time}
                onChange={(e) => updateAlarm(prayer, 'time', e.target.value)}
                disabled={settings.autoPrayerTimes}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] text-stone-400 uppercase font-bold tracking-widest text-center">Alarms only work while the app is open in your browser tab.</p>
      </section>

      {/* Data Management */}
      <section className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 space-y-6">
        <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
          Data Management
        </h3>
        
        {/* Export Action */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-lg dark:text-white">Export Data</div>
            <div className="text-stone-500 dark:text-stone-400 text-sm">Download records as JSON backup</div>
          </div>
          <button 
            onClick={onExportJSON}
            className="px-6 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-bold hover:bg-emerald-200 transition-all"
          >
            Download
          </button>
        </div>

        <hr className="border-stone-100 dark:border-stone-800" />

        {/* Restore Action */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-lg dark:text-white">Restore Data</div>
            <div className="text-stone-500 dark:text-stone-400 text-sm">Upload a backup file to recover entries</div>
          </div>
          <div className="flex items-center">
            <input 
              type="file" 
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button 
              onClick={handleRestoreClick}
              className="px-6 py-2 bg-emerald-700 text-white rounded-full font-bold hover:bg-emerald-800 transition-all shadow-md active:scale-95"
            >
              Restore
            </button>
          </div>
        </div>

        <hr className="border-stone-100 dark:border-stone-800" />

        {/* Reset Action */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-lg text-red-600">Reset App</div>
            <div className="text-stone-500 dark:text-stone-400 text-sm">Permanently delete all tracking data</div>
          </div>
          <button 
            onClick={onReset}
            className="px-6 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full font-bold hover:bg-red-200 transition-all"
          >
            Reset
          </button>
        </div>
      </section>
    </div>
  );
};

export default SettingsView;
