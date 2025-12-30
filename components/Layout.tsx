import React from 'react';

export const MobileLayout: React.FC<{ children: React.ReactNode, title: string, onBack?: () => void, isDark?: boolean }> = ({ children, title, onBack, isDark }) => {
  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-300 font-sans`}>
      {/* Glassmorphism Header */}
      <header className={`sticky top-0 z-20 px-4 py-4 flex items-center justify-between backdrop-blur-md border-b bg-opacity-90 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
            {onBack && (
            <button onClick={onBack} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            )}
            <h1 className="text-xl font-bold truncate tracking-tight">{title}</h1>
        </div>
        {!onBack && (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <img src="https://www.pandarosametals.co.uk/wp-content/uploads/2015/10/logo.jpg" alt="Logo" className="w-6 h-6 object-contain rounded-sm mix-blend-multiply" />
            </div>
        )}
      </header>
      
      {/* Content Area with safe bottom padding for fixed buttons */}
      <main className="p-4 pb-32 max-w-lg mx-auto">
        {children}
      </main>
    </div>
  );
};

export interface Tab { id: string; label: string; mobileLabel?: string; count?: number; }

export const WebLayout: React.FC<{ 
  children: React.ReactNode, 
  title: string, 
  user: any, 
  onLogout: () => void, 
  currentTab: string, 
  onTabChange: (t: string) => void,
  tabs?: Tab[]
}> = ({ children, title, user, onLogout, currentTab, onTabChange, tabs: providedTabs }) => {
  const tabs = providedTabs || [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'orders', label: 'Orders' },
    { id: 'registry', label: 'Registry' },
    { id: 'reports', label: 'Reports' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary text-white flex-shrink-0 hidden md:flex flex-col shadow-xl z-10">
        <div className="p-6 bg-white flex justify-center items-center">
            <img 
                src="https://www.pandarosametals.co.uk/wp-content/uploads/2015/10/logo.jpg" 
                alt="PandaRosaMetals" 
                className="h-16 w-auto object-contain"
            />
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${currentTab === tab.id ? 'bg-primary text-white font-bold shadow-lg shadow-primary/30 transform scale-105' : 'text-slate-300 hover:bg-white/10'}`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 ${currentTab === tab.id ? 'bg-white text-primary' : 'bg-red-500 text-white'}`}>
                      {tab.count}
                  </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700 bg-black/20">
          <div className="mb-2 text-sm text-slate-300 font-medium">{user.name}</div>
          <button onClick={onLogout} className="text-red-400 hover:text-red-300 text-sm font-bold flex items-center gap-1">
             <span>←</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center md:hidden z-20">
           <img src="https://www.pandarosametals.co.uk/wp-content/uploads/2015/10/logo.jpg" alt="PandaRosaMetals" className="h-10" />
           <button onClick={onLogout} className="text-sm text-red-600 font-bold">Logout</button>
        </header>
        <header className="bg-white shadow-sm px-8 py-5 hidden md:block border-b border-gray-200">
           <h1 className="font-bold text-2xl text-secondary">{title}</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-2 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-safe">
         {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`p-2 flex-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex flex-col items-center gap-1 relative ${currentTab === tab.id ? 'text-primary bg-blue-50' : 'text-slate-400'}`}
            >
              <div className={`w-1 h-1 rounded-full ${currentTab === tab.id ? 'bg-primary' : 'bg-transparent'}`} />
              {tab.mobileLabel || tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                  <span className="absolute top-1 right-2 min-w-[16px] h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full px-1 shadow-sm">
                      {tab.count}
                  </span>
              )}
            </button>
         ))}
      </div>
    </div>
  );
};