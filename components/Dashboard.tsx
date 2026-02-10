
import React, { useState, useEffect, useCallback } from 'react';
import { DailyEntry, DailyInspiration, CustomTask } from '../types';
import { fetchHijriDateOnline, fetchDailyInspiration, getCachedInspiration } from '../services/islamicService';

interface DashboardProps {
  date: Date;
  onDateChange: (d: Date) => void;
  entries: DailyEntry[];
  onSave: (entry: DailyEntry) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ date, onDateChange, entries, onSave }) => {
  const [inspiration, setInspiration] = useState<DailyInspiration | null>(null);
  const [currentEntry, setCurrentEntry] = useState<DailyEntry | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hijriDateStr, setHijriDateStr] = useState<string>("...");
  const [newTaskText, setNewTaskText] = useState("");

  // Optimized fetcher for Hijri date
  const updateHijriDate = useCallback(async (targetDate: Date) => {
    const result = await fetchHijriDateOnline(targetDate);
    setHijriDateStr(result);
  }, []);

  // Clock Update Effect & Midnight Watcher
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Auto-refresh at midnight
      if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
        const today = new Date();
        onDateChange(today);
        fetchDailyInspiration().then(setInspiration);
        updateHijriDate(today);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [onDateChange, updateHijriDate]);

  // Fetch Hijri date whenever the date prop changes
  useEffect(() => {
    updateHijriDate(date);
  }, [date, updateHijriDate]);

  // Load Daily Inspiration (from cache first)
  useEffect(() => {
    const cached = getCachedInspiration();
    if (cached) {
      setInspiration(cached);
    } else {
      fetchDailyInspiration().then(setInspiration);
    }
  }, []);

  // Sync current entry with selected date
  useEffect(() => {
    const dateStr = date.toISOString().split('T')[0];
    const existing = entries.find(e => e.date.split('T')[0] === dateStr);
    
    if (existing) {
      setCurrentEntry(existing);
    } else {
      setCurrentEntry({
        id: Math.random().toString(36).substr(2, 9),
        date: date.toISOString(),
        hijriDate: hijriDateStr,
        prayers: { fajr: false, zuhr: false, asar: false, maghrib: false, esha: false },
        quran: null,
        workout: null,
        skill: { done: null, notes: '' },
        customTasks: [],
        diary: ''
      });
    }
  }, [date, entries, hijriDateStr]);

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const handleRefreshToToday = () => {
    const now = new Date();
    onDateChange(now);
    const cached = getCachedInspiration();
    if (cached) setInspiration(cached);
    else fetchDailyInspiration().then(setInspiration);
    updateHijriDate(now);
  };

  if (!currentEntry) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-emerald-900 dark:text-emerald-400 font-medium">Initializing Dashboard...</p>
      </div>
    </div>
  );

  const updatePrayer = (key: keyof DailyEntry['prayers']) => {
    const updated = { ...currentEntry, prayers: { ...currentEntry.prayers, [key]: !currentEntry.prayers[key] } };
    onSave(updated);
  };

  const handleSimpleToggle = (field: 'quran' | 'workout', value: 'Yes' | 'No') => {
    const updated = { ...currentEntry, [field]: value };
    onSave(updated);
  };

  const handleSkillToggle = (value: 'Yes' | 'No') => {
    const updated = { ...currentEntry, skill: { ...currentEntry.skill, done: value } };
    onSave(updated);
  };

  const addCustomTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: CustomTask = {
      id: Math.random().toString(36).substr(2, 9),
      text: newTaskText.trim(),
      done: false
    };
    const updated = { ...currentEntry, customTasks: [...(currentEntry.customTasks || []), newTask] };
    onSave(updated);
    setNewTaskText("");
  };

  const toggleCustomTask = (id: string) => {
    const updatedTasks = (currentEntry.customTasks || []).map(task => 
      task.id === id ? { ...task, done: !task.done } : task
    );
    onSave({ ...currentEntry, customTasks: updatedTasks });
  };

  const deleteCustomTask = (id: string) => {
    const updatedTasks = (currentEntry.customTasks || []).filter(task => task.id !== id);
    onSave({ ...currentEntry, customTasks: updatedTasks });
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-emerald-50 dark:border-stone-800 transition-colors">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <input 
                type="date" 
                value={date.toISOString().split('T')[0]} 
                onChange={(e) => onDateChange(new Date(e.target.value))}
                className="text-2xl font-extrabold bg-transparent border-none focus:ring-0 text-emerald-900 dark:text-emerald-400 cursor-pointer p-0 appearance-none"
              />
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform"></div>
            </div>
            
            <button 
              onClick={handleRefreshToToday}
              title="Refresh to Today"
              className={`p-2 rounded-xl transition-all ${isToday(date) ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold tracking-widest mt-1">
            {isToday(date) ? 'Tracking Today' : 'Viewing Record'}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-emerald-600 dark:text-emerald-400 font-bold flex flex-col items-end">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                <span className={`text-xl font-amiri tracking-wide transition-all ${hijriDateStr === '...' ? 'opacity-30' : 'opacity-100'}`}>
                  {hijriDateStr}
                </span>
              </div>
              <div className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] font-bold mt-1">
                Authentic Hijri Date
              </div>
            </div>
          </div>
          
          <div className="h-10 w-px bg-stone-100 dark:bg-stone-800 hidden md:block"></div>
          
          <div className="text-right hidden sm:block">
            <div className="text-stone-600 dark:text-stone-300 font-mono text-lg font-bold">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] font-bold">
              Local Time
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Inspiration Cards */}
        <div className="lg:col-span-2 space-y-6">
          {inspiration ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-colors"></div>
                <div className="flex items-center gap-2 mb-4 text-emerald-300">
                  <span className="text-xs font-bold uppercase tracking-widest">Ayah of the Day</span>
                </div>
                <p className="font-amiri text-2xl text-right mb-4 leading-relaxed tracking-wide min-h-[4rem]">
                  {inspiration.ayah.arabic}
                </p>
                <p className="font-urdu text-lg text-right text-emerald-100 mb-2">
                  {inspiration.ayah.urdu}
                </p>
                <p className="text-xs text-emerald-400 italic font-medium">{inspiration.ayah.ref}</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-stone-800 dark:to-stone-900 p-6 rounded-3xl text-emerald-900 dark:text-emerald-100 shadow-xl border border-amber-200 dark:border-stone-700 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/50 dark:bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-amber-200/70 transition-colors"></div>
                <div className="flex items-center gap-2 mb-4 text-amber-700 dark:text-amber-500">
                  <span className="text-xs font-bold uppercase tracking-widest">Daily Hadith</span>
                </div>
                <p className="font-amiri text-xl mb-4 leading-relaxed min-h-[3rem]">
                  {inspiration.hadith.text}
                </p>
                <p className="font-urdu text-lg text-emerald-800 dark:text-emerald-300 mb-2">
                  {inspiration.hadith.urdu}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-600 italic font-medium">{inspiration.hadith.ref}</p>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800">
               <div className="animate-pulse flex flex-col items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full"></div>
                 <div className="text-stone-400 text-sm font-medium">Fetching spiritual guidance...</div>
               </div>
            </div>
          )}

          {/* Habit Tracking Section */}
          <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-lg border border-emerald-50 dark:border-stone-800 space-y-8 transition-colors">
            {/* Prayer Tracking */}
            <div>
              <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                Prayers Checklist
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(Object.keys(currentEntry.prayers) as Array<keyof DailyEntry['prayers']>).map((p) => (
                  <button
                    key={p}
                    onClick={() => updatePrayer(p)}
                    className={`
                      px-4 py-4 rounded-2xl text-sm font-bold uppercase transition-all flex flex-col items-center gap-2
                      ${currentEntry.prayers[p] 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-400 border-2 border-emerald-300 dark:border-emerald-700 shadow-sm' 
                        : 'bg-stone-50 dark:bg-stone-800 text-stone-400 dark:text-stone-600 border-2 border-transparent hover:bg-stone-100 dark:hover:bg-stone-700'}
                    `}
                  >
                    <span className="text-xs opacity-60 tracking-widest">{p}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${currentEntry.prayers[p] ? 'bg-emerald-600 border-emerald-600' : 'border-stone-300 dark:border-stone-600'}`}>
                      {currentEntry.prayers[p] && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Other Habits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 uppercase text-xs tracking-widest">Quran Recitation</span>
                  <div className="flex gap-2">
                    {['Yes', 'No'].map((v) => (
                      <button
                        key={v}
                        onClick={() => handleSimpleToggle('quran', v as 'Yes' | 'No')}
                        className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${currentEntry.quran === v ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-stone-900 text-stone-400'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 uppercase text-xs tracking-widest">Workout</span>
                  <div className="flex gap-2">
                    {['Yes', 'No'].map((v) => (
                      <button
                        key={v}
                        onClick={() => handleSimpleToggle('workout', v as 'Yes' | 'No')}
                        className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${currentEntry.workout === v ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-stone-900 text-stone-400'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 uppercase text-xs tracking-widest">Skill Done</span>
                  <div className="flex gap-2">
                    {['Yes', 'No'].map((v) => (
                      <button
                        key={v}
                        onClick={() => handleSkillToggle(v as 'Yes' | 'No')}
                        className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${currentEntry.skill.done === v ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-stone-900 text-stone-400'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  placeholder="Notes (e.g., Coding, Urdu, etc.)"
                  value={currentEntry.skill.notes}
                  onChange={(e) => onSave({...currentEntry, skill: { ...currentEntry.skill, notes: e.target.value }})}
                  className="w-full h-16 p-3 text-sm rounded-xl border border-stone-200 dark:border-stone-700 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-stone-900 dark:text-white transition-colors"
                />
              </div>
            </div>

            {/* Custom Tasks Section */}
            <div className="pt-8 border-t border-stone-100 dark:border-stone-800">
              <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                Custom Tasks
              </h3>
              
              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTask()}
                  placeholder="What else do you want to achieve?"
                  className="flex-1 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                />
                <button 
                  onClick={addCustomTask}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-md"
                >
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {(currentEntry.customTasks || []).length === 0 ? (
                  <p className="text-stone-400 italic text-sm text-center py-4">No custom tasks added for this day.</p>
                ) : (
                  (currentEntry.customTasks || []).map((task) => (
                    <div 
                      key={task.id} 
                      className="group flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 transition-all hover:border-emerald-200 dark:hover:border-emerald-900"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <button 
                          onClick={() => toggleCustomTask(task.id)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${task.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300 dark:border-stone-600'}`}
                        >
                          {task.done && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <span className={`text-sm font-medium transition-all ${task.done ? 'text-stone-400 line-through' : 'text-stone-700 dark:text-stone-200'}`}>
                          {task.text}
                        </span>
                      </div>
                      <button 
                        onClick={() => deleteCustomTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-stone-400 hover:text-red-500 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Diary */}
        <div className="space-y-6">
          <div className="bg-emerald-900 p-8 rounded-3xl text-white shadow-xl h-full min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                My Diary
              </h3>
              <button 
                onClick={() => onSave(currentEntry)}
                className="text-xs bg-emerald-700 px-3 py-1 rounded-full hover:bg-emerald-600 transition-colors"
              >
                Auto-Saved
              </button>
            </div>
            <textarea
              placeholder="Reflect on your day here..."
              value={currentEntry.diary}
              onChange={(e) => onSave({...currentEntry, diary: e.target.value})}
              className="flex-1 w-full bg-emerald-800 border-none rounded-2xl p-4 text-emerald-50 placeholder-emerald-400 focus:ring-amber-400 focus:ring-1 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
