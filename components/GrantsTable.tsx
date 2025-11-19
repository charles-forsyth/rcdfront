
import React, { useState, useMemo } from 'react';
import { Grant, GrantStatus } from '../types';
import { PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

type SortableKeys = 'title' | 'agency' | 'awardNumber' | 'piName' | 'amount' | 'startDate' | 'endDate' | 'status' | 'projectsCount';

interface SortConfig {
  key: SortableKeys;
  direction: 'ascending' | 'descending';
}

interface GrantsTableProps {
  grants: Grant[];
  onEditGrant: (grant: Grant) => void;
  onDeleteGrant: (grantId: string) => void;
  getResearcherName: (researcherId?: string) => string;
  getProjectName: (projectId?: string) => string; // Assuming for simplicity if we list one or count
  getStatusColor: (status: GrantStatus) => string;
}

const GrantsTable: React.FC<GrantsTableProps> = ({
  grants,
  onEditGrant,
  onDeleteGrant,
  getResearcherName,
  // getProjectName, // Not directly used for project count display here
  getStatusColor,
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'title', direction: 'ascending' });

  const sortedGrants = useMemo(() => {
    let sortableItems = [...grants];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA: string | number | Date = '';
        let valB: string | number | Date = '';

        switch (sortConfig.key) {
          case 'title':
          case 'agency':
          case 'awardNumber':
          case 'status':
            valA = (a[sortConfig.key] || '').toString();
            valB = (b[sortConfig.key] || '').toString();
            break;
          case 'piName':
            valA = getResearcherName(a.principalInvestigatorId);
            valB = getResearcherName(b.principalInvestigatorId);
            break;
          case 'amount':
            valA = a.amount;
            valB = b.amount;
            break;
          case 'startDate':
          case 'endDate':
            valA = new Date(a[sortConfig.key]);
            valB = new Date(b[sortConfig.key]);
            break;
          case 'projectsCount':
            valA = a.projectIds?.length || 0;
            valB = b.projectIds?.length || 0;
            break;
          default: // Should not happen
            valA = ''; valB = '';
        }
        
        if (typeof valA === 'string' && typeof valB === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [grants, sortConfig, getResearcherName]);

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
    return sortConfig.direction === 'ascending' ? 
      <ChevronUpIcon className="w-4 h-4 inline-block ml-1" /> : 
      <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const thClasses = "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors";
  const tdClasses = "px-4 py-3 whitespace-nowrap text-sm text-gray-700";

  return (
    <div className="overflow-x-auto shadow-md rounded-lg bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className={thClasses} onClick={() => requestSort('title')}>Title {getSortIcon('title')}</th>
            <th scope="col" className={thClasses} onClick={() => requestSort('agency')}>Agency {getSortIcon('agency')}</th>
            <th scope="col" className={thClasses} onClick={() => requestSort('awardNumber')}>Award # {getSortIcon('awardNumber')}</th>
            <th scope="col" className={thClasses} onClick={() => requestSort('piName')}>PI {getSortIcon('piName')}</th>
            <th scope="col" className={`${thClasses} text-right`} onClick={() => requestSort('amount')}>Amount {getSortIcon('amount')}</th>
            <th scope="col" className={thClasses} onClick={() => requestSort('startDate')}>Start {getSortIcon('startDate')}</th>
            <th scope="col" className={thClasses} onClick={() => requestSort('endDate')}>End {getSortIcon('endDate')}</th>
            <th scope="col" className={thClasses} onClick={() => requestSort('status')}>Status {getSortIcon('status')}</th>
            <th scope="col" className={`${thClasses} text-center`} onClick={() => requestSort('projectsCount')}>Projects {getSortIcon('projectsCount')}</th>
            <th scope="col" className={`${thClasses} text-center`}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedGrants.map((grant) => (
            <tr key={grant.id} className="hover:bg-gray-50 transition-colors" id={`grant-row-${grant.id}`}>
              <td className={`${tdClasses} max-w-xs truncate`} title={grant.title}>
                <Link to={`/grants#${grant.id}`} className="text-blue-600 hover:underline">{grant.title}</Link>
              </td>
              <td className={tdClasses}>{grant.agency}</td>
              <td className={tdClasses}>{grant.awardNumber || 'N/A'}</td>
              <td className={tdClasses}>
                <Link to={`/researchers#${grant.principalInvestigatorId}`} className="text-blue-600 hover:underline">
                  {getResearcherName(grant.principalInvestigatorId)}
                </Link>
              </td>
              <td className={`${tdClasses} text-right`}>${grant.amount.toLocaleString()}</td>
              <td className={tdClasses}>{formatDate(grant.startDate)}</td>
              <td className={tdClasses}>{formatDate(grant.endDate)}</td>
              <td className={tdClasses}>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(grant.status)}`}>
                  {grant.status}
                </span>
              </td>
              <td className={`${tdClasses} text-center`}>{grant.projectIds?.length || 0}</td>
              <td className={`${tdClasses} text-center space-x-1`}>
                <button
                  onClick={() => onEditGrant(grant)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-100"
                  title="Edit Grant"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteGrant(grant.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-100"
                  title="Delete Grant"
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

export default GrantsTable;
