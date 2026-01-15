
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Phone, ArrowRight, Sparkles, Loader2, AlertCircle, CheckCircle2, User, Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  onAdminLogin: () => void;
  onRecoveryComplete?: () => void;
  initialView?: 'login' | 'register' | 'forgot-password' | 'forgot-login' | 'reset-password';
}

export const Auth: React.FC<AuthProps> = ({ onAdminLogin, onRecoveryComplete, initialView = 'login' }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot-password' | 'forgot-login' | 'reset-password'>(initialView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Listen for Supabase recovery events
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState(''); // New state for user name
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1); // For recovery steps

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // ADMIN BACKDOOR
    if (email === 'admin@admin.com' && password === 'admin') {
      setTimeout(() => {
        onAdminLogin();
      }, 500); // Small fake delay
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Email ou senha incorretos.");
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Save full_name in metadata so it's accessible via session.user.user_metadata
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: name,
        }
      }
    });

    if (authError) {
      setError(authError.message);
    } else if (data.user) {
      // Save phone number to profiles table (Sanitized)
      const cleanPhone = phone.replace(/\D/g, '');

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, phone: cleanPhone }]);

      if (profileError) {
        console.error("Erro ao salvar perfil:", profileError);
        // Não bloqueamos o sucesso do cadastro, mas avisamos no console
      }

      setSuccess("Conta criada! Verifique seu email para confirmar e ativar seu acesso.");
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) setError(error.message);
    else setSuccess("Se este email estiver cadastrado, um link de recuperação foi enviado!");
    setLoading(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Senha alterada com sucesso! Você já pode fazer login.");
      // Signal recovery is over
      if (onRecoveryComplete) onRecoveryComplete();
      setTimeout(() => {
        setView('login');
        setSuccess(null);
      }, 2000);
    }
    setLoading(false);
  };

  const handleForgotLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');

    if (step === 1) {
      // Step 1: Request code via phone
      // IMPORTANT: In a frontend-only context with RLS enabled, unauthenticated users
      // often cannot query the profiles table to check if a phone exists.
      // We assume the phone is valid for the UI flow to proceed (Simulation Mode).
      if (cleanPhone.length < 10) {
        setError("Telefone inválido.");
      } else {
        // Simulating SMS code send
        console.log("SMS Code sent: 123456");
        setSuccess("Código enviado via SMS (Simulado: 123456)");
        setStep(2);
      }
    } else {
      // Step 2: Verify code and reveal email
      if (code === '123456') {
        // In simulation, we just confirm success.
        setSuccess(`Acesso validado! Tente logar com seu email principal.`);
      } else {
        setError("Código inválido.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="h-screen w-full bg-slate-50 overflow-hidden flex flex-col items-center py-6 px-4 sm:px-6 fixed inset-0 touch-none">
      <div className="w-full max-w-md bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden shrink-0 my-auto select-none">
        <div className="bg-indigo-600 p-6 sm:p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={60} />
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl sm:text-2xl shadow-xl mb-4 sm:mb-6">
            A
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">AlunoMaster - AI</h2>
          <p className="text-indigo-100 font-medium text-sm sm:text-base">
            {view === 'login' && 'Bem-vindo de volta, estudante!'}
            {view === 'register' && 'Crie sua conta para começar.'}
            {view === 'forgot-password' && 'Recuperação de Senha'}
            {view === 'forgot-login' && 'Recuperação de Login'}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-xl mb-4 border border-red-100 text-xs font-bold">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-xl mb-4 border border-emerald-100 text-xs font-bold">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form
            onSubmit={
              view === 'login' ? handleLogin :
                view === 'register' ? handleRegister :
                  view === 'forgot-password' ? handlePasswordReset :
                    view === 'reset-password' ? handlePasswordUpdate :
                      handleForgotLogin
            }
            className="space-y-3 sm:space-y-4"
          >

            {/* Name Input - Only for Register */}
            {view === 'register' && (
              <div className="space-y-1 sm:space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text" required
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 text-sm"
                  />
                </div>
              </div>
            )}

            {(view === 'login' || view === 'register' || view === 'forgot-password') && (
              <div className="space-y-1 sm:space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="email" required
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="exemplo@email.com"
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 text-sm"
                  />
                </div>
              </div>
            )}

            {view === 'reset-password' && (
              <p className="text-xs text-slate-500 font-medium px-1">
                Digite sua nova senha abaixo para recuperar o acesso à sua conta.
              </p>
            )}

            {(view === 'login' || view === 'register' || view === 'reset-password') && (
              <div className="space-y-1 sm:space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {view === 'reset-password' ? 'Nova Senha' : 'Senha'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type={showPassword ? "text" : "password"} required
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 sm:py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {(view === 'register' || view === 'forgot-login') && (
              <div className="space-y-1 sm:space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Celular</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="tel" required
                    value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 text-sm"
                  />
                </div>
              </div>
            )}

            {view === 'forgot-login' && step === 2 && (
              <div className="space-y-1 sm:space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código SMS</label>
                <input
                  type="text" required
                  value={code} onChange={e => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 sm:py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 text-center tracking-[8px] text-lg"
                />
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3.5 sm:py-4 rounded-2xl font-black text-sm sm:text-base hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 mt-4 sm:mt-6 active:scale-[0.98] select-none touch-manipulation"
            >
              {loading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
              {view === 'login' && 'Entrar na Plataforma'}
              {view === 'register' && 'Criar minha Conta'}
              {view === 'forgot-password' && 'Enviar Código'}
              {view === 'reset-password' && 'Atualizar Senha'}
              {view === 'forgot-login' && (step === 1 ? 'Enviar Código' : 'Recuperar Acesso')}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-50 space-y-3">
            {view === 'login' ? (
              <>
                <button onClick={() => setView('register')} className="w-full text-center text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">Não tem conta? <span className="text-indigo-600 underline">Crie agora</span></button>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => setView('forgot-password')} className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors">Esqueci a senha</button>
                  <button onClick={() => { setView('forgot-login'); setStep(1); }} className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors">Esqueci o login</button>
                </div>
              </>
            ) : (
              <button onClick={() => { setView('login'); setStep(1); setError(null); }} className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 underline">Voltar para o Login</button>
            )}
          </div>
        </div>
      </div>
    </div >
  );
};
