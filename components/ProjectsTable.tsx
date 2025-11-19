
import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

type SortableKeys = 'name' | 'leadResearcherName' | 'description' | 'startDate' | 'endDate' | 'labsCount' | 'resourcesCount';

interface SortConfig {
  key: SortableKeys;
  direction: 'ascending' | 'descending';
}

interface ProjectsTableProps {
  projects: Project[];
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  getResearcherName: (researcherId?: string) => string;
}

const ProjectsTable: React.FC<ProjectsTableProps> = ({
  projects,
  onEditProject,
  onDeleteProject,
  getResearcherName,
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'name', direction: 'ascending' });

  const sortedProjects = useMemo(() => {
    let sortableItems = [...projects];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA: string | number | Date = '';
        let valB: string | number | Date = '';

        switch (sortConfig.key) {
          case 'name':
            valA = a.name;
            valB = b.name;
            break;
          case 'leadResearcherName':
            valA = getResearcherName(a.leadResearcherId);
            valB = getResearcherName(b.leadResearcherId);
            break;
          case 'description':
            valA = a.description;
            valB = b.description;
            break;
          case 'startDate':
            valA = new Date(a.startDate);
            valB = new Date(b.startDate);
            break;
          case 'endDate':
            // Handle cases where endDate might be undefined
            valA = a.endDate ? new Date(a.endDate) : new Date(0); // Treat undefined as very old date for sorting
            valB = b.endDate ? new Date(b.endDate) : new Date(0);
            break;
          case 'labsCount':
            valA = a.labIds?.length || 0;
            valB = b.labIds?.length || 0;
            break;
          case 'resourcesCount':
            valA = a.computeResourceIds?.length || 0;
            valB = b.computeResourceIds?.length || 0;
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
  }, [projects, sortConfig, getResearcherName]);

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Ongoing';
    return new Date(dateString).toLocaleDateString();
  };

  const thClasses = "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors";
  const tdClasses = "px-4 py-3 whitespace-nowrap text-sm text-gray-700";
  const tdDescriptionClasses = "px-4 py-3 text-sm text-gray-700 max-w-xs truncate";


  return (
    <div className="overflow-x-auto shadow-md rounded-lg bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className={thClasses} onClick={() => requestSort('name')}>
              Project Name {getSortIcon('name')}
            </th>
            <th scope="col" className={thClasses} onClick={() => requestSort('leadResearcherName')}>
              Lead Researcher {getSortIcon('leadResearcherName')}
            </th>
            <th scope="col" className={thClasses} onClick={() => requestSort('description')}>
              Description {getSortIcon('description')}
            </th>
            <th scope="col" className={thClasses} onClick={() => requestSort('startDate')}>
              Start Date {getSortIcon('startDate')}
            </th>
            <th scope="col" className={thClasses} onClick={() => requestSort('endDate')}>
              End Date {getSortIcon('endDate')}
            </th>
            <th scope="col" className={`${thClasses} text-center`} onClick={() => requestSort('labsCount')}>
              Labs {getSortIcon('labsCount')}
            </th>
            <th scope="col" className={`${thClasses} text-center`} onClick={() => requestSort('resourcesCount')}>
              Resources {getSortIcon('resourcesCount')}
            </th>
            <th scope="col" className={`${thClasses} text-center`}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedProjects.map((project) => (
            <tr key={project.id} className="hover:bg-gray-50 transition-colors" id={`project-row-${project.id}`}>
              <td className={tdClasses}>{project.name}</td>
              <td className={tdClasses}>{getResearcherName(project.leadResearcherId)}</td>
              <td className={tdDescriptionClasses} title={project.description}>{project.description}</td>
              <td className={tdClasses}>{formatDate(project.startDate)}</td>
              <td className={tdClasses}>{formatDate(project.endDate)}</td>
              <td className={`${tdClasses} text-center`}>{project.labIds?.length || 0}</td>
              <td className={`${tdClasses} text-center`}>{project.computeResourceIds?.length || 0}</td>
              <td className={`${tdClasses} text-center space-x-1`}>
                <button
                  onClick={() => onEditProject(project)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-100"
                  title="Edit Project"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteProject(project.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-100"
                  title="Delete Project"
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

export default ProjectsTable;
