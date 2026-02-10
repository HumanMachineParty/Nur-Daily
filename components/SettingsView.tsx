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

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm("This will replace your current entries with the backup data. Continue?")) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        onRestoreJSON(data);
        alert("Restore complete!");
      } catch (err) {
        alert("Invalid file.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">
      <h2 className="text-3xl font-bold">Settings</h2>

      {/* Appearance */}
      <section className="bg-white p-8 rounded-3xl shadow-lg border">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Appearance
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => onUpdateSettings({ theme: 'light' })}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${settings.theme === 'light' ? 'border-emerald-600 bg-emerald-50' : 'border-stone-100'}`}
          >
            <div className="w-full h-12 bg-white rounded-lg border flex items-center justify-center">
              <div className="w-8 h-2 bg-emerald-700 rounded"></div>
            </div>
            <span className="font-bold text-xs">Light (Green/White)</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ theme: 'dark' })}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${settings.theme === 'dark' ? 'border-emerald-600 bg-stone-800' : 'border-stone-100'}`}
          >
            <div className="w-full h-12 bg-gray-900 rounded-lg flex items-center justify-center gap-1">
              <div className="w-4 h-2 bg-emerald-500 rounded"></div>
              <div className="w-4 h-2 bg-yellow-400 rounded"></div>
            </div>
            <span className="font-bold text-xs">Dark (Green/Yellow)</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ theme: 'royal' })}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${settings.theme === 'royal' ? 'border-amber-500 bg-stone-800' : 'border-stone-100'}`}
          >
            <div className="w-full h-12 bg-stone-950 rounded-lg flex items-center justify-center border border-amber-500/40">
              <div className="w-8 h-2 bg-red-800 rounded"></div>
            </div>
            <span className="font-bold text-xs">Royal (Gold/Red)</span>
          </button>
        </div>
      </section>

      {/* Alarms */}
      <section className="bg-white p-8 rounded-3xl shadow-lg border">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Prayer Reminders
        </h3>
        <div className="space-y-4">
          {(Object.keys(settings.alarms) as Array<keyof PrayerAlarms>).map((prayer) => (
            <div key={prayer} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border transition-all hover:border-emerald-200">
              <div className="flex items-center gap-4">
                <input 
                  type="checkbox" 
                  checked={settings.alarms[prayer].enabled}
                  onChange={(e) => updateAlarm(prayer, 'enabled', e.target.checked)}
                  className="w-5 h-5 rounded accent-emerald-600"
                />
                <span className="font-bold capitalize w-20 text-sm">{prayer}</span>
              </div>
              <input 
                type="time" 
                value={settings.alarms[prayer].time}
                onChange={(e) => updateAlarm(prayer, 'time', e.target.value)}
                className="bg-white border rounded-lg px-3 py-1.5 text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Data Management */}
      <section className="bg-white p-8 rounded-3xl shadow-lg border space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
          Account Data
        </h3>
        <div className="flex items-center justify-between p-4 rounded-2xl border bg-slate-50">
          <div><div className="font-bold text-sm">Export Local Backup</div></div>
          <button onClick={onExportJSON} className="px-5 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-black text-xs hover:bg-emerald-200 transition-all">Download .JSON</button>
        </div>
        <div className="flex items-center justify-between p-4 rounded-2xl border bg-slate-50">
          <div><div className="font-bold text-sm">Restore from File</div></div>
          <button onClick={handleRestoreClick} className="px-5 py-2 bg-emerald-700 text-white rounded-xl font-black text-xs hover:bg-emerald-800 transition-all">Upload .JSON</button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
        </div>
        <div className="flex items-center justify-between p-4 rounded-2xl border bg-red-50/50 border-red-100">
          <div><div className="font-bold text-sm text-red-600">Factory Reset App</div></div>
          <button onClick={onReset} className="px-5 py-2 bg-red-100 text-red-600 rounded-xl font-black text-xs hover:bg-red-200 transition-all">Reset All</button>
        </div>
      </section>
    </div>
  );
};

export default SettingsView;