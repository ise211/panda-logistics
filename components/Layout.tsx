import React from 'react';

export const MobileLayout: React.FC<{ children: React.ReactNode, title: string, onBack?: () => void, isDark?: boolean }> = ({ children, title, onBack, isDark }) => {
  return (
    <div className={`min-h-screen ${isDark ? 'bg-secondary text-white' : 'bg-gray-100 text-secondary'} transition-colors duration-300`}>
      <header className={`${isDark ? 'bg-black border-slate-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-10 px-4 py-3 flex items-center shadow-sm`}>
        {onBack && (
          <button onClick={onBack} className="mr-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
        <div className="flex-1 truncate flex items-center gap-2">
            {/* Small logo for mobile context if needed, otherwise just title */}
            <h1 className="text-lg font-bold">{title}</h1>
        </div>
      </header>
      <main className="p-4 pb-24 max-w-md mx-auto">
        {children}
      </main>
    </div>
  );
};

interface Tab { id: string; label: string; }

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
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary text-white flex-shrink-0 hidden md:flex flex-col">
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
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${currentTab === tab.id ? 'bg-primary text-white font-bold shadow-lg' : 'text-slate-300 hover:bg-black/30'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700 bg-black/20">
          <div className="mb-2 text-sm text-slate-300">{user.name}</div>
          <button onClick={onLogout} className="text-red-400 hover:text-red-300 text-sm">Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center md:hidden">
           <img src="https://www.pandarosametals.co.uk/wp-content/uploads/2015/10/logo.jpg" alt="PandaRosaMetals" className="h-10" />
           <button onClick={onLogout} className="text-sm text-red-600">Logout</button>
        </header>
        <header className="bg-white shadow-sm px-8 py-4 hidden md:block border-b border-gray-200">
           <h1 className="font-bold text-xl text-secondary">{title}</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t flex justify-around p-2 z-20 overflow-x-auto">
         {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`p-2 min-w-[60px] text-xs font-medium whitespace-nowrap ${currentTab === tab.id ? 'text-primary' : 'text-slate-500'}`}
            >
              {tab.label}
            </button>
         ))}
      </div>
    </div>
  );
};