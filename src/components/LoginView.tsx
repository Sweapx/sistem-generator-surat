import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { User } from '../types';
import { login } from '../services/authService';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  isSheetsConnected?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
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
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Subtle Organic Ambient Glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#DCE7E1]/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#EFE5D5]/60 blur-3xl" />

      {/* Main Login Card — Natural Neutral Soft Floating Card */}
      <div className="w-full max-w-md bg-[#FCFBF8] rounded-2xl border border-[#E6E2D8] shadow-[0_12px_40px_-8px_rgba(43,42,39,0.08),0_2px_8px_rgba(43,42,39,0.03)] p-7 sm:p-9 relative z-10">
        {/* Header Identitas Resmi */}
        <div className="text-center space-y-2.5 mb-7">
          <div>
            <span className="text-[10px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full bg-[#EBF2EE] text-[#2F5246] border border-[#CDE0D6] inline-block">
              PUSAT KEBIJAKAN STRATEGIS
            </span>
            <h1 className="nn-heading text-xl sm:text-2xl font-bold text-[#2B2A27] tracking-tight mt-3">
              Sistem Generator Surat
            </h1>
            <p className="text-xs text-[#6E6A63] font-medium mt-1">
              Kementerian Komunikasi dan Digital Republik Indonesia
            </p>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#F9ECEA] border border-[#ECCBC7] text-[#7D342C] text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-[#A64439] shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Username */}
          <div>
            <label className="block text-xs font-semibold text-[#3F3D38] mb-1.5">
              Username / Akun Pegawai
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A857C]">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: admin_tu atau nama_staf"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#F6F4EF] rounded-xl text-xs text-[#2B2A27] placeholder-[#9B968C] font-medium"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Input Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#3F3D38]">
                Kata Sandi (Password)
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A857C]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi akun"
                className="w-full pl-10 pr-10 py-2.5 bg-[#F6F4EF] rounded-xl text-xs text-[#2B2A27] placeholder-[#9B968C] font-medium"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8A857C] hover:text-[#2B2A27] cursor-pointer"
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
                className="w-4 h-4 rounded text-[#3D6356] border-[#CEC8BA] focus:ring-[#3D6356]/30 cursor-pointer accent-[#3D6356]"
              />
              <span className="text-xs text-[#59554E] font-medium">Ingat saya di perangkat ini</span>
            </label>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#3D6356] hover:bg-[#315247] text-[#FAF9F6] rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center space-x-2 shadow-[0_2px_8px_rgba(61,99,86,0.22)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-[#FAF9F6]" viewBox="0 0 24 24">
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
