import React, { useState, useEffect } from 'react';
import { getMoonData as calculateMoonData } from './services/moonService';
import { MoonData, MoonPhaseName, ObservationLog } from './types';
import MoonVisual from './components/MoonVisual';
import LogForm from './components/LogForm';
import { MapPin, Plus, Book, Moon, ChevronLeft, ChevronRight, SkipForward, ArrowDown, ArrowUp, Search, X, Loader2 } from 'lucide-react';
import { getMoonTrivia, searchLocation } from './services/geminiService';

const App: React.FC = () => {
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [location, setLocation] = useState({ lat: 39.9042, lng: 116.4074, name: '北京, 中国' }); // Default Beijing
  const [moonData, setMoonData] = useState<MoonData | null>(null);
  const [view, setView] = useState<'dashboard' | 'logs' | 'addLog'>('dashboard');
  const [logs, setLogs] = useState<ObservationLog[]>([]);
  const [trivia, setTrivia] = useState<string>("");

  // Location Search State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    // Load logs
    const savedLogs = localStorage.getItem('lunaLogs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }

    // Try Geo
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        // Only auto-set if user hasn't manually set a very specific location before (implied by default state check, simplified here)
        // For now, we just update it on first load if default is still Beijing
        // Better UX: Don't override if user is looking at a specific place, but here we run once on mount.
        // Let's just update the name to "Current Location" for now, or do a reverse geo if we had the API.
        // We'll keep the manual override as the primary method for specific cities.
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: '当前位置'
        });
      }, (err) => {
         console.warn("Geolocation failed", err);
      });
    }
  }, []);

  // Update Moon Data when Date/Loc changes
  useEffect(() => {
    const data = calculateMoonData(currentDate, location.lat, location.lng);
    setMoonData(data);
    
    // Fetch trivia only when phase name changes to avoid spamming API
    // Use the Chinese name directly for the query
    getMoonTrivia(data.name).then(setTrivia);

  }, [currentDate, location]);

  const handleSaveLog = (log: ObservationLog) => {
    const updatedLogs = [log, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('lunaLogs', JSON.stringify(updatedLogs));
    setView('logs');
  };

  const jumpToPhase = (targetPhase: MoonPhaseName) => {
    // Naive search forward for the next occurrence
    let d = new Date(currentDate);
    for (let i = 0; i < 30; i++) {
        d.setDate(d.getDate() + 1);
        const data = calculateMoonData(d, location.lat, location.lng);
        if (data.name === targetPhase) {
            setCurrentDate(d);
            return;
        }
    }
  };

  const handleDateChange = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d);
  };

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingLocation(true);
    setSearchError(null);

    const result = await searchLocation(searchQuery);
    
    setIsSearchingLocation(false);
    
    if (result) {
        setLocation({
            lat: result.lat,
            lng: result.lng,
            name: result.name
        });
        setIsLocationModalOpen(false);
        setSearchQuery("");
    } else {
        setSearchError("未找到该地点，请尝试输入更详细的城市名称。");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 font-sans relative">
      
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Moon className="w-5 h-5 text-slate-900 fill-slate-900" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">LunaLog | 寻月</h1>
          </div>
          
          <button 
            onClick={() => setIsLocationModalOpen(true)}
            className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full flex items-center gap-2 transition-colors border border-slate-700 hover:border-amber-500/50"
          >
            <MapPin className="w-3 h-3 text-amber-500" />
            <span className="truncate max-w-[100px] sm:max-w-[200px]">{location.name}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        
        {view === 'dashboard' && moonData && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Date Nav */}
            <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
               <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                 <ChevronLeft className="w-5 h-5" />
               </button>
               <div className="flex flex-col items-center">
                 <span className="font-bold text-white text-lg">
                    {currentDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}
                 </span>
                 {currentDate.toDateString() === new Date().toDateString() && (
                    <span className="text-xs text-amber-500 font-medium">今天</span>
                 )}
               </div>
               <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                 <ChevronRight className="w-5 h-5" />
               </button>
            </div>

            {/* Hero Section */}
            <div className="flex flex-col items-center py-8 relative">
              <MoonVisual phase={moonData.phase} size={260} />
              
              <div className="mt-8 text-center space-y-2">
                <h2 className="text-4xl font-light text-white tracking-widest">{moonData.name}</h2>
                <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
                   <span>月龄: {moonData.age.toFixed(1)} 天</span>
                   <span>•</span>
                   <span>亮度: {(moonData.fraction * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Trivia */}
              {trivia && (
                <div className="mt-6 px-6 py-3 bg-indigo-950/40 border border-indigo-500/20 rounded-lg max-w-md text-center text-xs text-indigo-200">
                    <span className="font-bold text-indigo-400 block mb-1">月亮冷知识</span>
                    {trivia}
                </div>
              )}
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                  <ArrowUp className="w-5 h-5 text-amber-500 mb-2" />
                  <span className="text-xs text-slate-500">月出</span>
                  <span className="text-lg font-mono text-white">
                    {moonData.rise ? moonData.rise.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                  </span>
               </div>
               <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                  <ArrowDown className="w-5 h-5 text-indigo-400 mb-2" />
                  <span className="text-xs text-slate-500">月落</span>
                  <span className="text-lg font-mono text-white">
                    {moonData.set ? moonData.set.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                  </span>
               </div>
               <button onClick={() => jumpToPhase(MoonPhaseName.FULL_MOON)} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 flex flex-col items-center transition-colors group">
                  <SkipForward className="w-5 h-5 text-slate-400 group-hover:text-white mb-2" />
                  <span className="text-xs text-slate-500 group-hover:text-slate-300">下次满月</span>
               </button>
                <button onClick={() => jumpToPhase(MoonPhaseName.NEW_MOON)} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 flex flex-col items-center transition-colors group">
                  <SkipForward className="w-5 h-5 text-slate-400 group-hover:text-white mb-2" />
                  <span className="text-xs text-slate-500 group-hover:text-slate-300">下次新月</span>
               </button>
            </div>

            {/* CTA */}
            <button 
                onClick={() => setView('addLog')}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white font-bold shadow-lg shadow-amber-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-5 h-5" /> 记录此次观测
            </button>

          </div>
        )}

        {view === 'logs' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">您的观测记录</h2>
                <button 
                  onClick={() => setView('addLog')}
                  className="bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-lg"
                >
                    <Plus className="w-5 h-5" />
                </button>
             </div>

             {logs.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                    <Book className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>暂无观测记录。</p>
                    <p className="text-sm">走出去，抬头看看月亮吧！</p>
                </div>
             ) : (
                logs.map(log => (
                    <div key={log.id} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col sm:flex-row shadow-md">
                        {log.imageUrl && (
                            <div 
                                className="h-48 sm:h-auto sm:w-48 bg-cover bg-center"
                                style={{ backgroundImage: `url(${log.imageUrl})` }}
                            />
                        )}
                        <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-lg text-white">
                                        {new Date(log.date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', year: 'numeric'})}
                                    </h3>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {log.location.name} • {log.weather}
                                    </span>
                                </div>
                                <span className="text-amber-500 font-mono text-sm">
                                    {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                                </span>
                            </div>
                            <p className="text-slate-300 text-sm mb-3 whitespace-pre-wrap">{log.notes}</p>
                            {log.aiAnalysis && (
                                <div className="mt-2 p-2 bg-slate-800 rounded border-l-2 border-indigo-500 text-xs text-indigo-200">
                                    <span className="font-bold">AI 分析:</span> {log.aiAnalysis}
                                </div>
                            )}
                        </div>
                    </div>
                ))
             )}
          </div>
        )}

        {view === 'addLog' && (
          <LogForm 
            defaultDate={currentDate}
            locationName={location.name}
            onSave={handleSaveLog}
            onCancel={() => setView('dashboard')}
          />
        )}

      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 z-50">
        <div className="flex justify-around items-center max-w-lg mx-auto py-3">
            <button 
                onClick={() => setView('dashboard')}
                className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-amber-400' : 'text-slate-500'}`}
            >
                <Moon className="w-6 h-6" fill={view === 'dashboard' ? 'currentColor' : 'none'} />
                <span className="text-[10px] uppercase font-bold tracking-wider">月相</span>
            </button>
            <button 
                onClick={() => setView('logs')}
                className={`flex flex-col items-center gap-1 ${view === 'logs' ? 'text-amber-400' : 'text-slate-500'}`}
            >
                <Book className="w-6 h-6" fill={view === 'logs' ? 'currentColor' : 'none'} />
                <span className="text-[10px] uppercase font-bold tracking-wider">观测日志</span>
            </button>
        </div>
      </nav>

      {/* Location Search Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative">
                <button 
                  onClick={() => setIsLocationModalOpen(false)}
                  className="absolute right-4 top-4 text-slate-500 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-amber-500" /> 更换观测地点
                    </h3>
                    
                    <form onSubmit={handleSearchLocation} className="space-y-4">
                        <div>
                            <label className="block text-slate-400 text-sm mb-2">请输入城市名称</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                <input 
                                    type="text" 
                                    autoFocus
                                    placeholder="例如：杭州, 东京, 纽约..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>
                        </div>

                        {searchError && (
                            <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded-lg border border-red-900/50">
                                {searchError}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button 
                                type="button" 
                                onClick={() => setIsLocationModalOpen(false)}
                                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition-colors"
                            >
                                取消
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSearchingLocation}
                                className="flex-1 py-3 rounded-xl bg-amber-600 text-white hover:bg-amber-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSearchingLocation ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> 搜索中...
                                    </>
                                ) : (
                                    "确认更换"
                                )}
                            </button>
                        </div>
                    </form>
                    
                    <div className="mt-6 pt-4 border-t border-slate-800">
                        <p className="text-xs text-slate-500 text-center">
                            支持搜索全球主要城市 • 自动匹配经纬度
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;