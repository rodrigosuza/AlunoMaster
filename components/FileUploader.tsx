
import React, { useState } from 'react';
import { Upload, Send, Sparkles, Loader2, AlertCircle, FileText, Type as TypeIcon } from 'lucide-react';
import { generateStudyContent } from '../services/geminiService';
import { StudySession } from '../types';

interface FileUploaderProps {
  onProcessed: (session: StudySession) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onProcessed }) => {
  const [tab, setTab] = useState<'file' | 'text'>('file');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      setIsProcessing(true);
      if (file.type === 'application/pdf') {
        const extracted = await extractTextFromPDF(file);
        setText(extracted);
        if (!title) setTitle(file.name.replace('.pdf', ''));
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setText(content);
          if (!title) setTitle(file.name.split('.')[0]);
        };
        reader.readAsText(file);
      }
    } catch (err) {
      console.error("Erro no upload:", err);
      setError('Erro ao processar arquivo. Verifique se é um PDF válido.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = async () => {
    if (!text || !title) {
      setError('Por favor, preencha o título e o conteúdo.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      console.log("Iniciando geração com IA...");
      const { questions, summary } = await generateStudyContent(text);
      console.log("Conteúdo gerado com sucesso, salvando sessão...");

      onProcessed({
        id: `s-${Date.now()}`,
        title,
        content: text,
        questions,
        summary,
        score: 0,
        totalQuestions: questions.length,
        createdAt: Date.now()
      });
    } catch (err: any) {
      console.error("Erro completo:", err);
      // Aqui mostramos o erro real vindo da API
      setError(err.message || 'Erro inesperado ao gerar a aula. Verifique sua conexão ou a chave da API.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col md:py-4">
      <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-full">
        {/* Header - Highly Compact on Mobile */}
        <div className="bg-indigo-600 p-5 md:p-8 text-white relative shrink-0">
          <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10">
            <Sparkles size={80} className="md:w-[120px] md:h-[120px]" />
          </div>
          <h2 className="text-lg md:text-3xl font-bold mb-1 md:mb-3 flex items-center gap-2 md:gap-3">
            <Sparkles className="text-yellow-300 w-5 h-5 md:w-8 md:h-8" />
            Professor AI <span className="hidden sm:inline">- Novo Estudo</span>
          </h2>
          <p className="text-indigo-100 text-xs md:text-lg leading-tight md:leading-normal max-w-[90%]">
            Transforme seu material em aprendizado real.
          </p>
        </div>

        {/* Main Content - Flex Grow to Fill Space */}
        <div className="p-4 md:p-8 flex flex-col flex-1 overflow-hidden gap-3 md:gap-6 bg-white">

          {/* Title Input - Compact */}
          <div className="shrink-0">
            <label className="block text-[10px] md:text-sm font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
              Título da Matéria
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Revolução Industrial..."
              className="w-full px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 transition-all outline-none text-slate-900 font-medium bg-slate-50 text-sm md:text-base"
            />
          </div>

          {/* Tabs - Compact */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-fit shrink-0">
            <button
              onClick={() => setTab('file')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 md:px-6 md:py-2.5 rounded-lg font-bold text-xs md:text-sm transition-all ${tab === 'file' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FileText size={16} className="md:w-[18px] md:h-[18px]" /> Arquivo
            </button>
            <button
              onClick={() => setTab('text')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 md:px-6 md:py-2.5 rounded-lg font-bold text-xs md:text-sm transition-all ${tab === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <TypeIcon size={16} className="md:w-[18px] md:h-[18px]" /> Texto
            </button>
          </div>

          {/* Content Area - Takes all remaining space */}
          <div className="flex-1 min-h-0 flex flex-col relative">
            {tab === 'file' ? (
              <div className="border-2 md:border-3 border-dashed border-slate-200 rounded-[20px] md:rounded-[32px] h-full flex flex-col items-center justify-center text-center bg-slate-50 hover:border-indigo-300 transition-colors cursor-pointer group relative p-4">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  accept=".pdf,.txt"
                />
                <div className="w-12 h-12 md:w-20 md:h-20 bg-white rounded-2xl md:rounded-3xl shadow-lg flex items-center justify-center text-indigo-500 mb-2 md:mb-6 group-hover:scale-110 transition-transform">
                  <Upload size={24} className="md:w-[32px] md:h-[32px]" />
                </div>
                <h3 className="text-sm md:text-xl font-bold text-slate-800 mb-1">Arraste seu PDF</h3>
                <p className="text-[10px] md:text-base text-slate-500 max-w-xs mx-auto leading-tight">Suportamos PDF/TXT até 30MB.</p>
                {text && <div className="mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px] md:text-sm animate-in fade-in zoom-in">✓ Arquivo pronto</div>}
              </div>
            ) : (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Cole o texto que você deseja que o professor analise..."
                className="w-full h-full px-4 py-4 md:px-6 md:py-6 rounded-[20px] md:rounded-[32px] border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 transition-all outline-none resize-none text-slate-900 font-medium bg-slate-50 text-sm md:text-base leading-relaxed custom-scrollbar"
              />
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="shrink-0 flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 border border-red-100 font-medium text-xs">
              <AlertCircle size={16} className="shrink-0" />
              <p className="line-clamp-2">{error}</p>
            </div>
          )}

          {/* Action Button - Always Visible */}
          <div className="shrink-0 pt-0">
            <button
              onClick={handleProcess}
              disabled={isProcessing || (!text && !title)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 md:py-5 rounded-xl md:rounded-2xl font-black text-sm md:text-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 hover:-translate-y-1 active:translate-y-0 active:scale-95"
            >
              {isProcessing ? (
                <><Loader2 size={18} className="animate-spin md:w-6 md:h-6" /> <span className="md:hidden">Gerando...</span><span className="hidden md:inline">Gerando Aula...</span></>
              ) : (
                <><Send size={18} className="md:w-6 md:h-6" /> <span className="md:hidden">Começar</span><span className="hidden md:inline">Começar a Aprender</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
