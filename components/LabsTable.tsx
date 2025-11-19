
import React, { useState, useMemo } from 'react';
import { Lab } from '../types';
import { PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

type SortableKeys = 'name' | 'piName' | 'description' | 'researchersCount' | 'projectsCount';

interface SortConfig {
  key: SortableKeys;
  direction: 'ascending' | 'descending';
}

interface LabsTableProps {
  labs: Lab[];
  onEditLab: (lab: Lab) => void;
  onDeleteLab: (labId: string) => void;
  getResearcherName: (researcherId?: string) => string;
  getResearchersInLabCount: (labId: string) => number;
  getProjectsInLabCount: (labId: string) => number;
}

const LabsTable: React.FC<LabsTableProps> = ({
  labs,
  onEditLab,
  onDeleteLab,
  getResearcherName,
  getResearchersInLabCount,
  getProjectsInLabCount,
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'name', direction: 'ascending' });

  const sortedLabs = useMemo(() => {
    let sortableItems = [...labs];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        switch (sortConfig.key) {
          case 'name':
            valA = a.name;
            valB = b.name;
            break;
          case 'piName':
            valA = getResearcherName(a.principalInvestigatorId);
            valB = getResearcherName(b.principalInvestigatorId);
            break;
          case 'description':
            valA = a.description;
            valB = b.description;
            break;
          case 'researchersCount':
            valA = getResearchersInLabCount(a.id);
            valB = getResearchersInLabCount(b.id);
            break;
          case 'projectsCount':
            valA = getProjectsInLabCount(a.id);
            valB = getProjectsInLabCount(b.id);
            break;
          default:
            // Fallback for any other key, though all should be handled
            valA = (a as any)[sortConfig.key] || '';
            valB = (b as any)[sortConfig.key] || '';
            break;
        }
        
        if (typeof valA === 'string' && typeof valB === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [labs, sortConfig, getResearcherName, getResearchersInLabCount, getProjectsInLabCount]);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronDownIcon className="w-4 h-4 inline-block ml-1 text-gray-400 invisible group-hover:visible" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />;
    }
    return <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />;
  };

  const thClasses = "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors";
  const tdClasses = "px-4 py-3 whitespace-nowrap text-sm text-gray-700";
  const tdDescriptionClasses = "px-4 py-3 text-sm text-gray-700 max-w-xs truncate"; // For description with truncation


  return (
    <div className="overflow-x-auto shadow-md rounded-lg bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className={thClasses} onClick={() => requestSort('name')}>
              Lab Name {getSortIcon('name')}
            </th>
            <th scope="col" className={thClasses} onClick={() => requestSort('piName')}>
              Principal Investigator {getSortIcon('piName')}
            </th>
            <th scope="col" className={thClasses} onClick={() => requestSort('description')}>
              Description {getSortIcon('description')}
            </th>
            <th scope="col" className={`${thClasses} text-center`} onClick={() => requestSort('researchersCount')}>
              Researchers {getSortIcon('researchersCount')}
            </th>
            <th scope="col" className={`${thClasses} text-center`} onClick={() => requestSort('projectsCount')}>
              Projects {getSortIcon('projectsCount')}
            </th>
            <th scope="col" className={`${thClasses} text-center`}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedLabs.map((lab) => (
            <tr key={lab.id} className="hover:bg-gray-50 transition-colors" id={`lab-row-${lab.id}`}>
              <td className={tdClasses}>{lab.name}</td>
              <td className={tdClasses}>{getResearcherName(lab.principalInvestigatorId)}</td>
              <td className={tdDescriptionClasses} title={lab.description}>{lab.description}</td>
              <td className={`${tdClasses} text-center`}>{getResearchersInLabCount(lab.id)}</td>
              <td className={`${tdClasses} text-center`}>{getProjectsInLabCount(lab.id)}</td>
              <td className={`${tdClasses} text-center space-x-1`}>
                <button
                  onClick={() => onEditLab(lab)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-100"
                  title="Edit Lab"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteLab(lab.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-100"
                  title="Delete Lab"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LabsTable;
