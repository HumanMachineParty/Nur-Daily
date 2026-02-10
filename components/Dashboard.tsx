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

  const updateHijriDate = useCallback(async (targetDate: Date) => {
    const result = await fetchHijriDateOnline(targetDate);
    setHijriDateStr(result);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
        onDateChange(new Date());
        fetchDailyInspiration().then(setInspiration);
        updateHijriDate(new Date());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [onDateChange, updateHijriDate]);

  useEffect(() => {
    updateHijriDate(date);
  }, [date, updateHijriDate]);

  useEffect(() => {
    const cached = getCachedInspiration();
    if (cached) setInspiration(cached);
    else fetchDailyInspiration().then(setInspiration);
  }, []);

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

  if (!currentEntry) return null;

  const updatePrayer = (key: keyof DailyEntry['prayers']) => {
    onSave({ ...currentEntry, prayers: { ...currentEntry.prayers, [key]: !currentEntry.prayers[key] } });
  };

  const handleSimpleToggle = (field: 'quran' | 'workout', value: 'Yes' | 'No') => {
    onSave({ ...currentEntry, [field]: value });
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

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Date Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <input 
              type="date" 
              value={date.toISOString().split('T')[0]} 
              onChange={(e) => onDateChange(new Date(e.target.value))}
              className="text-2xl font-extrabold bg-transparent border-none focus:ring-0 cursor-pointer p-0 appearance-none"
            />
            <button onClick={() => onDateChange(new Date())} className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
          <div className="text-xs uppercase font-bold tracking-widest mt-1 opacity-50">Journal Navigation</div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              <span className="text-xl font-amiri tracking-wide">{hijriDateStr}</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold mt-1 opacity-50">Hijri Calendar</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {inspiration && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="text-xs font-bold uppercase tracking-widest mb-4 opacity-70">Ayah of the Day</div>
                <p className="font-amiri text-2xl text-right mb-4 leading-relaxed">{inspiration.ayah.arabic}</p>
                <p className="font-urdu text-lg text-right opacity-90 mb-2">{inspiration.ayah.urdu}</p>
                <p className="text-[10px] font-bold italic opacity-60 text-right">{inspiration.ayah.ref}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-200 relative overflow-hidden group">
                <div className="text-xs font-bold uppercase tracking-widest mb-4 opacity-50">Daily Hadith</div>
                <p className="font-amiri text-xl mb-4 leading-relaxed text-emerald-900">{inspiration.hadith.text}</p>
                <p className="font-urdu text-lg opacity-80 mb-2">{inspiration.hadith.urdu}</p>
                <p className="text-[10px] font-bold italic opacity-50">{inspiration.hadith.ref}</p>
              </div>
            </div>
          )}

          {/* Checklist Card */}
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-200 space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                Prayers Checklist
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(Object.keys(currentEntry.prayers) as Array<keyof DailyEntry['prayers']>).map((p) => (
                  <button
                    key={p}
                    onClick={() => updatePrayer(p)}
                    className={`px-4 py-4 rounded-2xl text-xs font-bold uppercase transition-all flex flex-col items-center gap-2 border-2 
                      ${currentEntry.prayers[p] ? 'checklist-item-on' : 'checklist-item-off'}`}
                  >
                    <span className="tracking-tighter">{p}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all 
                      ${currentEntry.prayers[p] ? 'bg-white/20 border-white' : 'bg-transparent border-current opacity-40'}`}>
                      {currentEntry.prayers[p] && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-100 border border-gray-200">
                  <span className="font-bold uppercase text-[10px] tracking-widest opacity-60">Quran Status</span>
                  <div className="flex gap-2">
                    {['Yes', 'No'].map((v) => (
                      <button 
                        key={v} 
                        onClick={() => handleSimpleToggle('quran', v as 'Yes' | 'No')} 
                        className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all border 
                          ${currentEntry.quran === v ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-gray-500 border-gray-300'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-100 border border-gray-200">
                  <span className="font-bold uppercase text-[10px] tracking-widest opacity-60">Daily Workout</span>
                  <div className="flex gap-2">
                    {['Yes', 'No'].map((v) => (
                      <button 
                        key={v} 
                        onClick={() => handleSimpleToggle('workout', v as 'Yes' | 'No')} 
                        className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all border
                          ${currentEntry.workout === v ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-gray-500 border-gray-300'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-100 border border-gray-200 flex flex-col gap-3">
                 <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                   Daily Learning
                 </div>
                <textarea
                  placeholder="Record your achievements..."
                  value={currentEntry.skill.notes}
                  onChange={(e) => onSave({...currentEntry, skill: { ...currentEntry.skill, notes: e.target.value }})}
                  className="w-full h-24 p-3 text-sm rounded-xl border bg-white focus:ring-emerald-500 transition-colors outline-none resize-none"
                />
              </div>
            </div>

            <div className="pt-8 border-t border-gray-200">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                Other Goals
              </h3>
              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTask()}
                  placeholder="Anything else for today?"
                  className="flex-1 px-4 py-3 rounded-xl border bg-gray-100 outline-none text-sm"
                />
                <button onClick={addCustomTask} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:brightness-110 active:scale-95 transition-all text-sm">Add</button>
              </div>
              <div className="space-y-2">
                {(currentEntry.customTasks || []).map(task => (
                  <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-100 border border-gray-200 group hover:border-emerald-300">
                    <button onClick={() => toggleCustomTask(task.id)} className={`w-6 h-6 rounded-full border transition-all ${task.done ? 'bg-emerald-600 border-emerald-600 shadow-sm' : 'bg-white border-gray-300'}`}>
                      {task.done && <svg className="w-4 h-4 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <span className={`text-sm flex-1 font-medium ${task.done ? 'line-through opacity-40' : ''}`}>{task.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Diary Sidebar */}
        <div className="space-y-6">
          <div className="bg-emerald-900 p-8 rounded-3xl text-white shadow-xl h-full min-h-[400px] flex flex-col relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>
            <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              My Diary
            </h3>
            <textarea
              placeholder="Reflect on your spiritual journey today..."
              value={currentEntry.diary}
              onChange={(e) => onSave({...currentEntry, diary: e.target.value})}
              className="flex-1 w-full bg-black/20 border-none rounded-2xl p-5 text-emerald-50 placeholder-emerald-400/40 outline-none resize-none text-sm leading-relaxed"
            />
            <div className="mt-6 flex items-center justify-between opacity-50 text-[10px] font-black uppercase tracking-widest">
              <span>Personal Reflection</span>
              <span>Keep Growing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;