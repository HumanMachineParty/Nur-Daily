
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Records from './components/Records';
import Analytics from './components/Analytics';
import TasbeehCounter from './components/TasbeehCounter';
import SettingsView from './components/SettingsView';
import { View, DailyEntry, AppSettings, PrayerAlarms } from './types';
import { fetchPrayerTimesByLocation } from './services/islamicService';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  notificationsEnabled: true,
  autoPrayerTimes: false,
  dailyReminderTime: '21:30',
  alarms: {
    fajr: { enabled: true, time: '05:15' },
    zuhr: { enabled: true, time: '13:15' },
    asar: { enabled: true, time: '16:45' },
    maghrib: { enabled: true, time: '18:15' },
    esha: { enabled: true, time: '20:00' },
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedEntries = localStorage.getItem('nur_daily_entries');
    if (savedEntries) setEntries(JSON.parse(savedEntries));
    
    const savedSettings = localStorage.getItem('nur_daily_settings');
    if (savedSettings) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (settings.autoPrayerTimes && settings.location) {
      const syncTimes = async () => {
        const times = await fetchPrayerTimesByLocation(settings.location!.lat, settings.location!.lng);
        if (times) {
          const newAlarms = { ...settings.alarms };
          (Object.keys(times) as Array<keyof typeof times>).forEach(key => {
            if (newAlarms[key]) newAlarms[key].time = times[key];
          });
          updateSettings({ alarms: newAlarms });
        }
      };
      syncTimes();
    }
  }, [settings.autoPrayerTimes, settings.location]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'theme-light', 'theme-dark', 'theme-royal');
    if (settings.theme === 'dark') root.classList.add('dark', 'theme-dark');
    else if (settings.theme === 'royal') root.classList.add('dark', 'theme-royal');
    else root.classList.add('theme-light');
  }, [settings.theme]);

  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHM = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

      if (currentHM === settings.dailyReminderTime && now.getSeconds() === 0) {
        new Notification("Nur Daily", { body: "Don't forget to log your deeds for today! ✨", icon: '/icon.png' });
      }

      (Object.keys(settings.alarms) as Array<keyof PrayerAlarms>).forEach(prayer => {
        const alarm = settings.alarms[prayer];
        if (alarm.enabled && alarm.time === currentHM && now.getSeconds() === 0) {
          new Notification(`${prayer.toUpperCase()} Time`, { body: `It's time for ${prayer} prayer. May Allah accept your worship. 🕋`, icon: '/icon.png' });
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.notificationsEnabled, settings.dailyReminderTime, settings.alarms]);

  const saveEntry = (entry: DailyEntry) => {
    setEntries(prev => {
      const filtered = prev.filter(e => e.date.split('T')[0] !== entry.date.split('T')[0]);
      const newEntries = [entry, ...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      localStorage.setItem('nur_daily_entries', JSON.stringify(newEntries));
      return newEntries;
    });
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('nur_daily_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteEntry = (id: string) => {
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    localStorage.setItem('nur_daily_entries', JSON.stringify(newEntries));
  };

  return (
    <div className="flex min-h-screen transition-colors duration-300">
      <Sidebar currentView={currentView} setView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Unified Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-stone-900 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-emerald-900 dark:text-emerald-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <div className="text-xl font-bold tracking-tight text-emerald-900 dark:text-emerald-400">
              {currentView === View.DASHBOARD ? 'Dashboard' : currentView.replace('_', ' ')}
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-emerald-600 rounded-full flex items-center justify-center text-white font-mono font-black text-sm shadow-lg shadow-emerald-600/20">
               {liveTime}
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-10">
          {currentView === View.DASHBOARD && <Dashboard date={selectedDate} onDateChange={setSelectedDate} entries={entries} onSave={saveEntry} />}
          {currentView === View.TASBEEH && <TasbeehCounter />}
          {currentView === View.RECORDS && <Records entries={entries} onDelete={deleteEntry} onEdit={(d) => { setSelectedDate(new Date(d)); setCurrentView(View.DASHBOARD); }} />}
          {currentView === View.ANALYTICS && <Analytics entries={entries} />}
          {currentView === View.SETTINGS && <SettingsView settings={settings} onUpdateSettings={updateSettings} onExportJSON={() => {}} onRestoreJSON={() => {}} onReset={() => {}} />}
        </main>
      </div>
    </div>
  );
};

export default App;
