'use client';

import { signOut } from 'next-auth/react';

interface HeaderProps {
  user: {
    name: string;
    role: string;
  };
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <div>
              <h1 className="text-2xl font-bold text-white">🛡️ PawaEye</h1>
              <p className="text-sm text-blue-100">AI Threat Intelligence</p>
            </div>
            <nav className="flex items-center space-x-6">
              <a
                href="/dashboard"
                className="text-white hover:text-blue-100 transition-colors font-medium text-sm"
              >
                🏠 Dashboard
              </a>
              <a
                href="/analytics"
                className="text-white hover:text-blue-100 transition-colors font-medium text-sm"
              >
                🔮 Analytics
              </a>
              <a
                href="/detection"
                className="text-white hover:text-blue-100 transition-colors font-medium text-sm"
              >
                🚨 Detection
              </a>
              <a
                href="/intelligence"
                className="text-white hover:text-blue-100 transition-colors font-medium text-sm"
              >
                🌍 Intelligence
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-white">{user.name}</div>
              <div className="text-xs text-blue-100">{user.role}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition text-sm font-medium shadow-md"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
