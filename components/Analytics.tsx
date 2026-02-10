
import React, { useState, useMemo, useEffect } from 'react';
import { DailyEntry } from '../types';

interface AnalyticsProps {
  entries: DailyEntry[];
}

interface TasbeehSession {
  id: string;
  label: string;
  count: number;
  timestamp: string;
  isoDate: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ entries }) => {
  const [filterRange, setFilterRange] = useState<'7' | '30' | 'all'>('7');
  const [tasbeehHistory, setTasbeehHistory] = useState<TasbeehSession[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('tasbeeh_history');
    if (saved) setTasbeehHistory(JSON.parse(saved));
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    let cutoff = new Date(0);
    if (filterRange === '7') cutoff = new Date(now.setDate(now.getDate() - 7));
    else if (filterRange === '30') cutoff = new Date(now.setDate(now.getDate() - 30));

    const filteredEntries = entries.filter(e => new Date(e.date) >= cutoff);
    const filteredTasbeeh = tasbeehHistory.filter(h => {
      // Fallback for older entries without isoDate
      const d = h.isoDate ? new Date(h.isoDate) : new Date(h.timestamp);
      return d >= cutoff;
    });

    const totalDays = filteredEntries.length || 1;
    
    // Prayers
    let totalPrayers = 0;
    filteredEntries.forEach(e => {
      Object.values(e.prayers).forEach(p => { if (p) totalPrayers++; });
    });

    // Habits
    const workoutDays = filteredEntries.filter(e => e.workout === 'Yes').length;
    const skillDays = filteredEntries.filter(e => e.skill.done === 'Yes').length;
    const quranDays = filteredEntries.filter(e => e.quran === 'Yes').length;

    // Tasbeeh
    const totalTasbeeh = filteredTasbeeh.reduce((acc, curr) => acc + curr.count, 0);
    const daroodCount = filteredTasbeeh
      .filter(h => h.label === 'Darood Pak')
      .reduce((acc, curr) => acc + curr.count, 0);

    return {
      totalPrayers,
      prayerConsistency: Math.round((totalPrayers / (totalDays * 5)) * 100),
      workoutConsistency: Math.round((workoutDays / totalDays) * 100),
      skillConsistency: Math.round((skillDays / totalDays) * 100),
      quranConsistency: Math.round((quranDays / totalDays) * 100),
      totalTasbeeh,
      daroodCount,
      totalDays
    };
  }, [entries, tasbeehHistory, filterRange]);

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-emerald-900 dark:text-emerald-400">Activity Analytics</h2>
          <p className="text-stone-500 text-sm">Visualize your spiritual growth and habit consistency</p>
        </div>
        <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl shadow-inner">
          {(['7', '30', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRange(r)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${filterRange === r ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-500 hover:text-emerald-600'}`}
            >
              {r === 'all' ? 'All Time' : `Last ${r} Days`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Prayers */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-[2.5rem] shadow-lg border border-emerald-50 dark:border-stone-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-110"></div>
          <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Prayers</div>
          <div className="text-4xl font-black text-emerald-900 dark:text-emerald-400 mb-2">{stats.totalPrayers}</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${stats.prayerConsistency}%` }}></div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600">{stats.prayerConsistency}%</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-2">Overall Consistency</p>
        </div>

        {/* Total Tasbeeh */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-[2.5rem] shadow-lg border border-emerald-50 dark:border-stone-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-110"></div>
          <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Dhikr</div>
          <div className="text-4xl font-black text-amber-600 mb-2">{stats.totalTasbeeh.toLocaleString()}</div>
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Total Counts</p>
        </div>

        {/* Darood Pak Specific */}
        <div className="bg-emerald-900 dark:bg-stone-900 p-6 rounded-[2.5rem] shadow-lg border border-emerald-800 dark:border-stone-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-110"></div>
          <div className="text-[10px] font-black text-emerald-300 dark:text-stone-500 uppercase tracking-widest mb-1">Darood Pak</div>
          <div className="text-4xl font-black text-white dark:text-emerald-400 mb-2">{stats.daroodCount.toLocaleString()}</div>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Completed Sessions</p>
        </div>

        {/* Consistency Overview */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-[2.5rem] shadow-lg border border-emerald-50 dark:border-stone-800 relative overflow-hidden group">
          <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">Habit Consistency</div>
          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400">Quran</span>
                <span className="text-[10px] font-bold text-emerald-600">{stats.quranConsistency}%</span>
             </div>
             <div className="h-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${stats.quranConsistency}%` }}></div>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400">Workout</span>
                <span className="text-[10px] font-bold text-emerald-600">{stats.workoutConsistency}%</span>
             </div>
             <div className="h-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${stats.workoutConsistency}%` }}></div>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400">Skill Growth</span>
                <span className="text-[10px] font-bold text-emerald-600">{stats.skillConsistency}%</span>
             </div>
             <div className="h-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${stats.skillConsistency}%` }}></div>
             </div>
          </div>
        </div>
      </div>

      {/* Detail Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spiritual Momentum */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-8 rounded-[3rem] shadow-xl border border-stone-100 dark:border-stone-800">
           <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-6 flex items-center gap-2">
             <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             Consistency Report
           </h3>
           <div className="space-y-6">
              <div className="flex flex-col gap-2">
                 <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Daily Prayer Consistency</span>
                    <span className="text-sm font-black text-emerald-600">{stats.prayerConsistency}%</span>
                 </div>
                 <div className="h-4 bg-stone-50 dark:bg-stone-800 rounded-full border border-stone-100 dark:border-stone-700 overflow-hidden relative">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${stats.prayerConsistency}%` }}></div>
                    <div className="absolute inset-0 flex justify-around items-center opacity-10">
                       {[...Array(5)].map((_, i) => <div key={i} className="w-px h-full bg-black"></div>)}
                    </div>
                 </div>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Your prayer consistency is based on completing all 5 daily prayers across {stats.totalDays} tracked days in this period.
              </p>
           </div>
        </div>

        {/* Milestone Card */}
        <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-8 rounded-[3rem] shadow-2xl text-white flex flex-col justify-center items-center text-center">
           <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
           </div>
           <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Spiritual Milestone</div>
           <h3 className="text-3xl font-black mb-2">Steady Progress</h3>
           <p className="text-sm opacity-90 leading-relaxed">
             "The most beloved of deeds to Allah are those that are most consistent, even if they are small."
           </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
