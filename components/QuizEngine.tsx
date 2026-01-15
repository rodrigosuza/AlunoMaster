
import React, { useState } from 'react';
import { StudySession } from '../types';
import { CheckCircle2, XCircle, ChevronRight, Info, HelpCircle } from 'lucide-react';

interface QuizEngineProps {
  session: StudySession;
  onComplete: (score: number) => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({ session, onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const question = session.questions[currentIdx];
  
  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
  };

  const handleConfirm = () => {
    if (selectedIdx === null || isAnswered) return;
    setIsAnswered(true);
    if (selectedIdx === question.correctAnswerIndex) {
      setScore(prev => prev + 1);
    }
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIdx + 1 < session.questions.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedIdx(null);
      setIsAnswered(false);
      setShowExplanation(false);
    } else {
      onComplete(score);
    }
  };

  if (!question) return (
    <div className="p-8 text-center bg-white rounded-[24px] border-2 border-dashed border-slate-100">
      <HelpCircle className="mx-auto text-slate-300 mb-2 animate-pulse" size={40} />
      <p className="text-slate-500 font-bold text-sm">Preparando desafio...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in zoom-in duration-300 h-full flex flex-col overflow-hidden">
      <div className="bg-white rounded-[24px] shadow-xl border border-slate-100 p-5 md:p-6 flex flex-col h-full overflow-hidden">
        {/* Progress bar and small indicator */}
        <div className="flex justify-between items-center mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Questão {currentIdx + 1}/{session.questions.length}
            </span>
          </div>
          <div className="flex gap-1">
            {session.questions.map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? 'bg-indigo-600 w-4' : i < currentIdx ? 'bg-indigo-200' : 'bg-slate-100'}`} 
              />
            ))}
          </div>
        </div>

        {/* Question heading - compact but visible */}
        <h2 className="text-lg font-black text-slate-900 mb-4 leading-tight shrink-0">
          {question.text}
        </h2>

        {/* Options list - Compact gap and padding to fit screen */}
        <div className="grid grid-cols-1 gap-1.5 overflow-y-auto flex-1 pr-1 mb-4 custom-scrollbar">
          {question.options.map((option, idx) => {
            const isCorrect = idx === question.correctAnswerIndex;
            const isSelected = idx === selectedIdx;
            
            let variant = "bg-slate-50 border-slate-100 text-slate-900 hover:border-indigo-200 hover:bg-slate-100";
            if (isAnswered) {
              if (isCorrect) variant = "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/5";
              else if (isSelected) variant = "bg-red-50 border-red-500 text-red-950 font-bold ring-2 ring-red-500/5";
              else variant = "bg-white border-slate-50 text-slate-400 opacity-60";
            } else if (isSelected) {
              variant = "bg-indigo-50 border-indigo-600 text-indigo-950 font-bold ring-2 ring-indigo-600/5";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={isAnswered}
                className={`w-full group flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-150 text-left ${variant}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-100'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm leading-snug">{option}</span>
                </div>
                {isAnswered && isCorrect && <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="text-red-600 shrink-0" size={18} />}
              </button>
            );
          })}
          
          {/* Explanation shows within the scrollable area to prevent master layout scrolling */}
          {showExplanation && (
            <div className={`p-4 rounded-xl mt-2 animate-in slide-in-from-bottom-2 duration-300 border shadow-sm ${
              selectedIdx === question.correctAnswerIndex ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <Info size={12} className={selectedIdx === question.correctAnswerIndex ? 'text-emerald-600' : 'text-red-600'} />
                <span className="font-black text-[9px] uppercase tracking-widest text-slate-500">Explicação Didática</span>
              </div>
              <p className="text-slate-900 leading-snug font-bold text-xs italic">
                {question.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Action Button - Sticky at bottom */}
        <div className="flex justify-end shrink-0 border-t border-slate-50 pt-3">
          {!isAnswered ? (
            <button
              onClick={handleConfirm}
              disabled={selectedIdx === null}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-xs hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
              Confirmar Resposta
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
            >
              {currentIdx + 1 === session.questions.length ? 'Finalizar Quiz' : 'Próxima'}
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
