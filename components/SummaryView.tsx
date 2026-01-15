
import React from 'react';
import { StudySession } from '../types';
import { BookOpen, Trophy, LayoutDashboard, Sparkles, Target, GraduationCap } from 'lucide-react';

interface SummaryViewProps {
  session: StudySession;
  onBackToDashboard: () => void;
  hideHeader?: boolean;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ session, onBackToDashboard, hideHeader }) => {
  const percentage = Math.round((session.score / (session.totalQuestions || 1)) * 100);

  // Robust Markdown-like pedagogical renderer
  const renderFormattedText = (text: string) => {
    // Handle bolding **text** safely
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const innerText = part.slice(2, -2).trim();
        if (!innerText) return null; // Avoid empty bolds
        return (
          <strong key={j} className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md mx-0.5 border border-indigo-100 font-bold">
            {innerText}
          </strong>
        );
      }
      return <span key={j}>{part}</span>;
    });
  };

  const renderSummary = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <div key={i} className="h-4" />;

      if (trimmedLine.startsWith('# ')) {
        return <h1 key={i} className="text-2xl md:text-3xl font-black text-indigo-700 mb-6 mt-2 border-b-4 border-indigo-100 pb-2 tracking-tight uppercase">{trimmedLine.replace('# ', '')}</h1>;
      }
      if (trimmedLine.startsWith('## ')) {
        return <h2 key={i} className="text-xl md:text-2xl font-black text-slate-900 mb-4 mt-8 flex items-center gap-3"><div className="w-1.5 h-6 md:h-7 bg-indigo-500 rounded-full"></div> {trimmedLine.replace('## ', '')}</h2>;
      }
      if (trimmedLine.startsWith('### ')) {
        return <h3 key={i} className="text-lg md:text-xl font-extrabold text-indigo-600 mb-3 mt-6 pl-4 border-l-4 border-indigo-200">{trimmedLine.replace('### ', '')}</h3>;
      }
      if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        return (
          <li key={i} className="ml-4 md:ml-6 mb-3 list-none flex gap-3 text-slate-800 font-bold text-base md:text-lg">
            <span className="text-indigo-500 font-black mt-1">•</span>
            <span className="flex-1">{renderFormattedText(trimmedLine.substring(2))}</span>
          </li>
        );
      }
      
      return (
        <p key={i} className="mb-5 text-slate-900 leading-relaxed font-semibold text-base md:text-lg">
          {renderFormattedText(trimmedLine)}
        </p>
      );
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto w-full lg:h-full flex flex-col">
      <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col lg:flex-1">
        {!hideHeader && (
          <div className="bg-indigo-600 p-10 text-white relative text-center shrink-0">
            <div className="absolute top-0 left-0 p-8 opacity-10">
              <GraduationCap size={100} />
            </div>
            <div className="inline-flex p-4 bg-white/20 rounded-3xl mb-4 backdrop-blur-md shadow-inner">
              <Trophy size={40} className="text-yellow-300" />
            </div>
            <h2 className="text-3xl font-black mb-1">Resumo Dominado!</h2>
            
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mt-6">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/20">
                <div className="text-3xl font-black">{session.score}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Acertos</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/20">
                <div className="text-3xl font-black">{percentage}%</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Domínio</div>
              </div>
            </div>
          </div>
        )}

        {/* Content Container - Allow scrolling on desktop, expand on mobile */}
        <div className="p-6 md:p-12 flex flex-col lg:flex-1 lg:overflow-hidden">
          <div className="flex items-center gap-4 mb-6 md:mb-8 pb-4 border-b border-slate-100 shrink-0">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <BookOpen size={24} className="md:w-7 md:h-7" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Guia de Aprendizado</h3>
              <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-widest">Foco total no essencial</p>
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-[24px] md:rounded-[32px] p-6 md:p-10 border-2 border-slate-100 shadow-inner lg:flex-1 lg:overflow-y-auto">
            <div className="max-w-none">
              {renderSummary(session.summary)}
            </div>
          </div>

          {!hideHeader && (
            <div className="mt-8 flex justify-center shrink-0">
              <button
                onClick={onBackToDashboard}
                className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white font-black text-lg rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95"
              >
                <LayoutDashboard size={20} />
                Finalizar Estudo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
