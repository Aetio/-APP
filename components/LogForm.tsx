import React, { useState, useRef } from 'react';
import { ObservationLog } from '../types';
import { Camera, MapPin, Calendar, Save, Sparkles } from 'lucide-react';
import { analyzeObservation } from '../services/geminiService';

interface LogFormProps {
  onSave: (log: ObservationLog) => void;
  onCancel: () => void;
  defaultDate: Date;
  locationName: string;
}

const LogForm: React.FC<LogFormProps> = ({ onSave, onCancel, defaultDate, locationName }) => {
  const [date, setDate] = useState(defaultDate.toISOString().split('T')[0]);
  const [time, setTime] = useState(defaultDate.toTimeString().slice(0, 5));
  const [weather, setWeather] = useState('晴朗');
  const [loc, setLoc] = useState(locationName);
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAiResult(null); // Reset analysis on new image
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    const result = await analyzeObservation(image, date, loc);
    setAiResult(result);
    setIsAnalyzing(false);
    // Append to notes automatically if notes are empty
    if (!notes) {
      setNotes(result);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: ObservationLog = {
      id: Date.now().toString(),
      date: `${date}T${time}`,
      location: { lat: 0, lng: 0, name: loc }, // Simplified for demo
      weather,
      notes: notes + (aiResult ? `\n\n[AI 智能分析]: ${aiResult}` : ''),
      imageUrl: image || undefined,
      aiAnalysis: aiResult || undefined
    };
    onSave(newLog);
  };

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Sparkles className="text-amber-300" /> 新增观测记录
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">日期</label>
            <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-3 text-white focus:outline-none focus:border-amber-400"
                />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">时间</label>
            <input 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Location & Weather */}
        <div>
           <label className="block text-slate-400 text-sm mb-1">观测地点</label>
           <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={loc}
                  onChange={(e) => setLoc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-3 text-white focus:outline-none focus:border-amber-400"
                />
            </div>
        </div>

        <div>
            <label className="block text-slate-400 text-sm mb-1">天气状况</label>
            <select 
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-amber-400"
            >
              <option value="晴朗">晴朗 (Clear)</option>
              <option value="少云">少云 (Few Clouds)</option>
              <option value="多云">多云 (Partly Cloudy)</option>
              <option value="阴天">阴天 (Overcast)</option>
              <option value="雾/霾">雾/霾 (Foggy)</option>
            </select>
        </div>

        {/* Photo Upload */}
        <div>
            <label className="block text-slate-400 text-sm mb-1">上传照片</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${image ? 'border-amber-400/50' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'}`}
              style={image ? { backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
                {!image && (
                   <>
                     <Camera className="w-8 h-8 text-slate-400 mb-2" />
                     <span className="text-slate-400 text-sm">点击上传月亮照片</span>
                   </>
                )}
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden"
              onChange={handleImageUpload}
            />
            
            {image && (
              <button
                type="button"
                onClick={handleAIAnalysis}
                disabled={isAnalyzing}
                className="mt-2 text-xs flex items-center gap-1 text-amber-300 hover:text-amber-200 transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <span className="animate-pulse">Gemini 正在分析中...</span>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" /> Gemini 智能分析
                  </>
                )}
              </button>
            )}

            {aiResult && (
               <div className="mt-2 p-3 bg-indigo-900/30 border border-indigo-500/30 rounded text-xs text-indigo-200">
                  {aiResult}
               </div>
            )}
        </div>

        {/* Notes */}
        <div>
            <label className="block text-slate-400 text-sm mb-1">观测备注</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-amber-400"
              placeholder="记录使用的设备（如望远镜型号）、观测感受等..."
            />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 py-2 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors font-medium"
          >
            取消
          </button>
          <button 
            type="submit" 
            className="flex-1 py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 transition-colors font-bold flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> 保存记录
          </button>
        </div>

      </form>
    </div>
  );
};

export default LogForm;