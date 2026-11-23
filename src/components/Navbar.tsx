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
    <header className="sticky top-0 z-40 bg-white border-b-2 border-[#1E293B]">
      <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center space-x-2.5">
              <span className="nb-heading text-base font-bold text-[#1E293B] tracking-tight leading-tight">
                Sistem Generator Surat
              </span>
              <span className="text-[11px] bg-[#99F6E4] text-[#1E293B] px-2.5 py-0.5 rounded-md font-bold border-[1.5px] border-[#1E293B] shadow-[2px_2px_0px_#1E293B] tracking-wide">
                PUSAKA
              </span>
            </div>
            <div className="text-[11px] text-slate-600 font-semibold leading-normal mt-0.5">
              Pusat Kebijakan Strategis &middot; Komunikasi dan Digital RI
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-2 p-1.5 bg-[#F8F9FA] border-2 border-[#1E293B] rounded-lg shadow-[3px_3px_0px_#1E293B]">
            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs rounded-md cursor-pointer ${
                activeTab === 'generator'
                  ? 'bg-[#FEF08A] text-[#1E293B] font-bold'
                  : 'bg-white text-slate-700 hover:bg-slate-100 font-semibold'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#1E293B]" />
              <span>Pembuatan Surat</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs rounded-md cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-[#BAE6FD] text-[#1E293B] font-bold'
                  : 'bg-white text-slate-700 hover:bg-slate-100 font-semibold'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-[#1E293B]" />
              <span>Buku Agenda &amp; Database</span>
            </button>
          </nav>

          {/* Right: Sheets Status, & User Profile */}
          <div className="flex items-center space-x-2.5">
            {/* Google Sheets Connection Status */}
            <button
              onClick={onOpenSheetsConfig}
              title={
                isSheetsConnected
                  ? 'Terhubung ke Google Sheets — Klik untuk konfigurasi'
                  : 'Belum terhubung ke Google Sheets — Klik untuk setup'
              }
              className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-md cursor-pointer ${
                isSheetsConnected
                  ? 'bg-[#A7F3D0] text-[#1E293B] hover:bg-[#6EE7B7]'
                  : 'bg-[#FDE68A] text-[#1E293B] hover:bg-[#FCD34D]'
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
              <div className="flex items-center space-x-2 pl-2.5 border-l-2 border-[#1E293B]">
                <div className="flex items-center space-x-2 bg-[#F8F9FA] border-[1.5px] border-[#1E293B] shadow-[2px_2px_0px_#1E293B] py-1 px-2.5 rounded-md text-xs">
                  <div
                    className={`w-5 h-5 rounded border border-[#1E293B] flex items-center justify-center font-bold text-[10px] text-[#1E293B] ${
                      currentUser.role === 'admin' ? 'bg-[#99F6E4]' : 'bg-[#BAE6FD]'
                    }`}
                  >
                    {currentUser.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <div
                      className="font-bold text-[#1E293B] text-[11px] leading-tight max-w-[130px] truncate"
                      title={currentUser.nama}
                    >
                      {currentUser.nama}
                    </div>
                    <div className="text-[10px] text-slate-600 font-semibold flex items-center space-x-1">
                      <span>{currentUser.role === 'admin' ? 'Admin TU' : 'Staf'}</span>
                    </div>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Keluar dari akun (Logout)"
                    className="flex items-center space-x-1 bg-[#FFE4E6] hover:bg-[#FECDD3] text-[#1E293B] px-2.5 py-1.5 rounded-md text-xs font-bold cursor-pointer"
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
