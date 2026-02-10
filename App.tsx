
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Records from './components/Records';
import Analytics from './components/Analytics';
import TasbeehCounter from './components/TasbeehCounter';
import SettingsView from './components/SettingsView';
import { View, DailyEntry, AppSettings, PrayerAlarms, ThemeMode } from './types';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
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
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;

  useEffect(() => {
    const savedEntries = localStorage.getItem('nur_daily_entries');
    if (savedEntries) {
      try { setEntries(JSON.parse(savedEntries)); } catch (e) { console.error(e); }
    }
    const savedSettings = localStorage.getItem('nur_daily_settings');
    if (savedSettings) {
      try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) }); } catch (e) { console.error(e); }
    }
  }, []);

  // Theme Management
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all possible theme classes
    root.classList.remove('dark', 'theme-light', 'theme-dark', 'theme-royal');

    if (settings.theme === 'dark') {
      root.classList.add('dark', 'theme-dark');
      root.style.colorScheme = 'dark';
    } else if (settings.theme === 'royal') {
      root.classList.add('dark', 'theme-royal'); // Royal is dark-based
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('theme-light');
      root.style.colorScheme = 'light';
    }
  }, [settings.theme]);

  const saveEntry = (entry: DailyEntry) => {
    setEntries(prev => {
      const filtered = prev.filter(e => e.date.split('T')[0] !== entry.date.split('T')[0]);
      const newEntries = [entry, ...filtered].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      localStorage.setItem('nur_daily_entries', JSON.stringify(newEntries));
      return newEntries;
    });
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => {
      const newEntries = prev.filter(e => e.id !== id);
      localStorage.setItem('nur_daily_entries', JSON.stringify(newEntries));
      return newEntries;
    });
  };

  const handleEditRecord = (dateStr: string) => {
    setSelectedDate(new Date(dateStr));
    setCurrentView(View.DASHBOARD);
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
    if (confirm('DANGER: This will delete ALL your progress. Are you sure?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-emerald-50 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 17c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-emerald-900 mb-4 tracking-tight">Configuration Required</h2>
          <p className="text-stone-500 text-sm mb-8">Please add your <code className="font-mono bg-stone-100 p-1">API_KEY</code> to the environment variables to continue.</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD: return <Dashboard date={selectedDate} onDateChange={setSelectedDate} entries={entries} onSave={saveEntry} />;
      case View.TASBEEH: return <TasbeehCounter />;
      case View.RECORDS: return <Records entries={entries} onDelete={deleteEntry} onEdit={handleEditRecord} />;
      case View.ANALYTICS: return <Analytics entries={entries} />;
      case View.SETTINGS: return <SettingsView settings={settings} onUpdateSettings={updateSettings} onExportJSON={exportJSON} onRestoreJSON={(e) => { setEntries(e); localStorage.setItem('nur_daily_entries', JSON.stringify(e)); }} onReset={resetApp} />;
      default: return <Dashboard date={selectedDate} onDateChange={setSelectedDate} entries={entries} onSave={saveEntry} />;
    }
  };

  return (
    <div className="flex min-h-screen transition-colors duration-300">
      <Sidebar currentView={currentView} setView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex lg:hidden items-center justify-between px-6 py-4 border-b">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-emerald-900">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
          <div className="text-xl font-bold tracking-tight">Nur Daily</div>
          <div className="w-10 h-10 bg-emerald-100 rounded-full"></div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">{renderContent()}</main>
      </div>
    </div>
  );
};

export default App;
