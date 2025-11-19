import React, { useState, useMemo } from 'react';
import { Researcher, Lab, Note, Grant, GrantStatus } from '../types';
import { PencilIcon, TrashIcon, ChatBubbleLeftEllipsisIcon, ChevronUpIcon, ChevronDownIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

type SortableKeys = 'name' | 'title' | 'email' | 'department' | 'labName' | 'notesCount' | 'activeGrantsCount';

interface SortConfig {
  key: SortableKeys;
  direction: 'ascending' | 'descending';
}

interface ResearchersTableProps {
  researchers: Researcher[];
  grants: Grant[];
  onEditResearcher: (researcher: Researcher) => void;
  onDeleteResearcher: (researcherId: string) => void;
  onOpenNoteModal: (researcher: Researcher, note?: Note) => void;
  onViewGrantDetails: (grant: Grant) => void;
  getLabName: (labId?: string) => string;
}

const ResearchersTable: React.FC<ResearchersTableProps> = ({
  researchers,
  grants,
  onEditResearcher,
  onDeleteResearcher,
  onOpenNoteModal,
  onViewGrantDetails,
  getLabName,
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'name', direction: 'ascending' });

  const sortedResearchers = useMemo(() => {
    let sortableItems = [...researchers];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortConfig.key === 'labName') {
          valA = getLabName(a.labId);
          valB = getLabName(b.labId);
        } else if (sortConfig.key === 'notesCount') {
          valA = a.notes?.length || 0;
          valB = b.notes?.length || 0;
        } else if (sortConfig.key === 'activeGrantsCount') {
          valA = grants.filter(g => g.status === GrantStatus.ACTIVE && (g.principalInvestigatorId === a.id || g.coPiIds?.includes(a.id))).length;
          valB = grants.filter(g => g.status === GrantStatus.ACTIVE && (g.principalInvestigatorId === b.id || g.coPiIds?.includes(b.id))).length;
        } else {
          valA = a[sortConfig.key as keyof Omit<Researcher, 'notes' | 'labId'>] || '';
          valB = b[sortConfig.key as keyof Omit<Researcher, 'notes' | 'labId'>] || '';
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
  }, [researchers, grants, sortConfig, getLabName]);

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
  const tdListCellClasses = "px-4 py-3 text-sm text-gray-700 align-top"; // No whitespace-nowrap for lists

  return (
    <div className="overflow-x-auto shadow-md rounded-lg bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className={thClasses} onClick={() => requestSort('name')}>
              Name {getSortIcon('name')}
            </th>
            <th scope="col" className={thClasses} onClick={() => requestSort('title')}>
              Title {getSortIcon('title')}
            </th>
            <th scope="col" className={thClasses} onClick={() => requestSort('department')}>
              Department {getSortIcon('department')}
            </th>
            <th scope="col" className={thClasses} onClick={() => requestSort('labName')}>
              Lab {getSortIcon('labName')}
            </th>
             <th scope="col" className={`${thClasses} text-center`} onClick={() => requestSort('notesCount')}>
              Notes {getSortIcon('notesCount')}
            </th>
            <th scope="col" className={thClasses} onClick={() => requestSort('activeGrantsCount')}>
              Active Grants {getSortIcon('activeGrantsCount')}
            </th>
            <th scope="col" className={`${thClasses} text-center`}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedResearchers.map((researcher) => {
            const activeGrants = grants.filter(g => g.status === GrantStatus.ACTIVE && (g.principalInvestigatorId === researcher.id || g.coPiIds?.includes(researcher.id)));
            return (
              <tr key={researcher.id} className="hover:bg-gray-50 transition-colors" id={`researcher-row-${researcher.id}`}>
                <td className={tdClasses}>{researcher.name}</td>
                <td className={tdClasses}>{researcher.title || 'N/A'}</td>
                <td className={tdClasses}>{researcher.department}</td>
                <td className={tdClasses}>{getLabName(researcher.labId)}</td>
                <td className={`${tdClasses} text-center`}>{researcher.notes?.length || 0}</td>
                <td className={tdListCellClasses}>
                  {activeGrants.length > 0 ? (
                    <div className="max-h-20 overflow-y-auto space-y-0.5 pr-1">
                      {activeGrants.map(grant => (
                        <button
                          key={grant.id}
                          onClick={() => onViewGrantDetails(grant)}
                          className="text-blue-600 hover:text-blue-700 hover:underline text-xs block w-full text-left truncate focus:outline-none focus:ring-1 focus:ring-blue-300 rounded-sm p-0.5"
                          title={grant.title}
                        >
                           <CurrencyDollarIcon className="w-3 h-3 inline-block mr-1 text-green-500" />
                          {grant.title}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">None</span>
                  )}
                </td>
                <td className={`${tdClasses} text-center space-x-1 align-top`}>
                  <button
                    onClick={() => onEditResearcher(researcher)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-100"
                    title="Edit Researcher"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenNoteModal(researcher)}
                    className="p-1.5 text-gray-500 hover:text-green-600 transition-colors rounded-full hover:bg-green-100"
                    title="Add/View Notes"
                  >
                    <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteResearcher(researcher.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-100"
                    title="Delete Researcher"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ResearchersTable;
