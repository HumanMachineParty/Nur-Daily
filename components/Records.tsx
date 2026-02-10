
import React, { useState, useMemo } from 'react';
import { DailyEntry } from '../types';

interface RecordsProps {
  entries: DailyEntry[];
  onDelete: (id: string) => void;
  onEdit: (dateStr: string) => void;
}

const Records: React.FC<RecordsProps> = ({ entries, onDelete, onEdit }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter and sort entries: Latest date first
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(e => new Date(e.date) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(e => new Date(e.date) <= end);
    }

    return filtered.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [entries, startDate, endDate]);

  const exportToExcel = () => {
    if (filteredEntries.length === 0) return;

    // Headers updated to include Custom Tasks
    const headers = [
      'Date', 'Hijri Date', 'Fajr', 'Zuhr', 'Asar', 'Maghrib', 'Esha', 
      'Quran', 'Workout', 'Skill Done', 'Skill Notes', 'Custom Tasks', 'Diary'
    ];
    
    // Rows mapping
    const rows = filteredEntries.map(e => {
      // Stringify custom tasks for CSV: [Done] Task name; [Pending] Task name
      const tasksStr = (e.customTasks || [])
        .map(t => `${t.done ? '[Done]' : '[Pending]'} ${t.text}`)
        .join('; ');

      return [
        `"${new Date(e.date).toLocaleDateString('en-GB')}"`,
        `"${e.hijriDate.replace(/"/g, '""')}"`,
        `"${e.prayers.fajr ? 'Yes' : 'No'}"`,
        `"${e.prayers.zuhr ? 'Yes' : 'No'}"`,
        `"${e.prayers.asar ? 'Yes' : 'No'}"`,
        `"${e.prayers.maghrib ? 'Yes' : 'No'}"`,
        `"${e.prayers.esha ? 'Yes' : 'No'}"`,
        `"${e.quran || 'No'}"`,
        `"${e.workout || 'No'}"`,
        `"${e.skill.done || 'No'}"`,
        `"${e.skill.notes.replace(/"/g, '""')}"`,
        `"${tasksStr.replace(/"/g, '""')}"`,
        `"${e.diary.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.map(h => `"${h}"`), ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nur_daily_records_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="max-w-5xl mx-auto py-6">
      {/* Header & Export */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-emerald-900 dark:text-emerald-400">Historical Records</h2>
          <p className="text-stone-500 text-sm">Review your spiritual progress and habits</p>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button 
            onClick={exportToExcel}
            disabled={filteredEntries.length === 0}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export CSV (Excel)
          </button>
          <div className="text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl text-sm font-bold border border-emerald-100 min-w-[100px] text-center">
            {filteredEntries.length} Records
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">From:</span>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-sm border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-white rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-1.5"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">To:</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-sm border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-white rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-1.5"
          />
        </div>
        {(startDate || endDate) && (
          <button 
            onClick={clearFilters}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline px-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {filteredEntries.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 p-20 rounded-3xl text-center border-2 border-dashed border-stone-200 dark:border-stone-800">
          <div className="w-20 h-20 bg-stone-50 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg className="w-10 h-10 text-stone-300 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">No records found for this period</h3>
          <p className="text-stone-500">Try adjusting your date filters or start a new entry.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div 
              key={entry.id} 
              className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-md border border-stone-100 dark:border-stone-800 flex flex-col md:flex-row items-start md:items-center gap-6 transition-all hover:shadow-lg"
            >
              <div className="min-w-[140px] cursor-pointer group" onClick={() => onEdit(entry.date)}>
                <div className="text-lg font-bold text-emerald-900 dark:text-emerald-400 group-hover:underline">
                  {new Date(entry.date).toLocaleDateString('en-GB')}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-500 font-medium">
                  {entry.hijriDate}
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 w-full">
                {/* Prayer Summary */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-1">Prayers</span>
                  <div className="flex gap-1">
                    {Object.values(entry.prayers).map((p, i) => (
                      <div key={i} className={`w-2 h-4 rounded-full ${p ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-800'}`} title={['Fajr', 'Zuhr', 'Asar', 'Maghrib', 'Esha'][i]} />
                    ))}
                  </div>
                </div>

                {/* Other Habits */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-1">Quran</span>
                  <span className={`text-sm font-bold ${entry.quran === 'Yes' ? 'text-emerald-600' : 'text-stone-400 dark:text-stone-600'}`}>
                    {entry.quran || 'N/A'}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-1">Workout</span>
                  <span className={`text-sm font-bold ${entry.workout === 'Yes' ? 'text-emerald-600' : 'text-stone-400 dark:text-stone-600'}`}>
                    {entry.workout || 'N/A'}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-1">Skill</span>
                  <span className={`text-sm font-bold ${entry.skill.done === 'Yes' ? 'text-emerald-600' : 'text-stone-400 dark:text-stone-600'}`}>
                    {entry.skill.done || 'N/A'}
                  </span>
                </div>

                {/* Tasks Summary Column */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-1">Tasks</span>
                  <span className={`text-sm font-bold ${(entry.customTasks?.length || 0) > 0 ? 'text-emerald-600' : 'text-stone-400 dark:text-stone-600'}`}>
                    {(entry.customTasks?.length || 0) > 0 
                      ? `${entry.customTasks.filter(t => t.done).length}/${entry.customTasks.length}` 
                      : 'None'}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-1">Diary Snippet</span>
                  <span className="text-sm text-stone-500 dark:text-stone-400 line-clamp-1 italic">
                    {entry.diary || 'No entry...'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onEdit(entry.date)}
                  className="p-3 text-stone-300 dark:text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                  title="Edit Record"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button 
                  onClick={() => {
                    if(confirm('Delete this record?')) onDelete(entry.id);
                  }}
                  className="p-3 text-stone-300 dark:text-stone-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                  title="Delete Record"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Records;
