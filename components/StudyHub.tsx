
import React, { useState, useEffect } from 'react';
import { StudySession } from '../types';
import { QuizEngine } from './QuizEngine';
import { SummaryView } from './SummaryView';
import { BookOpen, HelpCircle, ArrowLeft, BarChart3, RefreshCcw, Sparkles, Loader2, Pencil } from 'lucide-react';
import { generateStudyContent } from '../services/geminiService';

interface StudyHubProps {
  session: StudySession;
  onUpdateScore: (score: number) => void;
  onUpdateTitle: (title: string) => void;
  onBack: () => void;
}

export const StudyHub: React.FC<StudyHubProps> = ({ session, onUpdateScore, onUpdateTitle, onBack }) => {
  const [mode, setMode] = useState<'summary' | 'quiz'>('summary');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attempts, setAttempts] = useState(1);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(session.title);

  // Sync temp title if session changes externally
  useEffect(() => {
    setTempTitle(session.title);
  }, [session.title]);

  // Improved progress calculation: Average of (score% and consistency)
  const basePercentage = Math.round((session.score / (session.totalQuestions || 10)) * 100);
  // Learning domain grows with attempts if the user maintains a good score
  const domainBoost = Math.min(attempts * 2, 10);
  const percentage = Math.min(basePercentage + domainBoost, 100);

  useEffect(() => {
    if (mode === 'quiz' && (!session.questions || session.questions.length === 0)) {
      handleRefreshQuiz();
    }
  }, [mode]);

  const handleRefreshQuiz = async () => {
    setIsRefreshing(true);
    try {
      const { questions } = await generateStudyContent(session.content);
      session.questions = questions;
      session.totalQuestions = questions.length;
      onUpdateScore(0);
      setAttempts(prev => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveTitle = () => {
    if (tempTitle.trim() && tempTitle !== session.title) {
        onUpdateTitle(tempTitle);
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="max-w-6xl mx-auto w-full lg:h-full flex flex-col gap-4 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-indigo-600 border border-slate-200 shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <input 
                type="text" 
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="w-full text-lg md:text-xl font-black text-slate-900 tracking-tighter uppercase bg-white border-b-2 border-indigo-500 outline-none pb-0.5"
                autoFocus
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              />
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tighter uppercase truncate cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                  {session.title}
                </h1>
                <button 
                  onClick={() => setIsEditingTitle(true)}
                  className="text-slate-300 hover:text-indigo-600 transition-colors p-1 opacity-0 group-hover:opacity-100"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Atualizado em {new Date(session.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200 shadow-inner w-full md:w-fit shrink-0">
          <button
            onClick={() => setMode('summary')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-black text-xs transition-all ${
              mode === 'summary' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen size={16} />
            Resumo
          </button>
          <button
            onClick={() => setMode('quiz')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-black text-xs transition-all ${
              mode === 'quiz' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <HelpCircle size={16} />
            Quiz
          </button>
        </div>
      </div>

      {/* Main Study Layout */}
      {/* Mobile: Stacked naturally, no overflow hidden (uses body scroll) */}
      {/* Desktop: Grid with fixed height, internal scrolling */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-5 lg:flex-1 lg:overflow-hidden lg:min-h-0">
        
        {/* Central Content */}
        <div className="lg:col-span-9 flex flex-col lg:overflow-hidden lg:h-full order-1">
          {mode === 'summary' ? (
            <SummaryView session={session} onBackToDashboard={onBack} hideHeader />
          ) : (
            isRefreshing ? (
              <div className="flex flex-col items-center justify-center h-64 lg:h-full bg-white rounded-[32px] border-2 border-dashed border-slate-100 p-8">
                <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
                <h3 className="text-lg font-black text-slate-900">O Professor está criando novas questões...</h3>
                <p className="text-slate-400 font-bold mt-1 text-sm">Preparando para seu sucesso.</p>
              </div>
            ) : (
              // Quiz usually fits better in a fixed container, but allow it to sit in flow on mobile
              <div className="h-[500px] lg:h-full">
                <QuizEngine 
                  session={session} 
                  onComplete={(score) => onUpdateScore(score)} 
                />
              </div>
            )
          )}
        </div>

        {/* Sidebar Status */}
        <aside className="lg:col-span-3 space-y-4 flex flex-col lg:overflow-y-auto lg:pr-1 lg:h-full order-2">
          <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-lg shadow-slate-100/20">
            <h3 className="font-black text-slate-900 text-xs mb-4 flex items-center gap-2 uppercase tracking-tight">
              <BarChart3 size={14} className="text-indigo-600" />
              Sua Evolução
            </h3>
            <div className="space-y-4">
              <div className="text-center py-5 bg-slate-50 rounded-[20px] border border-slate-100 relative">
                <div className="text-4xl font-black text-indigo-600 mb-1 leading-none">{percentage}%</div>
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Domínio Alcançado</div>
                <div className="mt-3 text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                  {attempts} {attempts === 1 ? 'Prática Realizada' : 'Práticas Realizadas'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 px-1 tracking-widest">
                  <span>Placar do Quiz</span>
                  <span>{session.score}/{session.totalQuestions || 10}</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-sm"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {mode === 'quiz' && (
                <button
                  onClick={handleRefreshQuiz}
                  disabled={isRefreshing}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 font-black text-[9px] uppercase tracking-widest hover:bg-indigo-100 transition-colors border border-indigo-100"
                >
                  {isRefreshing ? <Loader2 className="animate-spin" size={12} /> : <RefreshCcw size={12} />}
                  Novo Quiz IA
                </button>
              )}
            </div>
          </div>

          <div className="bg-indigo-600 p-6 rounded-[24px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group mt-auto shrink-0 min-h-[140px] flex flex-col justify-center">
            <div className="absolute -right-5 -bottom-5 opacity-10 transition-transform duration-700 group-hover:scale-110">
              <Sparkles size={80} />
            </div>
            <h4 className="font-black text-sm mb-3 flex items-center gap-2 relative z-10">
              <Sparkles size={14} className="text-yellow-300" />
              Dica do Prof
            </h4>
            <p className="text-indigo-50 font-bold text-[11px] leading-relaxed relative z-10">
              {percentage > 85 
                ? "Perfeito! Você está pronto para novos desafios. Continue praticando para não esquecer." 
                : "Foque nos termos destacados no resumo, eles são fundamentais para o domínio total."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
