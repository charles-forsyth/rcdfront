
import React, { useRef } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { NAVIGATION_ITEMS, APP_TITLE } from '../constants';
import { BuildingLibraryIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/solid';

interface LayoutProps {
  onExportData: () => void;
  onImportData: (jsonString: string) => boolean;
}

const Layout: React.FC<LayoutProps> = ({ onExportData, onImportData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          onImportData(content);
        } catch (error) {
          console.error("Error reading file:", error);
          alert("Error reading file. Please try again.");
        }
      };
      reader.onerror = () => {
        console.error("FileReader error:", reader.error);
        alert("Failed to read the selected file.");
      };
      reader.readAsText(file);
      // Reset file input value to allow importing the same file again
      if(event.target) event.target.value = '';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-slate-100 flex flex-col p-4 space-y-6 shadow-lg">
        <div className="flex items-center space-x-3 px-2 py-3 border-b border-slate-700">
          <BuildingLibraryIcon className="h-10 w-10 text-blue-400" />
          <h1 className="text-xl font-bold tracking-tight">{APP_TITLE}</h1>
        </div>
        <nav className="flex-grow">
          <ul className="space-y-1">
            {NAVIGATION_ITEMS.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'} 
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ease-in-out
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-6 w-6" />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
           {/* Import/Export Section */}
          <div className="mt-8 pt-4 border-t border-slate-700">
             <h3 className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Management</h3>
             <ul className="space-y-1 mt-2">
                <li>
                  <button
                    onClick={handleImportClick}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white w-full text-left transition-colors duration-150 ease-in-out"
                    title="Import data from a JSON file"
                  >
                    <ArrowUpTrayIcon className="h-6 w-6" />
                    <span>Import Data</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-hidden="true"
                  />
                </li>
                <li>
                  <button
                    onClick={onExportData}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white w-full text-left transition-colors duration-150 ease-in-out"
                    title="Export current data to a JSON file"
                  >
                    <ArrowDownTrayIcon className="h-6 w-6" />
                    <span>Export Data</span>
                  </button>
                </li>
             </ul>
          </div>
        </nav>
        <div className="mt-auto text-center text-xs text-slate-400 p-2 border-t border-slate-700">
          UCR Research Computing
          <br />
          &copy; {new Date().getFullYear()}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet /> {/* This is where nested routes will render their components */}
      </main>
    </div>
  );
};

export default Layout;
