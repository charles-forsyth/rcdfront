
import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

interface PageShellProps {
  title: string;
  onAddItem?: () => void;
  addItemLabel?: string;
  children: React.ReactNode;
}

const PageShell: React.FC<PageShellProps> = ({ title, onAddItem, addItemLabel = "Add New", children }) => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        {onAddItem && (
          <button
            onClick={onAddItem}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            {addItemLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
};

export default PageShell;
