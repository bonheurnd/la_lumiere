/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { BrandingProvider } from './context/BrandingContext';
import { AudioProvider } from './context/AudioContext';

import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { SongbookScreen } from './components/SongbookScreen';
import { SongDetailScreen } from './components/SongDetailScreen';
import { AudioLibraryScreen } from './components/AudioLibraryScreen';
import { SupportScreen } from './components/SupportScreen';
import { MoreScreen } from './components/MoreScreen';
import { AboutScreen } from './components/AboutScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { GlobalAudioPlayer } from './components/GlobalAudioPlayer';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AuthModal } from './components/AuthModal';
import { AppStorePrepModal } from './components/AppStorePrepModal';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState<boolean>(false);

  const handleSelectSong = (songId: string) => {
    setSelectedSongId(songId);
  };

  const handleBackFromSong = () => {
    setSelectedSongId(null);
  };

  const handleNavigateToTab = (tab: string) => {
    setSelectedSongId(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Mobile Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigateToTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3.5 sm:px-6 pt-4">
        {selectedSongId ? (
          <SongDetailScreen
            songId={selectedSongId}
            onBack={handleBackFromSong}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                onSelectSong={handleSelectSong}
                onNavigateToTab={handleNavigateToTab}
                onOpenSearch={() => setIsSearchOpen(true)}
              />
            )}

            {activeTab === 'songs' && (
              <SongbookScreen
                onSelectSong={handleSelectSong}
              />
            )}

            {activeTab === 'audio' && (
              <AudioLibraryScreen
                onOpenSongLyrics={handleSelectSong}
              />
            )}

            {activeTab === 'support' && (
              <SupportScreen />
            )}

            {activeTab === 'more' && (
              <MoreScreen
                onNavigateToTab={handleNavigateToTab}
                onOpenStoreModal={() => setIsStoreModalOpen(true)}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'about' && (
              <AboutScreen />
            )}

            {activeTab === 'profile' && (
              <ProfileScreen
                onSelectSong={handleSelectSong}
                onNavigateToTab={handleNavigateToTab}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'admin' && (
              <AdminDashboard
                onSelectSong={handleSelectSong}
                onNavigateHome={() => handleNavigateToTab('home')}
              />
            )}
          </>
        )}
      </main>

      {/* Persistent Audio Player Dock & Modal */}
      <GlobalAudioPlayer onOpenSong={handleSelectSong} />

      {/* Persistent Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleNavigateToTab}
      />

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSong={handleSelectSong}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <AppStorePrepModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrandingProvider>
        <AudioProvider>
          <AppContent />
        </AudioProvider>
      </BrandingProvider>
    </AuthProvider>
  );
}
