
import React from 'react';
import { StudySession } from '../types';
import { Clock, CheckCircle, FileText, TrendingUp, ArrowRight } from 'lucide-react';

interface DashboardProps {
  sessions: StudySession[];
  onNewSession: () => void;
  onViewSession: (id: string) => void;
  user: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ sessions, onNewSession, onViewSession, user }) => {
  const avgScore = sessions.length > 0 
    ? (sessions.reduce((acc, s) => acc + (s.score / (s.totalQuestions || 1)), 0) / sessions.length) * 100 
    : 0;

  // Extract name from metadata or fallback
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Estudante';

  return (
    <div className="max-w-6xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 break-words">Olá, {userName}! 👋</h1>
          <p className="text-sm md:text-base text-slate-500">Pronto para transformar conhecimento em aprendizado real?</p>
        </div>
        <button
          onClick={onNewSession}
          className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-shadow shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95"
        >
          <PlusCircle size={20} />
          Novo Estudo
        </button>
      </header>

      {/* Stats Cards - Grid Layout (Side by Side on Mobile) */}
      <div className="grid grid-cols-3 gap-2 md:gap-6 mb-8">
        <StatCard 
          icon={<FileText className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />} 
          label="Estudos"
          desktopLabel="Estudos Totais"
          value={sessions.length.toString()} 
          color="bg-blue-50"
        />
        <StatCard 
          icon={<TrendingUp className="text-emerald-600 w-5 h-5 md:w-6 md:h-6" />} 
          label="Média"
          desktopLabel="Taxa de Acerto"
          value={`${Math.round(avgScore)}%`} 
          color="bg-emerald-50"
        />
        <StatCard 
          icon={<CheckCircle className="text-purple-600 w-5 h-5 md:w-6 md:h-6" />} 
          label="Concluídos"
          desktopLabel="Quizes Concluídos"
          value={sessions.filter(s => s.score !== undefined).length.toString()} 
          color="bg-purple-50"
        />
      </div>

      <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
          <Clock size={20} className="text-indigo-600" />
          Estudos Recentes
        </h3>
        <div className="space-y-3 md:space-y-4">
          {sessions.slice(0, 10).map(session => (
            <div 
              key={session.id} 
              className="flex items-center justify-between p-3 md:p-4 rounded-xl border border-slate-50 hover:border-indigo-100 hover:bg-slate-50 transition-all cursor-pointer group"
              onClick={() => onViewSession(session.id)}
            >
              <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate text-sm md:text-base">
                    {session.title}
                  </h4>
                  <span className="text-xs text-slate-400">
                    {new Date(session.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-2">
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-700">{Math.round((session.score / (session.totalQuestions || 1)) * 100)}%</div>
                  <div className="text-[8px] md:text-[10px] text-slate-400 uppercase font-bold tracking-tight">Taxa de acerto</div>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-400 transition-all" />
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              Sua lista de estudos está vazia.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatCardProps { 
  icon: React.ReactNode;
  label: string; 
  desktopLabel: string;
  value: string; 
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, desktopLabel, value, color }) => (
  <div className="bg-white p-3 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 h-full">
    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${color} flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <div className="text-center md:text-left w-full min-w-0">
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide md:hidden truncate">{label}</p>
      <p className="hidden md:block text-sm text-slate-500 font-medium">{desktopLabel}</p>
      <h3 className="text-lg md:text-2xl font-bold text-slate-900 leading-tight">{value}</h3>
    </div>
  </div>
);

const PlusCircle = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
