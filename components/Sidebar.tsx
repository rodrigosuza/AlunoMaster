
import React from 'react';
import { LayoutDashboard, PlusCircle, BookOpen, LogOut, FileText, ChevronRight, X } from 'lucide-react';
import { AppState, StudySession } from '../types';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  activeView: AppState['activeView'];
  setView: (view: AppState['activeView'], sessionId?: string) => void;
  sessions: StudySession[];
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, sessions, isOpen, onClose }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'uploader', icon: PlusCircle, label: 'Novo Estudo' },
    { id: 'library', icon: BookOpen, label: 'Biblioteca' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-[85vw] md:w-72 bg-white border-r border-slate-200 
        flex flex-col h-full shadow-2xl md:shadow-sm
        transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 md:p-8 flex flex-col h-full overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 md:mb-12 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 overflow-hidden">
                <img src="/icon-512.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-black text-lg md:text-xl text-slate-900 tracking-tighter">AlunoMaster - AI</span>
            </div>
            {/* Close Button Mobile */}
            <button
              onClick={onClose}
              className="md:hidden p-2 text-slate-400 hover:text-slate-600 active:scale-95 transition-transform"
            >
              <X size={24} />
            </button>
          </div>

          {/* Nav */}
          <nav className="space-y-2 md:space-y-3 shrink-0">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id as AppState['activeView'])}
                className={`w-full flex items-center gap-4 px-5 py-3.5 md:py-4 rounded-2xl transition-all ${activeView === item.id
                    ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-semibold'
                  }`}
              >
                <item.icon size={22} strokeWidth={2.5} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Recent Studies List */}
          <div className="mt-8 md:mt-12 flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex items-center justify-between mb-4 px-2 shrink-0">
              <h3 className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[2px]">
                Estudos Recentes
              </h3>
            </div>
            <div className="space-y-1 overflow-y-auto pr-2 flex-1 pb-4 custom-scrollbar">
              {sessions.length > 0 ? (
                sessions.slice(0, 10).map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setView('study-hub', session.id)}
                    className="group w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                      <FileText size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 truncate flex-1 group-hover:text-indigo-600">
                      {session.title}
                    </span>
                    <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic px-2">Nenhum estudo ainda...</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-6 border-t border-slate-50 shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-3 text-slate-400 hover:text-red-600 transition-colors font-bold text-sm"
            >
              <LogOut size={20} />
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
