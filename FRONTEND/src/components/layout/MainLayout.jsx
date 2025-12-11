import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import NightBg from '../../assets/IMAGES/night-bg.jpg';

export default function MainLayout({ theme }) {
  return (
    <div
      className={`flex min-h-screen transition-all ${
        theme === 'dark' ? 'relative' : ''
      }`}
    >
      {/* DARK MODE BACKGROUND IMAGE */}
      {theme === 'dark' && (
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: `url(${NightBg})` }}
        ></div>
      )}

      {/* BLACK OVERLAY */}
      {theme === 'dark' && (
        <div className="absolute inset-0 bg-black/70 z-0"></div>
      )}

      {/* Sidebar + Main */}
      <Sidebar appTheme={theme} />

      <main
        className="
        flex-1 p-4 relative z-10 overflow-y-auto
        bg-[#FDF5BD] dark:bg-transparent
        text-black dark:text-white
        transition-all
      "
      >
        <Outlet context={{ theme }} />
      </main>
    </div>
  );
}
