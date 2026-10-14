import {
  FileText,
  Database,
  CheckCircle2,
  Hash,
  Wifi,
  WifiOff,
  User as UserIcon,
  LogOut,
  Shield,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  activeTab: 'generator' | 'database';
  setActiveTab: (tab: 'generator' | 'database') => void;
  nextNomorLengkap: string;
  isSheetsConnected?: boolean;
  onOpenSheetsConfig?: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  nextNomorLengkap,
  isSheetsConnected = false,
  onOpenSheetsConfig,
  currentUser,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <img
              src="/komdigi_logo.png"
              alt="Logo Komdigi"
              className="h-10 w-auto object-contain"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900 tracking-tight">
                  Sistem Generator Surat Tugas
                </span>
                <span className="text-xs bg-teal-50 text-teal-800 px-2 py-0.5 rounded font-semibold border border-teal-200">
                  PUSAKA
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Pusat Kebijakan Strategis &middot; Komunikasi dan Digital RI
              </div>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'generator'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-teal-700" />
              <span>Pembuatan Surat Tugas</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-700" />
              <span>Buku Agenda &amp; Database</span>
            </button>
          </nav>

          {/* Right: Next Number Indicator, Sheets Status, & User Profile */}
          <div className="flex items-center space-x-2.5">
            <div className="hidden xl:flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
              <Hash className="w-3.5 h-3.5 text-teal-700" />
              <span>Nomor Berikutnya:</span>
              <span className="font-mono font-semibold text-slate-900">
                {nextNomorLengkap}
              </span>
            </div>

            {/* Google Sheets Connection Status */}
            <button
              onClick={onOpenSheetsConfig}
              title={
                isSheetsConnected
                  ? 'Terhubung ke Google Sheets — Klik untuk konfigurasi'
                  : 'Belum terhubung ke Google Sheets — Klik untuk setup'
              }
              className={`flex items-center space-x-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-all cursor-pointer ${
                isSheetsConnected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
              }`}
            >
              {isSheetsConnected ? (
                <Wifi className="w-3.5 h-3.5" />
              ) : (
                <WifiOff className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isSheetsConnected ? 'Sheets: Terhubung' : 'Sheets: Belum Setup'}
              </span>
            </button>

            {/* User Profile Badge & Logout */}
            {currentUser && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-md text-xs">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                    currentUser.role === 'admin' ? 'bg-teal-700' : 'bg-blue-600'
                  }`}>
                    {currentUser.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="font-semibold text-slate-800 text-[11px] leading-tight max-w-[130px] truncate" title={currentUser.nama}>
                      {currentUser.nama}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <span>{currentUser.role === 'admin' ? 'Admin TU' : 'Staf'}</span>
                    </div>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Keluar dari akun (Logout)"
                    className="flex items-center space-x-1 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Keluar</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
