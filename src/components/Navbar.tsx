import React from 'react';
import {
  Home,
  FileText,
  Database,
  Wifi,
  WifiOff,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  activeTab: 'home' | 'generator' | 'database';
  setActiveTab: (tab: 'home' | 'generator' | 'database') => void;
  nextNomorLengkap: string;
  isSheetsConnected?: boolean;
  isSyncingSheets?: boolean;
  onSyncNow?: () => void;
  onOpenSheetsConfig?: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isSheetsConnected = false,
  isSyncingSheets = false,
  onSyncNow,
  onOpenSheetsConfig,
  currentUser,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl saturate-150 border-b border-white/80 shadow-[0_4px_24px_-6px_rgba(34,31,26,0.09)]">
      <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex flex-col justify-center cursor-pointer group"
            title="Kembali ke Beranda PUSAKA"
          >
            <div className="flex items-center space-x-2.5">
              <span className="nn-heading text-base font-bold text-[#242320] group-hover:text-[#2F6B57] transition-colors tracking-tight leading-tight">
                Sistem Generator Surat
              </span>
              <span className="text-[10.5px] bg-[#2F6B57] text-white px-2.5 py-0.5 rounded-full font-semibold shadow-[0_2px_6px_rgba(47,107,87,0.28)] tracking-wide">
                PUSAKA
              </span>
            </div>
            <div className="text-[11px] text-[#5C5850] font-medium leading-normal mt-0.5">
              Pusat Kebijakan Strategis &middot; Komunikasi dan Digital RI
            </div>
          </div>

          {/* Center Navigation Tabs — Frosted Glass Segmented Control */}
          <nav className="flex items-center gap-1 p-1 bg-[#D2CBC0]/55 backdrop-blur-md border border-white/65 rounded-2xl shadow-[inset_0_1px_3px_rgba(34,31,26,0.08)]">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs rounded-xl cursor-pointer transition-all ${
                activeTab === 'home'
                  ? 'bg-white/95 text-[#1F4A3A] font-bold shadow-[0_2px_8px_rgba(34,31,26,0.10)] border border-white'
                  : 'text-[#524E46] hover:text-[#242320] hover:bg-white/45 font-medium'
              }`}
            >
              <Home className={`w-3.5 h-3.5 ${activeTab === 'home' ? 'text-[#2F6B57]' : 'text-[#6A655C]'}`} />
              <span>Beranda</span>
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs rounded-xl cursor-pointer transition-all ${
                activeTab === 'generator'
                  ? 'bg-white/95 text-[#1F4A3A] font-bold shadow-[0_2px_8px_rgba(34,31,26,0.10)] border border-white'
                  : 'text-[#524E46] hover:text-[#242320] hover:bg-white/45 font-medium'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${activeTab === 'generator' ? 'text-[#2F6B57]' : 'text-[#6A655C]'}`} />
              <span>Pembuatan Surat</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs rounded-xl cursor-pointer transition-all ${
                activeTab === 'database'
                  ? 'bg-white/95 text-[#2D4263] font-bold shadow-[0_2px_8px_rgba(34,31,26,0.10)] border border-white'
                  : 'text-[#524E46] hover:text-[#242320] hover:bg-white/45 font-medium'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${activeTab === 'database' ? 'text-[#3D5275]' : 'text-[#6A655C]'}`} />
              <span>Buku Agenda &amp; Database</span>
            </button>
          </nav>

          {/* Right: Sheets Status, Sync Button & User Profile */}
          <div className="flex items-center space-x-2">
            {onSyncNow && (
              <button
                type="button"
                onClick={onSyncNow}
                disabled={isSyncingSheets}
                title="Sinkronisasi data terbaru dari Google Sheets sekarang"
                className="p-2 rounded-xl bg-white/75 hover:bg-white text-[#2F6B57] border border-white/85 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Google Sheets Connection Status */}
            <button
              onClick={onOpenSheetsConfig}
              title={
                isSheetsConnected
                  ? 'Terhubung ke Google Sheets & Drive — Klik untuk konfigurasi'
                  : 'Klik untuk konfigurasi & uji koneksi Google Sheets / Drive'
              }
              className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-2xs cursor-pointer ${
                isSheetsConnected
                  ? 'bg-[#DDF0E7]/90 text-[#1F4A3A] border-[#B2D8C5] hover:bg-[#CFE9DC]'
                  : 'bg-[#FCEAD2]/90 text-[#7A4819] border-[#E8C89E] hover:bg-[#F8DFBE]'
              }`}
            >
              {isSheetsConnected ? (
                <Wifi className="w-3.5 h-3.5 text-[#2F6B57]" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-[#A86A2D]" />
              )}
              <span className="hidden sm:inline">
                {isSheetsConnected ? 'Sheets: Terhubung' : 'Sheets: Cek Koneksi'}
              </span>
            </button>

            {/* User Profile Badge & Logout */}
            {currentUser && (
              <div className="flex items-center space-x-2 pl-2 border-l border-[#C9C2B4]">
                <div className="flex items-center space-x-2 bg-white/75 backdrop-blur-md border border-white/85 shadow-2xs py-1 px-2.5 rounded-xl text-xs">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      currentUser.role === 'admin'
                        ? 'bg-[#2F6B57] text-white'
                        : 'bg-[#3D5275] text-white'
                    }`}
                  >
                    {currentUser.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <div
                      className="font-semibold text-[#242320] text-[11px] leading-tight max-w-[130px] truncate"
                      title={currentUser.nama}
                    >
                      {currentUser.nama}
                    </div>
                    <div className="text-[10px] text-[#66625B] font-medium flex items-center space-x-1">
                      <span>{currentUser.role === 'admin' ? 'Admin TU' : 'Staf'}</span>
                    </div>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Keluar dari akun (Logout)"
                    className="flex items-center space-x-1 bg-[#FCE6E3]/90 hover:bg-[#F8D5D0] text-[#8C332A] border border-[#EBBAB3] px-2.5 py-1.5 rounded-xl text-xs font-semibold shadow-2xs cursor-pointer"
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
