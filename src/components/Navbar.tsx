import React from 'react';
import {
  Home,
  FileText,
  Database,
  Wifi,
  WifiOff,
  LogOut,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  activeTab: 'home' | 'generator' | 'database';
  setActiveTab: (tab: 'home' | 'generator' | 'database') => void;
  nextNomorLengkap: string;
  isSheetsConnected?: boolean;
  onOpenSheetsConfig?: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isSheetsConnected = false,
  onOpenSheetsConfig,
  currentUser,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FCFBF8]/90 backdrop-blur-md border-b border-[#E6E2D8] shadow-[0_1px_12px_rgba(43,42,39,0.03)]">
      <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex flex-col justify-center cursor-pointer group"
            title="Kembali ke Beranda PUSAKA"
          >
            <div className="flex items-center space-x-2.5">
              <span className="nn-heading text-base font-bold text-[#2B2A27] group-hover:text-[#3D6356] transition-colors tracking-tight leading-tight">
                Sistem Generator Surat
              </span>
              <span className="text-[10.5px] bg-[#EBF2EE] text-[#2F5246] px-2.5 py-0.5 rounded-full font-semibold border border-[#CDE0D6] tracking-wide">
                PUSAKA
              </span>
            </div>
            <div className="text-[11px] text-[#6E6A63] font-medium leading-normal mt-0.5">
              Pusat Kebijakan Strategis &middot; Komunikasi dan Digital RI
            </div>
          </div>

          {/* Center Navigation Tabs — Soft Pill Segmented Control */}
          <nav className="flex items-center gap-1 p-1 bg-[#EFECE5] border border-[#E2DDD2] rounded-xl">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs rounded-lg cursor-pointer transition-all ${
                activeTab === 'home'
                  ? 'bg-[#FCFBF8] text-[#2B2A27] font-semibold shadow-[0_1px_3px_rgba(43,42,39,0.08)] border border-[#E5E0D5]'
                  : 'text-[#66625B] hover:text-[#2B2A27] hover:bg-[#FAF8F4]/60 font-medium'
              }`}
            >
              <Home className={`w-3.5 h-3.5 ${activeTab === 'home' ? 'text-[#3D6356]' : 'text-[#7A756C]'}`} />
              <span>Beranda</span>
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs rounded-lg cursor-pointer transition-all ${
                activeTab === 'generator'
                  ? 'bg-[#FCFBF8] text-[#2B2A27] font-semibold shadow-[0_1px_3px_rgba(43,42,39,0.08)] border border-[#E5E0D5]'
                  : 'text-[#66625B] hover:text-[#2B2A27] hover:bg-[#FAF8F4]/60 font-medium'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${activeTab === 'generator' ? 'text-[#3D6356]' : 'text-[#7A756C]'}`} />
              <span>Pembuatan Surat</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs rounded-lg cursor-pointer transition-all ${
                activeTab === 'database'
                  ? 'bg-[#FCFBF8] text-[#2B2A27] font-semibold shadow-[0_1px_3px_rgba(43,42,39,0.08)] border border-[#E5E0D5]'
                  : 'text-[#66625B] hover:text-[#2B2A27] hover:bg-[#FAF8F4]/60 font-medium'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${activeTab === 'database' ? 'text-[#3D6356]' : 'text-[#7A756C]'}`} />
              <span>Buku Agenda &amp; Database</span>
            </button>
          </nav>

          {/* Right: Sheets Status & User Profile */}
          <div className="flex items-center space-x-2.5">
            {/* Google Sheets Connection Status */}
            <button
              onClick={onOpenSheetsConfig}
              title={
                isSheetsConnected
                  ? 'Terhubung ke Google Sheets — Klik untuk konfigurasi'
                  : 'Belum terhubung ke Google Sheets — Klik untuk setup'
              }
              className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border cursor-pointer ${
                isSheetsConnected
                  ? 'bg-[#EBF2EE] text-[#2B4F43] border-[#CDE0D6] hover:bg-[#DFECE5]'
                  : 'bg-[#F7EFE2] text-[#7A542E] border-[#E8D6BA] hover:bg-[#F1E5D2]'
              }`}
            >
              {isSheetsConnected ? (
                <Wifi className="w-3.5 h-3.5 text-[#3D6356]" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-[#9A6B3B]" />
              )}
              <span className="hidden sm:inline">
                {isSheetsConnected ? 'Sheets: Terhubung' : 'Sheets: Belum Setup'}
              </span>
            </button>

            {/* User Profile Badge & Logout */}
            {currentUser && (
              <div className="flex items-center space-x-2 pl-2.5 border-l border-[#E6E2D8]">
                <div className="flex items-center space-x-2 bg-[#F5F3EE] border border-[#E4E0D6] py-1 px-2.5 rounded-xl text-xs">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-semibold text-[10px] ${
                      currentUser.role === 'admin'
                        ? 'bg-[#3D6356] text-[#FAF9F6]'
                        : 'bg-[#5A6B7C] text-[#FAF9F6]'
                    }`}
                  >
                    {currentUser.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <div
                      className="font-semibold text-[#2B2A27] text-[11px] leading-tight max-w-[130px] truncate"
                      title={currentUser.nama}
                    >
                      {currentUser.nama}
                    </div>
                    <div className="text-[10px] text-[#7A756C] font-medium flex items-center space-x-1">
                      <span>{currentUser.role === 'admin' ? 'Admin TU' : 'Staf'}</span>
                    </div>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Keluar dari akun (Logout)"
                    className="flex items-center space-x-1 bg-[#F9ECEA] hover:bg-[#F3DFDC] text-[#8C3B32] border border-[#ECCBC7] px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
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
