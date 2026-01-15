
import React, { useState } from 'react';
import { StudySession, Folder } from '../types';
import { Folder as FolderIcon, FileText, Search, MoreVertical, BookOpen, Clock, Plus, Star } from 'lucide-react';

interface LibraryViewProps {
  sessions: StudySession[];
  folders: Folder[];
  onViewSession: (id: string) => void;
  onToggleFavorite: (sessionId: string) => void;
  onCreateFolder: (name: string) => void;
  onAddToFolder: (sessionId: string, folderId: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ 
  sessions, 
  folders, 
  onViewSession,
  onToggleFavorite,
  onCreateFolder,
  onAddToFolder
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [addToFolderMenuId, setAddToFolderMenuId] = useState<string | null>(null);

  // Filter Logic
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFolder = true;
    if (activeFolderId === 'favorites') {
      matchesFolder = !!session.isFavorite;
    } else if (activeFolderId !== 'all') {
      const folder = folders.find(f => f.id === activeFolderId);
      matchesFolder = folder ? folder.sessionIds.includes(session.id) : false;
    }

    return matchesSearch && matchesFolder;
  });

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleMenuClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === sessionId ? null : sessionId);
    setAddToFolderMenuId(null); // Reset sub-menu
  };

  const handleAddToFolderClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setAddToFolderMenuId(sessionId);
  };

  const handleFolderSelect = (e: React.MouseEvent, sessionId: string, folderId: string) => {
    e.stopPropagation();
    onAddToFolder(sessionId, folderId);
    setMenuOpenId(null);
    setAddToFolderMenuId(null);
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col" onClick={() => { setMenuOpenId(null); setAddToFolderMenuId(null); }}>
      {/* Header & Search - Reorganized for Mobile */}
      <header className="mb-4 md:mb-8 shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 mb-1 tracking-tighter">Minha Biblioteca</h1>
          <p className="text-slate-500 text-xs md:text-lg font-medium">Todos os seus estudos organizados.</p>
        </div>

        {/* Search Bar */}
        <div className="relative group w-full md:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar..."
            className="w-full pl-10 pr-4 py-2.5 md:py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 transition-all outline-none bg-white shadow-sm font-bold text-slate-800 text-xs md:text-sm"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 flex-1 min-h-0">
        
        {/* Left Folder Nav - Compact on Mobile */}
        <aside className="lg:col-span-3 flex flex-col min-h-0">
          <div className="bg-white p-4 md:p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col max-h-[180px] lg:max-h-full lg:h-full overflow-hidden">
            <div className="flex items-center justify-between mb-2 md:mb-4 px-1 shrink-0">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pastas</h3>
              <button 
                onClick={() => setIsCreatingFolder(true)}
                className="text-indigo-600 text-[10px] font-black hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
              >
                <Plus size={12} /> Nova
              </button>
            </div>

            {/* Folder Creation Input */}
            {isCreatingFolder && (
              <div className="mb-2 px-1 animate-in slide-in-from-top-2 shrink-0">
                <input
                  autoFocus
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onBlur={() => !newFolderName && setIsCreatingFolder(false)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  placeholder="Nome..."
                  className="w-full px-3 py-2 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 outline-none text-xs font-bold text-slate-700 bg-slate-50"
                />
              </div>
            )}

            <div className="space-y-1 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-0">
              <button 
                onClick={() => setActiveFolderId('all')}
                className={`w-full flex items-center justify-between p-2.5 md:p-3.5 rounded-xl md:rounded-[18px] transition-all font-bold text-xs md:text-sm ${
                  activeFolderId === 'all' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <BookOpen size={16} className="md:w-[18px] md:h-[18px]" />
                  <span>Todos</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-lg ${activeFolderId === 'all' ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {sessions.length}
                </span>
              </button>
              
              <button 
                onClick={() => setActiveFolderId('favorites')}
                className={`w-full flex items-center justify-between p-2.5 md:p-3.5 rounded-xl md:rounded-[18px] transition-all font-bold text-xs md:text-sm ${
                  activeFolderId === 'favorites'
                    ? 'bg-amber-400 text-white shadow-lg shadow-amber-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <Star size={16} className={activeFolderId === 'favorites' ? 'fill-white md:w-[18px] md:h-[18px]' : 'md:w-[18px] md:h-[18px]'} />
                  <span>Favoritos</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-lg ${activeFolderId === 'favorites' ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {sessions.filter(s => s.isFavorite).length}
                </span>
              </button>

              {folders.map(folder => (
                <button 
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`w-full flex items-center justify-between p-2.5 md:p-3.5 rounded-xl md:rounded-[18px] transition-all font-bold text-xs md:text-sm ${
                    activeFolderId === folder.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <FolderIcon size={16} className="md:w-[18px] md:h-[18px]" />
                    <span className="truncate max-w-[120px]">{folder.name}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg ${activeFolderId === folder.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                    {folder.sessionIds.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Content Area - Study Grid */}
        <section className="lg:col-span-9 flex flex-col min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6 auto-rows-min overflow-y-auto pr-1 md:pr-2 custom-scrollbar flex-1 pb-24 md:pb-10 content-start">
            {filteredSessions.map(session => (
              <div 
                key={session.id}
                className="bg-white rounded-[20px] md:rounded-[32px] p-3 md:p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer group relative flex flex-col h-fit"
                onClick={() => onViewSession(session.id)}
              >
                {/* Desktop Icon Header - Hidden on Mobile */}
                <div className="hidden md:flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                  </div>
                </div>

                {/* Mobile & Desktop Menu Button */}
                <div className="absolute top-3 right-3 md:top-6 md:right-6 z-10">
                   <button 
                    onClick={(e) => handleMenuClick(e, session.id)}
                    className="p-1.5 md:p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                  >
                    <MoreVertical size={18} className="md:w-5 md:h-5" />
                  </button>

                  {/* Dropdown Menu */}
                  {menuOpenId === session.id && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {addToFolderMenuId === session.id ? (
                        <div className="p-2">
                           <div className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 mb-1">Escolha a pasta</div>
                           <div className="max-h-32 overflow-y-auto custom-scrollbar">
                             {folders.map(f => (
                               <button 
                                key={f.id}
                                onClick={(e) => handleFolderSelect(e, session.id, f.id)}
                                className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg"
                               >
                                 {f.name}
                               </button>
                             ))}
                             {folders.length === 0 && <div className="text-xs text-slate-400 px-3 py-2 italic">Sem pastas</div>}
                           </div>
                           <button 
                            onClick={(e) => { e.stopPropagation(); setAddToFolderMenuId(null); }}
                            className="w-full text-center text-[10px] font-bold text-slate-400 mt-2 hover:text-slate-600"
                           >
                             Voltar
                           </button>
                        </div>
                      ) : (
                        <div className="p-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(session.id); setMenuOpenId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs md:text-sm font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-600 rounded-lg"
                          >
                            <Star size={16} className={session.isFavorite ? 'fill-amber-400 text-amber-400' : ''} />
                            {session.isFavorite ? 'Remover Favorito' : 'Favoritar'}
                          </button>
                          <button 
                            onClick={(e) => handleAddToFolderClick(e, session.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs md:text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg"
                          >
                            <FolderIcon size={16} />
                            Adicionar à pasta
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Title */}
                <div className="pr-8 md:pr-0 mb-2 md:mb-2">
                  <h4 className="font-black text-sm md:text-xl text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 tracking-tight">
                    {session.title}
                  </h4>
                </div>
                
                {/* Mobile Compact View Details */}
                <div className="flex flex-col gap-2 md:gap-0">
                  
                  {/* Date & Favorite Indicator */}
                  <div className="flex items-center gap-1.5 md:gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0 md:mb-6">
                    <Clock size={10} className="md:w-3 md:h-3" />
                    {new Date(session.createdAt).toLocaleDateString('pt-BR')}
                    {session.isFavorite && <Star size={10} className="fill-amber-400 text-amber-400 ml-1 md:w-3 md:h-3" />}
                  </div>
                  
                  {/* Progress Bar - Compact on Mobile */}
                  <div className="mt-auto md:pt-6 md:border-t border-slate-50 flex flex-col gap-2 md:gap-4">
                    
                    <div className="hidden md:flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Domínio do Assunto</span>
                      <span className="text-sm font-black text-indigo-600">
                        {Math.round((session.score / (session.totalQuestions || 1)) * 100)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2 md:block">
                        <div className="flex-1 h-1.5 md:h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0 md:p-0.5 shadow-inner">
                        <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-700 shadow-sm" 
                            style={{ width: `${(session.score / (session.totalQuestions || 1)) * 100}%` }}
                        />
                        </div>
                        <span className="md:hidden text-[10px] font-black text-indigo-600">
                           {Math.round((session.score / (session.totalQuestions || 1)) * 100)}%
                        </span>
                    </div>
                  </div>
                </div>

              </div>
            ))}
            
            {filteredSessions.length === 0 && (
              <div className="col-span-full py-12 md:py-24 bg-slate-50 border-3 border-dashed border-slate-200 rounded-[32px] md:rounded-[40px] text-center px-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-4 md:mb-6 shadow-sm">
                  <Search size={32} className="md:w-[40px] md:h-[40px]" />
                </div>
                <h4 className="text-xl md:text-2xl font-black text-slate-900 mb-2 tracking-tight">Nenhum estudo encontrado</h4>
                <p className="text-sm md:text-base text-slate-400 font-bold max-w-xs mx-auto">
                  Tente buscar outro termo ou selecione outra pasta.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
