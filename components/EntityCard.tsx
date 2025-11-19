
import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface EntityCardProps {
  title: string;
  details: { label: string; value: string | undefined | null | React.ReactNode }[];
  onEdit?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode; // For additional content like notes or sub-lists
}

const EntityCard: React.FC<EntityCardProps> = ({ title, details, onEdit, onDelete, children }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-blue-700">{title}</h3>
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
              title="Edit"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {details.map((detail, index) => (
          detail.value ? (
            <div key={index} className="flex text-sm">
              <span className="font-medium text-gray-600 w-1/3">{detail.label}:</span>
              <span className="text-gray-800 w-2/3">{detail.value}</span>
            </div>
          ) : null
        ))}
      </div>
      {children && <div className="mt-4 pt-4 border-t border-gray-200">{children}</div>}
    </div>
  );
};

export default EntityCard;
