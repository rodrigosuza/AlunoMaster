
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { FileUploader } from './components/FileUploader';
import { StudyHub } from './components/StudyHub';
import { LibraryView } from './components/LibraryView';
import { Auth } from './components/Auth';
import { AppState, StudySession, Folder } from './types';
import { supabase } from './lib/supabase';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    sessions: [],
    folders: [],
    activeView: 'dashboard',
    user: null
  });

  const [initializing, setInitializing] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  const [isRecovering, setIsRecovering] = useState(false); // New state to force Auth view during password recovery

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({ ...prev, user: session?.user ?? null }));
      if (session?.user) fetchUserData(session.user.id);
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      } else if (event === 'SIGNED_IN') {
        // Only fetch user data and set user if it's a standard sign in 
        // (not just a background recovery event)
        setState(prev => ({ ...prev, user: session?.user ?? null }));
        if (session?.user) fetchUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setState(prev => ({ ...prev, user: null, sessions: [], folders: [] }));
        setIsRecovering(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Remove hashing logic


  const fetchUserData = async (userId: string) => {
    // If it's the local admin, we might not fetch from supabase or just fetch empty
    if (userId.startsWith('admin')) return;

    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('createdAt', { ascending: false });

    const { data: folders } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId);

    setState(prev => ({
      ...prev,
      sessions: (sessions as any[]) || [],
      folders: (folders as Folder[]) || []
    }));
  };

  const handleAdminLogin = () => {
    // Manually set a fake user state
    setState(prev => ({
      ...prev,
      user: {
        id: 'admin-local-access',
        email: 'admin@alunomaster.ai',
        user_metadata: { full_name: 'Administrador' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      }
    }));
  };

  const addSession = async (session: StudySession) => {
    const userId = state.user?.id;
    const newSession = { ...session, user_id: userId };

    setState(prev => ({
      ...prev,
      sessions: [newSession, ...prev.sessions],
      currentSessionId: newSession.id,
      activeView: 'study-hub'
    }));

    if (userId && !userId.startsWith('admin')) {
      const { error } = await supabase.from('sessions').insert([newSession]);
      if (error) {
        console.error("Erro ao salvar sessão no Supabase:", error);
      }
    }
  };

  const updateSessionScore = async (sessionId: string, score: number) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.id === sessionId ? { ...s, score } : s)
    }));

    if (state.user && !state.user.id.startsWith('admin')) {
      const { error } = await supabase
        .from('sessions')
        .update({ score })
        .eq('id', sessionId);

      if (error) console.error("Error updating score:", error);
    }
  };

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.id === sessionId ? { ...s, title: newTitle } : s)
    }));

    if (state.user && !state.user.id.startsWith('admin')) {
      const { error } = await supabase
        .from('sessions')
        .update({ title: newTitle })
        .eq('id', sessionId);

      if (error) console.error("Error updating title:", error);
    }
  };

  // --- New Library Functions ---

  const toggleFavorite = async (sessionId: string) => {
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return;

    const newStatus = !session.isFavorite;

    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.id === sessionId ? { ...s, isFavorite: newStatus } : s)
    }));

    if (state.user && !state.user.id.startsWith('admin')) {
      await supabase
        .from('sessions')
        .update({ is_favorite: newStatus }) // Assumes column exists or is mapped
        .eq('id', sessionId);
    }
  };

  const createFolder = async (name: string) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      sessionIds: [],
      user_id: state.user?.id
    };

    setState(prev => ({
      ...prev,
      folders: [...prev.folders, newFolder]
    }));

    if (state.user && !state.user.id.startsWith('admin')) {
      await supabase.from('folders').insert([newFolder]);
    }
  };

  const addSessionToFolder = async (sessionId: string, folderId: string) => {
    const folder = state.folders.find(f => f.id === folderId);
    if (!folder) return;

    if (folder.sessionIds.includes(sessionId)) return; // Already in folder

    const updatedSessionIds = [...folder.sessionIds, sessionId];

    setState(prev => ({
      ...prev,
      folders: prev.folders.map(f => f.id === folderId ? { ...f, sessionIds: updatedSessionIds } : f)
    }));

    if (state.user && !state.user.id.startsWith('admin')) {
      await supabase
        .from('folders')
        .update({ sessionIds: updatedSessionIds }) // Assumes DB handles array or JSON
        .eq('id', folderId);
    }
  };

  // -----------------------------

  const setView = (view: AppState['activeView'], sessionId?: string) => {
    setState(prev => ({
      ...prev,
      activeView: view,
      currentSessionId: sessionId || prev.currentSessionId
    }));
    setIsSidebarOpen(false); // Close sidebar on mobile when navigating
  };

  const activeSession = state.sessions.find(s => s.id === state.currentSessionId);

  if (initializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin text-indigo-600">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (!state.user || isRecovering) {
    return (
      <Auth
        onAdminLogin={handleAdminLogin}
        initialView={isRecovering ? 'reset-password' : 'login'}
        onRecoveryComplete={() => setIsRecovering(false)}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 relative">

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 flex items-center px-4 z-40 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md overflow-hidden">
            <img src="/icon-512.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-lg text-slate-900 tracking-tighter">AlunoMaster</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg active:scale-95 transition-all"
        >
          <Menu size={24} />
        </button>
      </div>

      <Sidebar
        activeView={state.activeView}
        setView={setView}
        sessions={state.sessions}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content - Add padding top for mobile header */}
      <main className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar pt-20 md:pt-12 w-full">
        <div className="max-w-7xl mx-auto h-full pb-20 md:pb-0"> {/* Extra padding bottom for mobile ease */}
          {state.activeView === 'dashboard' && (
            <Dashboard
              sessions={state.sessions}
              onNewSession={() => setView('uploader')}
              onViewSession={(id) => setView('study-hub', id)}
              user={state.user}
            />
          )}

          {state.activeView === 'uploader' && (
            <FileUploader onProcessed={addSession} />
          )}

          {state.activeView === 'study-hub' && activeSession && (
            <StudyHub
              session={activeSession}
              onUpdateScore={(score) => updateSessionScore(activeSession.id, score)}
              onUpdateTitle={(title) => updateSessionTitle(activeSession.id, title)}
              onBack={() => setView('dashboard')}
            />
          )}

          {state.activeView === 'library' && (
            <LibraryView
              sessions={state.sessions}
              folders={state.folders}
              onViewSession={(id) => setView('study-hub', id)}
              onToggleFavorite={toggleFavorite}
              onCreateFolder={createFolder}
              onAddToFolder={addSessionToFolder}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
