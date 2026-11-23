import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';
import { login } from '../services/authService';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  isSheetsConnected?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  isSheetsConnected = false,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Silakan isi username dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loggedUser = await login(username, password, rememberMe);
      onLoginSuccess(loggedUser);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat masuk. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(#CBD5E1 1.25px, transparent 1.25px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Main Login Card — Soft Neo-Brutalism Corporate */}
      <div className="w-full max-w-md bg-white rounded-lg border-2 border-[#1E293B] shadow-[6px_6px_0px_#1E293B] p-7 sm:p-8 relative z-10">
        {/* Header Identitas Resmi */}
        <div className="text-center space-y-2.5 mb-6">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-md bg-[#99F6E4] text-[#1E293B] border-[1.5px] border-[#1E293B] shadow-[2px_2px_0px_#1E293B] inline-block">
              PUSAT KEBIJAKAN STRATEGIS
            </span>
            <h1 className="nb-heading text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight mt-3">
              Sistem Generator Surat
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Kementerian Komunikasi dan Digital Republik Indonesia
            </p>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-md bg-[#FFE4E6] border-2 border-[#1E293B] shadow-[3px_3px_0px_#1E293B] text-[#1E293B] text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <div className="flex-1 font-semibold leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Username */}
          <div>
            <label className="block text-xs font-bold text-[#1E293B] mb-1.5">
              Username / Akun Pegawai
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1E293B]">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: admin_tu atau nama_staf"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#F8F9FA] rounded-md text-xs text-[#1E293B] placeholder-slate-400 font-semibold"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Input Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#1E293B]">
                Kata Sandi (Password)
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1E293B]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi akun"
                className="w-full pl-10 pr-10 py-2.5 bg-[#F8F9FA] rounded-md text-xs text-[#1E293B] placeholder-slate-400 font-semibold"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="nb-flat absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-[#1E293B] cursor-pointer"
                title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#1E293B] border-2 border-[#1E293B] focus:ring-0 cursor-pointer"
              />
              <span className="text-xs text-[#1E293B] font-semibold">Ingat saya di perangkat ini</span>
            </label>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#99F6E4] hover:bg-[#5EEAD4] text-[#1E293B] rounded-md text-xs font-bold tracking-wide flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-[#1E293B]" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Memverifikasi Akun...</span>
              </span>
            ) : (
              <>
                <span>Masuk ke Sistem</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
