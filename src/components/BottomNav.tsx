import React from 'react';
import { Home, BookOpen, Music, HeartHandshake, MoreHorizontal } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'songs', label: 'Songs', icon: BookOpen },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'support', label: 'Support', icon: HeartHandshake },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-1.5 shadow-lg max-w-4xl mx-auto transition-all pb-[env(safe-area-inset-bottom,8px)]">
      <div className="flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all duration-150 active:scale-90 ${
                isActive
                  ? 'text-blue-900 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-full transition-transform ${
                  isActive ? 'bg-blue-100 scale-110 text-blue-900' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] mt-0.5 leading-tight ${isActive ? 'font-bold text-blue-900' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
