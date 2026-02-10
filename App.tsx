
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Records from './components/Records';
import Analytics from './components/Analytics';
import TasbeehCounter from './components/TasbeehCounter';
import SettingsView from './components/SettingsView';
import { View, DailyEntry, AppSettings, PrayerAlarms } from './types';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  notificationsEnabled: false,
  autoPrayerTimes: false,
  alarms: {
    fajr: { enabled: false, time: '05:30' },
    zuhr: { enabled: false, time: '13:30' },
    asar: { enabled: false, time: '16:30' },
    maghrib: { enabled: false, time: '18:30' },
    esha: { enabled: false, time: '20:30' },
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  const lastAlarmCheck = useRef<string>('');

  // Check for API key existence to avoid silent crashes
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;

  const saveToStorage = (records: DailyEntry[], currentSelectedDate: Date) => {
    const dateStr = currentSelectedDate.toISOString().split('T')[0];
    const currentDateData = records.find(e => e.date.split('T')[0] === dateStr) || null;

    const data = {
      records: records,
      selectedDate: currentSelectedDate.toISOString(),
      currentDateData: currentDateData,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('dailyTrackerProData', JSON.stringify(data));
    localStorage.setItem('nur_daily_entries', JSON.stringify(records));
  };

  useEffect(() => {
    const proData = localStorage.getItem('dailyTrackerProData');
    if (proData) {
      try {
        const parsed = JSON.parse(proData);
        if (parsed.records) {
          const sorted = [...parsed.records].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setEntries(sorted);
        }
        if (parsed.selectedDate) {
          setSelectedDate(new Date(parsed.selectedDate));
        }
      } catch (e) { 
        console.error("Error loading dailyTrackerProData", e); 
      }
    } else {
      const savedEntries = localStorage.getItem('nur_daily_entries');
      if (savedEntries) {
        try { setEntries(JSON.parse(savedEntries)); } catch (e) { console.error(e); }
      }
    }

    const savedSettings = localStorage.getItem('nur_daily_settings');
    if (savedSettings) {
      try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) }); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (theme: string) => {
      if (theme === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
    };

    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      applyTheme(systemTheme);
    } else {
      applyTheme(settings.theme);
    }
  }, [settings.theme]);

  const saveEntry = (entry: DailyEntry) => {
    setEntries(prev => {
      const filtered = prev.filter(e => e.date.split('T')[0] !== entry.date.split('T')[0]);
      const newEntries = [entry, ...filtered].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      saveToStorage(newEntries, selectedDate);
      return newEntries;
    });
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => {
      const newEntries = prev.filter(e => e.id !== id);
      saveToStorage(newEntries, selectedDate);
      return newEntries;
    });
  };

  const handleEditRecord = (dateStr: string) => {
    setSelectedDate(new Date(dateStr));
    setCurrentView(View.DASHBOARD);
  };

  const handleRestoreJSON = (restoredEntries: DailyEntry[]) => {
    if (!Array.isArray(restoredEntries)) {
      alert("Invalid backup file format.");
      return;
    }
    
    const sorted = [...restoredEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setEntries(sorted);
    saveToStorage(sorted, selectedDate);
    alert(`Successfully restored ${sorted.length} records!`);
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('nur_daily_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nur-daily-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const resetApp = () => {
    if (confirm('DANGER: This will delete ALL your progress and settings. Are you sure?')) {
      localStorage.removeItem('dailyTrackerProData');
      localStorage.removeItem('nur_daily_entries');
      localStorage.removeItem('nur_daily_settings');
      localStorage.removeItem('daily_inspiration_cache');
      localStorage.removeItem('tasbeeh_history');
      window.location.reload();
    }
  };

  // If API Key is missing, show a friendly setup guide instead of a blank screen
  if (!apiKey) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-[2.5rem] shadow-2xl p-10 border border-emerald-50 dark:border-stone-800 text-center">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 17c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-400 mb-4 tracking-tight">Configuration Required</h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-8 leading-relaxed">
            Nur Daily requires a Google Gemini API Key to provide Islamic dates and daily inspirations.
          </p>
          <div className="bg-stone-50 dark:bg-stone-800 rounded-2xl p-4 text-left mb-8 border border-stone-100 dark:border-stone-700">
             <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-2">Instructions:</div>
             <ol className="text-xs text-stone-600 dark:text-stone-300 space-y-2 list-decimal ml-4">
                <li>Go to your Netlify/Vercel project settings.</li>
                <li>Add an environment variable named <code className="font-mono bg-stone-200 dark:bg-stone-700 px-1 rounded">API_KEY</code>.</li>
                <li>Paste your Gemini API key as the value.</li>
                <li>Redeploy your application.</li>
             </ol>
          </div>
          <p className="text-[10px] text-stone-400">If you have already added the key, try clearing your browser cache and refreshing.</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return (
          <Dashboard 
            date={selectedDate} 
            onDateChange={setSelectedDate}
            entries={entries}
            onSave={saveEntry}
          />
        );
      case View.TASBEEH:
        return <TasbeehCounter />;
      case View.RECORDS:
        return <Records entries={entries} onDelete={deleteEntry} onEdit={handleEditRecord} />;
      case View.ANALYTICS:
        return <Analytics entries={entries} />;
      case View.SETTINGS:
        return (
          <SettingsView 
            settings={settings} 
            onUpdateSettings={updateSettings} 
            onExportJSON={exportJSON}
            onRestoreJSON={handleRestoreJSON}
            onReset={resetApp}
          />
        );
      default:
        return <Dashboard date={selectedDate} onDateChange={setSelectedDate} entries={entries} onSave={saveEntry} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-stone-900 border-b border-emerald-50 dark:border-emerald-900/30 lg:hidden">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-emerald-900 dark:text-emerald-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
          <div className="text-xl font-bold text-emerald-900 dark:text-emerald-400 tracking-tight">Nur Daily</div>
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full"></div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
