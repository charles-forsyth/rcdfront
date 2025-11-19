
import React, { useState } from 'react';
import { ComputeResource, Project, ComputeResourceType } from '../../types';
import Modal from '../Modal';
import ComputeResourceForm from '../forms/ComputeResourceForm';
import EntityCard from '../EntityCard';
import PageShell from '../PageShell';
import { Link } from 'react-router-dom';
import UtilizationBar from '../UtilizationBar';
import { Squares2X2Icon, TableCellsIcon } from '@heroicons/react/24/outline';
import ComputeResourcesTable from '../ComputeResourcesTable'; // New import

type ViewMode = 'card' | 'table';

interface ComputeResourcesPageProps {
  computeResources: ComputeResource[];
  projects: Project[];
  onAddResource: (resource: ComputeResource) => void;
  onUpdateResource: (resource: ComputeResource) => void;
  onDeleteResource: (resourceId: string) => void;
}

const ComputeResourcesPage: React.FC<ComputeResourcesPageProps> = ({
  computeResources,
  projects,
  onAddResource,
  onUpdateResource,
  onDeleteResource
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ComputeResource | undefined>(undefined);
  const [currentView, setCurrentView] = useState<ViewMode>('card');

  const handleOpenModal = (resource?: ComputeResource) => {
    setEditingResource(resource);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingResource(undefined);
    setIsModalOpen(false);
  };

  const handleSubmitResource = (resource: ComputeResource) => {
    if (editingResource) {
      onUpdateResource(resource);
    } else {
      onAddResource(resource);
    }
    handleCloseModal();
  };

  const getStatusColor = (status: ComputeResource['status']) => {
    switch (status) {
      case 'Available': return 'text-green-600 bg-green-100';
      case 'In Use': return 'text-yellow-600 bg-yellow-100';
      case 'Maintenance': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateOverallResourceUtilization = (resource: ComputeResource): number => {
    switch (resource.status) {
      case 'Available':
        return 5;
      case 'Maintenance':
        return 0;
      case 'In Use':
        return Math.min(95, 60 + (resource.projectIds?.length || 0) * 10);
      default:
        return 0;
    }
  };

  const calculateProjectSpecificUtilization = (resource: ComputeResource): number => {
    if (resource.projectIds && resource.projectIds.length > 0) { 
        switch (resource.status) {
            case 'Available':
                return 15; 
            case 'Maintenance':
                return 0;
            case 'In Use':
                return 75; 
            default:
                return 0;
        }
    }
    return 0;
  };


  return (
    <PageShell title="Compute Resources" onAddItem={() => handleOpenModal()} addItemLabel="Add Resource">
      <div className="mb-4 flex space-x-2">
        <button
          onClick={() => setCurrentView('card')}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center
            ${currentView === 'card' ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          aria-pressed={currentView === 'card'}
        >
          <Squares2X2Icon className="w-5 h-5 mr-2" />
          Card View
        </button>
        <button
          onClick={() => setCurrentView('table')}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center
            ${currentView === 'table' ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          aria-pressed={currentView === 'table'}
        >
          <TableCellsIcon className="w-5 h-5 mr-2" />
          Table View
        </button>
      </div>

      {computeResources.length === 0 && <p className="text-center text-gray-500">No compute resources found. Add one to get started.</p>}
      
      {currentView === 'card' && computeResources.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {computeResources.map(resource => {
            const resourceProjects = projects.filter(p => resource.projectIds?.includes(p.id));
            
            let details = [
              { label: 'Type', value: resource.type },
              { label: 'Status', value: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(resource.status)}`}>{resource.status}</span> },
              { label: 'Cluster Name', value: resource.clusterName },
              { label: 'General Spec', value: resource.specification },
            ];

            if (resource.type === ComputeResourceType.CLUSTER) {
              details.push(
                { label: 'Cluster Type', value: resource.clusterType },
                { label: 'Nodes', value: resource.nodes?.toString() },
                { label: 'CPUs/Node', value: resource.cpusPerNode?.toString() },
                { label: 'Total CPUs', value: resource.cpus?.toString() },
                { label: 'Total Cores', value: resource.totalCores?.toString() },
                { label: 'Node Memory', value: resource.nodeMemory },
                { label: 'Total RAM', value: resource.totalRam },
                { label: 'GPUs/Node', value: resource.gpusPerNode?.toString() },
                { label: 'Total GPUs', value: resource.gpus?.toString() }
              );
            } else { 
              details.push(
                  { label: 'Total Cores', value: resource.totalCores?.toString() },
                  { label: 'Total RAM', value: resource.totalRam },
                  { label: 'Total GPUs', value: resource.gpus?.toString() }
              );
            }
            
            const overallUtilization = calculateOverallResourceUtilization(resource);

            return (
              <EntityCard
                key={resource.id}
                title={resource.name}
                details={details.filter(d => d.value !== undefined && d.value !== null && d.value !== '')}
                onEdit={() => handleOpenModal(resource)}
                onDelete={() => {
                  if(window.confirm(`Are you sure you want to delete ${resource.name}? This action cannot be undone.`)) {
                  onDeleteResource(resource.id);
                  }
                }}
              >
                <div className="mt-4 space-y-3">
                  <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-1">Assigned Projects ({resourceProjects.length})</h4>
                    {resourceProjects.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5 max-h-20 overflow-y-auto pr-1">
                        {resourceProjects.map(p => <li key={p.id}><Link to={`/projects#${p.id}`} className="hover:text-blue-600">{p.name}</Link></li>)}
                      </ul>
                    ) : <p className="text-xs text-gray-500">Not assigned to any projects.</p>}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Utilization Details</h4>
                      <UtilizationBar
                          label="Overall Resource Usage"
                          percentage={overallUtilization}
                          bgColor="bg-sky-400"
                          height="h-4"
                          ariaLabel={`Overall usage of ${resource.name}`}
                      />
                      {resourceProjects.length > 0 && (
                          <div className="mt-2">
                              <h5 className="text-sm font-medium text-gray-600 mb-1">Project-Specific Usage:</h5>
                              {resourceProjects.map(p => {
                                  const projectSpecificUtil = calculateProjectSpecificUtilization(resource); 
                                  return (
                                      <UtilizationBar
                                          key={p.id}
                                          label={`${p.name}`}
                                          percentage={projectSpecificUtil}
                                          bgColor="bg-teal-500"
                                          height="h-3" 
                                          ariaLabel={`Project ${p.name} usage of ${resource.name}`}
                                      />
                                  );
                                })}
                          </div>
                      )}
                  </div>
                </div>
              </EntityCard>
            );
          })}
        </div>
      )}

      {currentView === 'table' && computeResources.length > 0 && (
         <ComputeResourcesTable
            computeResources={computeResources}
            onEditResource={handleOpenModal}
            onDeleteResource={(resourceId) => {
                const resource = computeResources.find(r => r.id === resourceId);
                if(resource && window.confirm(`Are you sure you want to delete ${resource.name}? This action cannot be undone.`)) {
                    onDeleteResource(resourceId);
                }
            }}
            getStatusColor={getStatusColor}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingResource ? 'Edit Compute Resource' : 'Add New Compute Resource'}>
        <ComputeResourceForm
          key={editingResource ? editingResource.id : 'new-resource'}
          onSubmit={handleSubmitResource}
          onCancel={handleCloseModal}
          projects={projects}
          initialData={editingResource}
        />
      </Modal>
    </PageShell>
  );
};

export default ComputeResourcesPage;
