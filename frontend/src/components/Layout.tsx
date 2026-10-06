import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Network, User, Route, Clock } from 'lucide-react';

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Social Network Analyzer
          </h1>
          <p className="text-xs text-slate-400 mt-2">Community Detection & Relationship Analysis</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <Network size={20} />
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink 
            to="/user-analysis" 
            className={({ isActive }) => 
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <User size={20} />
            <span>User Analysis</span>
          </NavLink>
          
          <NavLink 
            to="/relationship" 
            className={({ isActive }) => 
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <Route size={20} />
            <span>Relationship Path</span>
          </NavLink>

          <NavLink 
            to="/temporal" 
            className={({ isActive }) => 
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <Clock size={20} />
            <span>Temporal Paths</span>
          </NavLink>
        </nav>
        
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-900 relative">
        <Outlet />
      </main>
    </div>
  );
};
