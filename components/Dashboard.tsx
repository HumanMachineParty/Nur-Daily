
import React, { useState, useEffect, useCallback } from 'react';
import { DailyEntry, DailyInspiration } from '../types';
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
  const [hijriDateStr, setHijriDateStr] = useState<string>("");
  const [newTaskText, setNewTaskText] = useState("");

  const updateHijriDate = useCallback(async (targetDate: Date) => {
    const result = await fetchHijriDateOnline(targetDate);
    setHijriDateStr(result);
  }, []);

  useEffect(() => {
    updateHijriDate(date);
    const cached = getCachedInspiration();
    if (cached) setInspiration(cached);
    else fetchDailyInspiration().then(setInspiration);
  }, [date, updateHijriDate]);

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
        quran: null, workout: null, skill: { done: null, notes: '' }, customTasks: [], diary: ''
      });
    }
  }, [date, entries, hijriDateStr]);

  if (!currentEntry) return null;

  const updatePrayer = (key: keyof DailyEntry['prayers']) => {
    onSave({ ...currentEntry, prayers: { ...currentEntry.prayers, [key]: !currentEntry.prayers[key] } });
  };

  const addCustomTask = () => {
    if (!newTaskText.trim()) return;
    const newTask = { id: Math.random().toString(36).substr(2, 9), text: newTaskText.trim(), done: false };
    onSave({ ...currentEntry, customTasks: [...(currentEntry.customTasks || []), newTask] });
    setNewTaskText("");
  };

  const toggleCustomTask = (id: string) => {
    const updatedTasks = (currentEntry.customTasks || []).map(task => 
      task.id === id ? { ...task, done: !task.done } : task
    );
    onSave({ ...currentEntry, customTasks: updatedTasks });
  };

  const removeCustomTask = (id: string) => {
    const updatedTasks = (currentEntry.customTasks || []).filter(task => task.id !== id);
    onSave({ ...currentEntry, customTasks: updatedTasks });
  };

  const isToday = new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Date Navigation Header */}
      <div className="bg-white dark:bg-stone-900 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-stone-800 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 overflow-hidden">
        <div className="flex flex-col gap-1 items-center md:items-start w-full md:w-auto">
          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
            <input 
              type="date" 
              value={date.toISOString().split('T')[0]} 
              onChange={(e) => onDateChange(new Date(e.target.value))} 
              className="text-lg md:text-2xl font-black bg-transparent border-none p-0 focus:ring-0 cursor-pointer text-emerald-950 dark:text-emerald-400 w-auto" 
            />
            {!isToday && (
              <button 
                onClick={() => onDateChange(new Date())}
                className="px-3 py-1 bg-emerald-600 text-white text-[9px] font-black uppercase rounded-full shadow-lg hover:scale-105 transition-all"
              >
                Today
              </button>
            )}
          </div>
          <span className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-widest">Selected Timeline</span>
        </div>
        
        <div className="flex flex-col items-center md:items-end w-full md:w-auto">
          <div className="flex items-center gap-2 text-lg md:text-2xl font-amiri text-amber-600 text-center md:text-right">
            <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>
            <span className="truncate max-w-[200px] md:max-w-none font-bold tracking-tight">{hijriDateStr}</span>
          </div>
          <span className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none">Hijri Date</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {inspiration && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ayat Card - Optimized with prominent Arabic and theme-aware colors */}
              <div className="bg-emerald-700 dark:bg-stone-900 p-6 md:p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden border border-white/10 min-h-[300px] flex flex-col justify-center transition-all group">
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.12] dark:opacity-[0.1] pointer-events-none select-none font-amiri text-[12rem] tracking-tighter text-white">
                  الله
                </div>
                <div className="relative z-10 w-full text-center md:text-right">
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-4 text-white/60 dark:text-stone-500">Ayah of the Day</div>
                  {/* Prominent Arabic text */}
                  <p className="font-amiri text-3xl md:text-4xl text-white dark:text-amber-400 mb-6 leading-relaxed font-bold drop-shadow-md transition-colors">
                    {inspiration.ayah.arabic}
                  </p>
                  {/* Updated Translation Color: Vibrant Amber/Gold for contrast */}
                  <p className="font-urdu text-2xl md:text-3xl text-amber-100 dark:text-amber-200 mb-2 font-bold leading-relaxed drop-shadow-sm">
                    {inspiration.ayah.urdu}
                  </p>
                  <p className="text-[10px] font-bold italic opacity-50 text-white dark:text-stone-500 mt-4">{inspiration.ayah.ref}</p>
                </div>
              </div>

              {/* Hadith Card - Optimized with prominent Arabic and theme-aware colors */}
              <div className="bg-white dark:bg-stone-800 p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-stone-700 shadow-lg relative overflow-hidden min-h-[300px] flex flex-col justify-center transition-all group">
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.12] dark:opacity-[0.1] pointer-events-none select-none font-amiri text-[12rem] tracking-tighter text-emerald-900 dark:text-white">
                  محمد
                </div>
                <div className="relative z-10 w-full text-center md:text-right">
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-4 text-stone-400">Daily Hadith</div>
                  {/* Prominent Arabic text */}
                  <p className="font-amiri text-2xl md:text-3xl text-emerald-900 dark:text-amber-400 mb-6 leading-relaxed font-bold transition-colors">
                    {inspiration.hadith.arabic}
                  </p>
                  
                  <p className="font-urdu text-xl md:text-2xl text-emerald-700 dark:text-emerald-400 font-bold leading-relaxed">
                    {inspiration.hadith.urdu}
                  </p>
                  <p className="text-[10px] font-bold italic opacity-30 text-stone-500 mt-4">{inspiration.hadith.ref}</p>
                </div>
              </div>
            </div>
          )}

          {/* Checklist */}
          <div className="bg-white dark:bg-stone-900 p-6 md:p-8 rounded-[2.5rem] shadow-lg border border-gray-100 dark:border-stone-800 space-y-8">
            <h3 className="text-lg font-black flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
              Salah Tracking
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(Object.keys(currentEntry.prayers) as Array<keyof DailyEntry['prayers']>).map((p) => (
                <button key={p} onClick={() => updatePrayer(p)} className={`px-2 py-4 rounded-3xl text-[9px] font-black uppercase transition-all flex flex-col items-center gap-2 border-2 ${currentEntry.prayers[p] ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-stone-800 border-transparent text-stone-400'}`}>
                  {p}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${currentEntry.prayers[p] ? 'bg-white/20 border-white' : 'border-stone-300'}`}>
                    {currentEntry.prayers[p] && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-8 border-t border-gray-100 dark:border-stone-800 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 md:p-4 rounded-2xl bg-gray-100 dark:bg-stone-800">
                  <span className="font-bold uppercase text-[9px] md:text-[10px] text-stone-500">Quran Status</span>
                  <div className="flex gap-1">
                    {['Yes', 'No'].map(v => (
                      <button key={v} onClick={() => onSave({...currentEntry, quran: v as 'Yes'|'No'})} className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${currentEntry.quran === v ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-stone-900 text-stone-400'}`}>{v}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 md:p-4 rounded-2xl bg-gray-100 dark:bg-stone-800">
                  <span className="font-bold uppercase text-[9px] md:text-[10px] text-stone-500">Workout</span>
                  <div className="flex gap-1">
                    {['Yes', 'No'].map(v => (
                      <button key={v} onClick={() => onSave({...currentEntry, workout: v as 'Yes'|'No'})} className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${currentEntry.workout === v ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-stone-900 text-stone-400'}`}>{v}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 md:p-4 rounded-2xl bg-gray-100 dark:bg-stone-800">
                  <span className="font-bold uppercase text-[9px] md:text-[10px] text-stone-500">Skill Learning</span>
                  <div className="flex gap-1">
                    {['Yes', 'No'].map(v => (
                      <button key={v} onClick={() => onSave({...currentEntry, skill: { ...currentEntry.skill, done: v as 'Yes'|'No' }})} className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${currentEntry.skill.done === v ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-stone-900 text-stone-400'}`}>{v}</button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className={`flex flex-col gap-2 transition-all duration-300 ${currentEntry.skill.done === 'Yes' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none hidden'}`}>
                <span className="font-bold uppercase text-[10px] text-stone-500 ml-1">Learning Notes</span>
                <textarea 
                  placeholder="Today's learnings..." 
                  value={currentEntry.skill.notes} 
                  onChange={(e) => onSave({...currentEntry, skill: { ...currentEntry.skill, notes: e.target.value }})} 
                  className="w-full h-full min-h-[100px] p-4 text-sm rounded-2xl border bg-gray-50 dark:bg-stone-800 outline-none resize-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100 dark:border-stone-800">
              <h3 className="text-lg font-black flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                Other Goals
              </h3>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTask()}
                  placeholder="New goal..."
                  className="flex-1 px-3 py-2 rounded-xl border bg-gray-50 dark:bg-stone-800 outline-none text-xs md:text-sm focus:ring-2 focus:ring-emerald-500 min-w-0"
                />
                <button 
                  onClick={addCustomTask}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-xl font-black shadow-md hover:scale-105 active:scale-95 transition-all text-[10px] md:text-xs flex-shrink-0"
                >
                  Add
                </button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                {(currentEntry.customTasks || []).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-100 dark:bg-stone-800 border border-transparent group">
                    <button 
                      onClick={() => toggleCustomTask(task.id)} 
                      className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center flex-shrink-0 ${task.done ? 'bg-emerald-600 border-emerald-600' : 'bg-white dark:bg-stone-900 border-stone-300'}`}
                    >
                      {task.done && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <span className={`text-[11px] md:text-xs flex-1 font-bold ${task.done ? 'line-through opacity-40' : 'text-emerald-950 dark:text-emerald-50'}`}>{task.text}</span>
                    <button onClick={() => removeCustomTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-red-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-emerald-900 p-6 md:p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col min-h-[350px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"></div>
          <h3 className="text-xl font-bold flex items-center gap-3 mb-6 relative">
            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Diary Entry
          </h3>
          <textarea 
            placeholder="Reflect on your spiritual journey today..." 
            value={currentEntry.diary} 
            onChange={(e) => onSave({...currentEntry, diary: e.target.value})} 
            className="flex-1 w-full bg-black/20 border-none rounded-2xl p-4 text-emerald-50 placeholder-emerald-400/30 outline-none resize-none text-sm leading-relaxed focus:bg-black/30 transition-all" 
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
