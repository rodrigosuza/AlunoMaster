import React, { useState, useEffect } from 'react';
import { StudySession } from '../types';
import { QuizEngine } from './QuizEngine';
import { SummaryView } from './SummaryView';
import { BookOpen, HelpCircle, ArrowLeft, RefreshCcw, Loader2, Pencil, Trophy } from 'lucide-react';
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
  const [showScoreSplash, setShowScoreSplash] = useState(false);
  const [lastScore, setLastScore] = useState(0);

  // Sync temp title if session changes externally
  useEffect(() => {
    setTempTitle(session.title);
  }, [session.title]);

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

  const handleQuizComplete = (score: number) => {
    onUpdateScore(score);
    setLastScore(score);
    setShowScoreSplash(true);

    // Automatically hide splash and refresh quiz after 3 seconds
    setTimeout(() => {
      setShowScoreSplash(false);
      handleRefreshQuiz();
    }, 3000);
  };

  return (
    <div className="max-w-5xl mx-auto w-full lg:h-full flex flex-col gap-4 animate-in fade-in duration-500">
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

        <div className="flex items-center gap-3">
          {/* Manual Refresh available in header now that sidebar is gone */}
          {mode === 'quiz' && !isRefreshing && (
            <button
              onClick={handleRefreshQuiz}
              className="p-2.5 text-slate-400 hover:text-indigo-600 transition-colors bg-white rounded-xl border border-slate-200 shadow-sm"
              title="Novo Quiz"
            >
              <RefreshCcw size={18} />
            </button>
          )}

          <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200 shadow-inner w-full md:w-fit shrink-0">
            <button
              onClick={() => setMode('summary')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-black text-xs transition-all ${mode === 'summary' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <BookOpen size={16} />
              Resumo
            </button>
            <button
              onClick={() => setMode('quiz')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-black text-xs transition-all ${mode === 'quiz' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <HelpCircle size={16} />
              Quiz
            </button>
          </div>
        </div>
      </div>

      {/* Main Study Layout */}
      <div className="flex flex-col lg:flex-1 lg:overflow-hidden lg:min-h-0">
        {/* Central Content - Full Width */}
        <div className="flex flex-col lg:overflow-hidden lg:h-full">
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
              <div className="h-[500px] lg:h-full">
                <QuizEngine
                  session={session}
                  onComplete={handleQuizComplete}
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* Score Splash Screen */}
      {showScoreSplash && (
        <div className="fixed inset-0 z-[100] bg-indigo-600 flex flex-col items-center justify-center text-white p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-white/20 p-6 rounded-full mb-6 text-yellow-300">
            <Trophy size={80} />
          </div>
          <h2 className="text-4xl font-black mb-2 text-center text-white">Quiz Finalizado!</h2>
          <div className="text-8xl font-black mb-4 text-white">{Math.round((lastScore / (session.totalQuestions || 10)) * 100)}%</div>
          <p className="text-xl font-bold opacity-90 text-center text-indigo-100">Domínio alcançado nesta rodada.</p>

          <div className="mt-12 flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-bold text-sm">Preparando o próximo nível...</span>
          </div>
        </div>
      )}
    </div>
  );
};
