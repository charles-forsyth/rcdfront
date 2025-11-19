
import React, { useState, useCallback, useMemo } from 'react';
import { Project, Researcher, Lab, ComputeResource, Grant } from '../../types'; // Added Grant
import Modal from '../Modal';
import ProjectForm from '../forms/ProjectForm';
import EntityCard from '../EntityCard';
import PageShell from '../PageShell';
import { Link } from 'react-router-dom';
import { Squares2X2Icon, TableCellsIcon, CurrencyDollarIcon, LinkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'; // Added CurrencyDollarIcon, LinkIcon
import ProjectsTable from '../ProjectsTable'; 

type ViewMode = 'card' | 'table';

interface ProjectsPageProps {
  projects: Project[];
  researchers: Researcher[];
  labs: Lab[];
  computeResources: ComputeResource[];
  grants: Grant[]; // Added grants
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  researchers,
  labs,
  computeResources,
  grants, // Destructure grants
  onAddProject,
  onUpdateProject,
  onDeleteProject
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [currentView, setCurrentView] = useState<ViewMode>('card');
  const [cardSearchTerm, setCardSearchTerm] = useState('');

  const handleOpenModal = (project?: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingProject(undefined);
    setIsModalOpen(false);
  };

  const handleSubmitProject = (project: Project) => {
    if (editingProject) {
      onUpdateProject(project);
    } else {
      onAddProject(project);
    }
    handleCloseModal();
  };

  const getResearcherName = useCallback((researcherId?: string): string => {
    if (!researcherId) return 'N/A';
    const researcher = researchers.find(r => r.id === researcherId);
    return researcher ? researcher.name : 'Unknown Researcher';
  }, [researchers]);

  const getAssociatedGrants = useCallback((projectGrantIds?: string[]): Grant[] => {
    if (!projectGrantIds) return [];
    return grants.filter(g => projectGrantIds.includes(g.id));
  }, [grants]);

  const filteredProjects = useMemo(() => {
    if (!cardSearchTerm.trim()) {
      return projects;
    }
    const lowerSearchTerm = cardSearchTerm.toLowerCase();
    return projects.filter(project => {
      const leadResearcherName = getResearcherName(project.leadResearcherId).toLowerCase();
      return (
        project.name.toLowerCase().includes(lowerSearchTerm) ||
        project.description.toLowerCase().includes(lowerSearchTerm) ||
        leadResearcherName.includes(lowerSearchTerm)
      );
    });
  }, [projects, cardSearchTerm, getResearcherName]);

  return (
    <PageShell title="Research Projects" onAddItem={() => handleOpenModal()} addItemLabel="Add Project">
       <div className="mb-4 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:gap-4">
        <div className="flex space-x-2">
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
        <div className="relative w-full sm:w-auto">
            <input
                type="text"
                placeholder="Filter project cards..."
                value={cardSearchTerm}
                onChange={(e) => setCardSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-72"
                aria-label="Filter project cards by search term"
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {projects.length === 0 && <p className="text-center text-gray-500 py-5">No projects found. Add one to get started.</p>}
      
      {currentView === 'card' && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => {
            const leadResearcher = researchers.find(r => r.id === project.leadResearcherId);
            const projectLabs = labs.filter(l => project.labIds?.includes(l.id));
            const projectResources = computeResources.filter(cr => project.computeResourceIds?.includes(cr.id));
            const associatedGrants = getAssociatedGrants(project.grantIds);
            
            const details = [
                  { label: 'Lead Researcher', value: leadResearcher ? <Link to={`/researchers#${leadResearcher.id}`} className="text-blue-600 hover:underline">{leadResearcher.name}</Link> : 'N/A' },
                  { label: 'Description', value: project.description },
                  { label: 'Start Date', value: new Date(project.startDate).toLocaleDateString() },
                  { label: 'End Date', value: project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing' },
                ];
            return (
              <EntityCard
                key={project.id}
                title={project.name}
                details={details}
                onEdit={() => handleOpenModal(project)}
                onDelete={() => {
                  if(window.confirm(`Are you sure you want to delete ${project.name}? This action cannot be undone.`)) {
                  onDeleteProject(project.id);
                  }
                }}
              >
                <div className="mt-4 space-y-3">
                  <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-1">Associated Labs ({projectLabs.length})</h4>
                    {projectLabs.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5 max-h-20 overflow-y-auto">
                        {projectLabs.map(l => <li key={l.id}><Link to={`/labs#${l.id}`} className="hover:text-blue-600">{l.name}</Link></li>)}
                      </ul>
                    ) : <p className="text-xs text-gray-500">No labs assigned.</p>}
                  </div>
                  <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-1">Compute Resources ({projectResources.length})</h4>
                    {projectResources.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5 max-h-20 overflow-y-auto">
                        {projectResources.map(cr => <li key={cr.id}><Link to={`/compute#${cr.id}`} className="hover:text-blue-600">{cr.name} ({cr.type})</Link></li>)}
                      </ul>
                    ) : <p className="text-xs text-gray-500">No compute resources assigned.</p>}
                  </div>
                  {associatedGrants.length > 0 && (
                     <div className="pt-3 border-t border-gray-200">
                        <h4 className="text-md font-semibold text-gray-700 mb-1 flex items-center">
                            <CurrencyDollarIcon className="w-5 h-5 mr-1 text-green-600" />
                            Associated Grants ({associatedGrants.length})
                        </h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5 max-h-20 overflow-y-auto pr-1">
                        {associatedGrants.map(grant => (
                          <li key={grant.id}>
                            <Link to={`/grants#${grant.id}`} className="hover:text-green-700 inline-flex items-center">
                              {grant.title} <LinkIcon className="w-3 h-3 ml-1" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                     </div>
                  )}
                </div>
              </EntityCard>
            );
          })}
          {filteredProjects.length === 0 && cardSearchTerm.trim() !== '' && (
            <p className="text-center text-gray-500 col-span-full py-5">
              No projects match your search term "{cardSearchTerm}".
            </p>
          )}
        </div>
      )}

      {currentView === 'table' && (
        projects.length > 0 ? (
          <ProjectsTable
            projects={projects}
            onEditProject={handleOpenModal}
            onDeleteProject={(projectId) => {
              const project = projects.find(p => p.id === projectId);
              if(project && window.confirm(`Are you sure you want to delete ${project.name}? This action cannot be undone.`)) {
                  onDeleteProject(projectId);
              }
            }}
            getResearcherName={getResearcherName}
          />
        ) : cardSearchTerm.trim() === '' && (<p className="text-center text-gray-500 py-5">No projects to display in table view.</p>)
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProject ? 'Edit Project' : 'Add New Project'}>
        <ProjectForm
          key={editingProject ? editingProject.id : 'new-project'}
          onSubmit={handleSubmitProject}
          onCancel={handleCloseModal}
          researchers={researchers}
          labs={labs}
          computeResources={computeResources}
          grants={grants} 
          initialData={editingProject}
        />
      </Modal>
    </PageShell>
  );
};

export default ProjectsPage;
