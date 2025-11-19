
import React, { useState, useMemo } from 'react';
import { ComputeResource, ComputeResourceType } from '../types';
import { PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

type SortableKeys = 'name' | 'type' | 'status' | 'clusterName' | 'totalCores' | 'totalRam' | 'gpus' | 'projectsCount';

interface SortConfig {
  key: SortableKeys;
  direction: 'ascending' | 'descending';
}

interface ComputeResourcesTableProps {
  computeResources: ComputeResource[];
  onEditResource: (resource: ComputeResource) => void;
  onDeleteResource: (resourceId: string) => void;
  getStatusColor: (status: ComputeResource['status']) => string;
}

const ComputeResourcesTable: React.FC<ComputeResourcesTableProps> = ({
  computeResources,
  onEditResource,
  onDeleteResource,
  getStatusColor,
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'name', direction: 'ascending' });

  const sortedResources = useMemo(() => {
    let sortableItems = [...computeResources];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA: string | number | undefined = '';
        let valB: string | number | undefined = '';

        switch (sortConfig.key) {
          case 'name':
          case 'type':
          case 'status':
          case 'clusterName':
          case 'totalRam': // Keep as string for now, could parse if strictly 'XGB/TB'
            valA = a[sortConfig.key] || '';
            valB = b[sortConfig.key] || '';
            break;
          case 'totalCores':
          case 'gpus': // Changed from 'totalGpus'
            valA = a[sortConfig.key] ?? -1; // Use ?? for undefined to sort them consistently
            valB = b[sortConfig.key] ?? -1;
            break;
          case 'projectsCount':
            valA = a.projectIds?.length || 0;
            valB = b.projectIds?.length || 0;
            break;
          default:
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
  }, [computeResources, sortConfig]);

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

  return (
    <div className="overflow-x-auto shadow-md rounded-lg bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className={thClasses} onClick={() => requestSort('name')}>
              Name {getSortIcon('name')}
            </th>
            <th scope="col" className={thClasses} onClick={() => requestSort('type')}>
              Type {getSortIcon('type')}
            </th>
            <th scope="col" className={thClasses} onClick={() => requestSort('status')}>
              Status {getSortIcon('status')}
            </th>
            <th scope="col" className={thClasses} onClick={() => requestSort('clusterName')}>
              Cluster Name {getSortIcon('clusterName')}
            </th>
            <th scope="col" className={thClasses} onClick={() => requestSort('totalCores')}>
              Cores {getSortIcon('totalCores')}
            </th>
             <th scope="col" className={thClasses} onClick={() => requestSort('totalRam')}>
              RAM {getSortIcon('totalRam')}
            </th>
             <th scope="col" className={thClasses} onClick={() => requestSort('gpus')}> {/* Changed from totalGpus */}
              GPUs {getSortIcon('gpus')} {/* Changed from totalGpus */}
            </th>
            <th scope="col" className={`${thClasses} text-center`} onClick={() => requestSort('projectsCount')}>
              Projects {getSortIcon('projectsCount')}
            </th>
            <th scope="col" className={`${thClasses} text-center`}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedResources.map((resource) => (
            <tr key={resource.id} className="hover:bg-gray-50 transition-colors" id={`resource-row-${resource.id}`}>
              <td className={tdClasses}>{resource.name}</td>
              <td className={tdClasses}>{resource.type}</td>
              <td className={tdClasses}>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(resource.status)}`}>
                  {resource.status}
                </span>
              </td>
              <td className={tdClasses}>{resource.clusterName || (resource.type === ComputeResourceType.CLUSTER ? 'N/A' : '')}</td>
              <td className={tdClasses}>{resource.totalCores ?? 'N/A'}</td>
              <td className={tdClasses}>{resource.totalRam || 'N/A'}</td>
              <td className={tdClasses}>{resource.gpus ?? 'N/A'}</td> {/* Changed from totalGpus */}
              <td className={`${tdClasses} text-center`}>{resource.projectIds?.length || 0}</td>
              <td className={`${tdClasses} text-center space-x-1`}>
                <button
                  onClick={() => onEditResource(resource)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-100"
                  title="Edit Resource"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteResource(resource.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-100"
                  title="Delete Resource"
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

export default ComputeResourcesTable;
