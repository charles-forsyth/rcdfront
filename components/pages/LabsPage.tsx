
import React, { useState, useCallback, useMemo } from 'react';
import { Lab, Researcher, Project } from '../../types';
import Modal from '../Modal';
import LabForm from '../forms/LabForm';
import EntityCard from '../EntityCard';
import PageShell from '../PageShell';
import { Link } from 'react-router-dom';
import { Squares2X2Icon, TableCellsIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import LabsTable from '../LabsTable'; // New import

type ViewMode = 'card' | 'table';

interface LabsPageProps {
  labs: Lab[];
  researchers: Researcher[];
  projects: Project[];
  onAddLab: (lab: Lab) => void;
  onUpdateLab: (lab: Lab) => void;
  onDeleteLab: (labId: string) => void;
}

const LabsPage: React.FC<LabsPageProps> = ({ labs, researchers, projects, onAddLab, onUpdateLab, onDeleteLab }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | undefined>(undefined);
  const [currentView, setCurrentView] = useState<ViewMode>('card');
  const [cardSearchTerm, setCardSearchTerm] = useState('');

  const handleOpenModal = (lab?: Lab) => {
    setEditingLab(lab);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingLab(undefined);
    setIsModalOpen(false);
  };

  const handleSubmitLab = (lab: Lab) => {
    if (editingLab) {
      onUpdateLab(lab);
    } else {
      onAddLab(lab);
    }
    handleCloseModal();
  };

  const getResearcherName = useCallback((researcherId?: string): string => {
    if (!researcherId) return 'N/A';
    const researcher = researchers.find(r => r.id === researcherId);
    return researcher ? researcher.name : 'Unknown PI';
  }, [researchers]);

  const getResearchersInLabCount = useCallback((labId: string): number => {
    return researchers.filter(r => r.labId === labId).length;
  }, [researchers]);

  const getProjectsInLabCount = useCallback((labId: string): number => {
    return projects.filter(p => p.labIds?.includes(labId)).length;
  }, [projects]);

  const filteredLabs = useMemo(() => {
    if (!cardSearchTerm.trim()) {
      return labs;
    }
    const lowerSearchTerm = cardSearchTerm.toLowerCase();
    return labs.filter(lab => {
      const piName = getResearcherName(lab.principalInvestigatorId).toLowerCase();
      return (
        lab.name.toLowerCase().includes(lowerSearchTerm) ||
        lab.description.toLowerCase().includes(lowerSearchTerm) ||
        piName.includes(lowerSearchTerm)
      );
    });
  }, [labs, cardSearchTerm, getResearcherName]);

  return (
    <PageShell title="Research Labs" onAddItem={() => handleOpenModal()} addItemLabel="Add Lab">
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
                placeholder="Filter lab cards..."
                value={cardSearchTerm}
                onChange={(e) => setCardSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-72"
                aria-label="Filter lab cards by search term"
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {labs.length === 0 && <p className="text-center text-gray-500 py-5">No labs found. Add one to get started.</p>}
      
      {currentView === 'card' && labs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLabs.map(lab => {
            const pi = researchers.find(r => r.id === lab.principalInvestigatorId);
            const labResearchers = researchers.filter(r => r.labId === lab.id);
            const labProjects = projects.filter(p => lab.projectIds?.includes(p.id));
            return (
              <EntityCard
                key={lab.id}
                title={lab.name}
                details={[
                  { label: 'Principal Investigator', value: pi ? pi.name : 'N/A' },
                  { label: 'Description', value: lab.description },
                ]}
                onEdit={() => handleOpenModal(lab)}
                onDelete={() => {
                  if(window.confirm(`Are you sure you want to delete ${lab.name}? This action cannot be undone.`)) {
                    onDeleteLab(lab.id);
                  }
                }}
              >
                <div className="mt-4 space-y-3">
                  <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-1">Researchers ({labResearchers.length})</h4>
                    {labResearchers.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5 max-h-20 overflow-y-auto">
                        {labResearchers.map(r => <li key={r.id}><Link to={`/researchers#${r.id}`} className="hover:text-blue-600">{r.name}</Link></li>)}
                      </ul>
                    ) : <p className="text-xs text-gray-500">No researchers assigned.</p>}
                  </div>
                  <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-1">Projects ({labProjects.length})</h4>
                    {labProjects.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5 max-h-20 overflow-y-auto">
                        {labProjects.map(p => <li key={p.id}><Link to={`/projects#${p.id}`} className="hover:text-blue-600">{p.name}</Link></li>)}
                      </ul>
                    ) : <p className="text-xs text-gray-500">No projects assigned.</p>}
                  </div>
                </div>
              </EntityCard>
            );
          })}
          {filteredLabs.length === 0 && cardSearchTerm.trim() !== '' && (
            <p className="text-center text-gray-500 col-span-full py-5">
              No labs match your search term "{cardSearchTerm}".
            </p>
          )}
        </div>
      )}

      {currentView === 'table' && (
        labs.length > 0 ? (
          <LabsTable
            labs={labs}
            onEditLab={handleOpenModal}
            onDeleteLab={(labId) => {
              const lab = labs.find(l => l.id === labId);
              if(lab && window.confirm(`Are you sure you want to delete ${lab.name}? This action cannot be undone.`)) {
                  onDeleteLab(labId);
              }
            }}
            getResearcherName={getResearcherName}
            getResearchersInLabCount={getResearchersInLabCount}
            getProjectsInLabCount={getProjectsInLabCount}
          />
        ) : cardSearchTerm.trim() === '' && (<p className="text-center text-gray-500 py-5">No labs to display in table view.</p>)
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingLab ? 'Edit Lab' : 'Add New Lab'}>
        <LabForm
          key={editingLab ? editingLab.id : 'new-lab'}
          onSubmit={handleSubmitLab}
          onCancel={handleCloseModal}
          researchers={researchers}
          projects={projects}
          initialData={editingLab}
        />
      </Modal>
    </PageShell>
  );
};

export default LabsPage;
