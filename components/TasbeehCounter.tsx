
import React, { useState, useEffect, useRef } from 'react';

const DHIKR_OPTIONS = [
  { label: 'SubhanAllah', arabic: 'سُبْحَانَ ٱللَّٰهِ', translation: 'پاک ہے اللہ' },
  { label: 'Alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ', translation: 'تمام تعریفیں اللہ کے لیے ہیں' },
  { label: 'AllahuAkbar', arabic: 'ٱللَّٰهُ أَكْبَرُ', translation: 'اللہ سب سے بڑا ہے' },
  { label: 'Darood Pak', arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', translation: 'اے اللہ! محمد (ص) پر درود بھیج' },
  { label: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ', translation: 'میں اللہ سے معافی مانگتا ہوں' },
  { label: 'La Ilaha Illallah', arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', translation: 'اللہ کے سوا کوئی معبود نہیں' },
  { label: 'SubhanAllah wa Bi-hamdihi', arabic: 'سُبْحَانَ ٱللَّٰهِ وَبِحَمْدِهِ', translation: 'اللہ پاک ہے اور اپنی تعریفوں کے ساتھ' },
  { label: '4th Kalma', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', translation: 'اللہ کے سوا کوئی معبود نہیں، وہ اکیلا ہے' },
];

const TARGET_OPTIONS = [33, 100, 313, 1000, 0];

interface TasbeehSession {
  id: string;
  label: string;
  count: number;
  timestamp: string;
  isoDate: string; // Added for Analytics
}

const TasbeehCounter: React.FC = () => {
  const [count, setCount] = useState(0);
  const [selectedDhikr, setSelectedDhikr] = useState(DHIKR_OPTIONS[0]);
  const [target, setTarget] = useState(33);
  const [history, setHistory] = useState<TasbeehSession[]>([]);
  const [isAnimate, setIsAnimate] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tasbeeh_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const triggerHaptic = (type: 'tap' | 'completion') => {
    if (window.navigator.vibrate) {
      if (type === 'tap') window.navigator.vibrate(15);
      else window.navigator.vibrate([100, 50, 100]);
    }
  };

  const handleIncrement = () => {
    const newCount = count + 1;
    setCount(newCount);
    setIsAnimate(true);
    setTimeout(() => setIsAnimate(false), 100);

    triggerHaptic('tap');

    // Handle completion
    if (target > 0 && newCount === target) {
      triggerHaptic('completion');
      logSession(newCount);
    }
  };

  const logSession = (finalCount: number) => {
    const now = new Date();
    const newEntry: TasbeehSession = {
      id: Math.random().toString(36).substr(2, 9),
      label: selectedDhikr.label,
      count: finalCount,
      timestamp: now.toLocaleString([], { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isoDate: now.toISOString()
    };
    const updated = [newEntry, ...history].slice(0, 50); // Increased history buffer
    setHistory(updated);
    localStorage.setItem('tasbeeh_history', JSON.stringify(updated));
  };

  const resetCount = () => {
    if (count > 0 && target === 0) {
      logSession(count);
    }
    setCount(0);
  };

  const progress = target > 0 ? (count / target) * 100 : (count % 100);

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
      
      {/* Left Side: Professional Counter UI */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white dark:bg-stone-900 rounded-[3rem] shadow-2xl border border-emerald-50 dark:border-stone-800 p-8 flex flex-col items-center relative overflow-hidden">
          {/* Subtle Decorative Background */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500"></div>
          
          {/* Dhikr Info Display */}
          <div className="w-full text-center mb-10 mt-4">
            <h2 className="font-amiri text-4xl text-emerald-900 dark:text-emerald-400 mb-2 leading-relaxed">
              {selectedDhikr.arabic}
            </h2>
            <div className="text-xs font-black text-stone-400 uppercase tracking-[0.3em] mb-2">{selectedDhikr.label}</div>
            <p className="font-urdu text-xl text-emerald-700/80 dark:text-emerald-500/80">{selectedDhikr.translation}</p>
          </div>

          {/* Central Counter Area (The Tap Zone) */}
          <div 
            onClick={handleIncrement}
            className="relative w-80 h-80 flex items-center justify-center cursor-pointer select-none group active:scale-95 transition-all duration-150"
          >
            {/* Outer Glow Ring */}
            <div className={`absolute inset-0 rounded-full blur-3xl transition-opacity duration-300 ${isAnimate ? 'bg-emerald-500/20' : 'bg-emerald-500/5'}`}></div>
            
            {/* SVG Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="160" cy="160" r="145" className="stroke-stone-100 dark:stroke-stone-800" strokeWidth="12" fill="none" />
              <circle 
                cx="160" cy="160" r="145" 
                className="stroke-emerald-600 transition-all duration-300 ease-out" 
                strokeWidth="12" 
                fill="none" 
                strokeDasharray={2 * Math.PI * 145}
                strokeDashoffset={2 * Math.PI * 145 * (1 - Math.min(progress, 100) / 100)}
                strokeLinecap="round"
              />
            </svg>

            {/* Tap Surface */}
            <div className="w-64 h-64 bg-stone-50 dark:bg-stone-800 rounded-full shadow-inner flex flex-col items-center justify-center z-10 border border-white/50 dark:border-stone-700">
              <div className={`text-9xl font-black text-emerald-950 dark:text-emerald-100 tracking-tighter transition-all duration-100 ${isAnimate ? 'scale-110 text-amber-500' : 'scale-100'}`}>
                {count}
              </div>
              {target > 0 && (
                <div className="text-stone-400 font-bold text-xs mt-2 uppercase tracking-widest">
                  Goal: {target}
                </div>
              )}
            </div>
          </div>

          {/* Target & Reset Controls */}
          <div className="flex items-center gap-4 w-full mt-12 px-4">
            <button 
              onClick={resetCount} 
              title="Reset Counter"
              className="p-4 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors active:scale-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            
            <div className="flex-1 grid grid-cols-5 gap-2">
              {TARGET_OPTIONS.map(val => (
                <button
                  key={val}
                  onClick={() => { setTarget(val); resetCount(); }}
                  className={`py-3 rounded-2xl text-xs font-bold transition-all ${target === val ? 'bg-emerald-700 text-white shadow-lg' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200'}`}
                >
                  {val === 0 ? '∞' : val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dhikr Selector Tray */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-100 dark:border-stone-800 shadow-sm">
          <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4 ml-1">Choose Dhikr Phrase</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DHIKR_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => { setSelectedDhikr(opt); resetCount(); }}
                className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border text-left flex flex-col gap-1 ${selectedDhikr.label === opt.label ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-900 dark:text-emerald-400' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 text-stone-500 hover:border-emerald-200'}`}
              >
                <span className="truncate">{opt.label}</span>
                <span className="font-amiri text-sm opacity-60 truncate">{opt.arabic}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Professional History Sidebar */}
      <div className="lg:col-span-5 h-full">
        <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 border border-stone-100 dark:border-stone-800 shadow-xl h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-3">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Session History
            </h3>
            <button 
              onClick={() => { if(confirm('Clear history?')) { setHistory([]); localStorage.removeItem('tasbeeh_history'); } }}
              className="text-[10px] font-bold text-stone-400 uppercase hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
            {history.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-stone-300 opacity-60">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-sm font-medium">No sessions logged yet.</p>
              </div>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{entry.label}</span>
                    <span className="text-[10px] text-stone-400 font-medium">{entry.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-black">
                      {entry.count}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800">
             <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">
               Sessions are logged upon completion of a target or when resetting a free count.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasbeehCounter;
