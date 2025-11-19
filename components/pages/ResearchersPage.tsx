
import React, { useState, useCallback, useMemo } from 'react';
import { Researcher, Lab, Note, NoteAnalysis, Grant, GrantStatus, Project } from '../../types'; // Added Grant, GrantStatus, Project
import Modal from '../Modal';
import ResearcherForm from '../forms/ResearcherForm';
import EntityCard from '../EntityCard';
import PageShell from '../PageShell';
import { summarizeText, analyzeNotes } from '../../services/geminiService';
import LoadingSpinner from '../LoadingSpinner';
import { DEFAULT_NOTE_ANALYSIS } from '../../constants';
import { ChatBubbleLeftEllipsisIcon, LightBulbIcon, DocumentTextIcon, LinkIcon, Squares2X2Icon, TableCellsIcon, CurrencyDollarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ResearchersTable from '../ResearchersTable'; 
import GrantDetailModal from '../GrantDetailModal'; // Import GrantDetailModal
import { Link } from 'react-router-dom';


type ViewMode = 'card' | 'table';

interface ResearchersPageProps {
  researchers: Researcher[];
  labs: Lab[];
  grants: Grant[];
  projects: Project[]; // Added projects for GrantDetailModal
  onAddResearcher: (researcher: Researcher) => void;
  onUpdateResearcher: (researcher: Researcher) => void;
  onDeleteResearcher: (researcherId: string) => void;
  onAddNote: (researcherId: string, noteContent: string) => void;
  onUpdateNote: (researcherId: string, note: Note) => void;
  onDeleteNote: (researcherId: string, noteId: string) => void;
}

const ResearchersPage: React.FC<ResearchersPageProps> = ({
  researchers,
  labs,
  grants,
  projects, // Destructure projects
  onAddResearcher,
  onUpdateResearcher,
  onDeleteResearcher,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResearcher, setEditingResearcher] = useState<Researcher | undefined>(undefined);
  
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [currentResearcherForNote, setCurrentResearcherForNote] = useState<Researcher | undefined>(undefined);
  const [noteContent, setNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<Note | undefined>(undefined);

  const [loadingSummary, setLoadingSummary] = useState<Record<string, boolean>>({});
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  
  const [loadingAnalysis, setLoadingAnalysis] = useState<Record<string, boolean>>({});
  const [analyses, setAnalyses] = useState<Record<string, NoteAnalysis>>({});

  const [currentView, setCurrentView] = useState<ViewMode>('card');
  const [cardSearchTerm, setCardSearchTerm] = useState('');

  // State for GrantDetailModal
  const [isGrantDetailModalOpen, setIsGrantDetailModalOpen] = useState(false);
  const [selectedGrantForDetail, setSelectedGrantForDetail] = useState<Grant | null>(null);


  const handleOpenModal = (researcher?: Researcher) => {
    setEditingResearcher(researcher);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingResearcher(undefined);
    setIsModalOpen(false);
  };

  const handleSubmitResearcher = (researcherDataFromForm: Omit<Researcher, 'id' | 'notes'> & { id?: string; notes?: Note[] }) => {
    if (editingResearcher && researcherDataFromForm.id) { 
      const fullUpdatedResearcher: Researcher = {
        ...researcherDataFromForm,
        id: researcherDataFromForm.id,
        notes: researcherDataFromForm.notes || editingResearcher.notes || [], 
      };
      onUpdateResearcher(fullUpdatedResearcher);
    } else { 
      const newResearcher: Researcher = {
        ...researcherDataFromForm,
        id: Date.now().toString(),
        notes: [],
      };
      onAddResearcher(newResearcher);
    }
    handleCloseModal();
  };

  const handleOpenNoteModal = (researcher: Researcher, note?: Note) => {
    setCurrentResearcherForNote(researcher);
    setEditingNote(note);
    setNoteContent(note?.content || '');
    setIsNoteModalOpen(true);
  };

  const handleCloseNoteModal = () => {
    setCurrentResearcherForNote(undefined);
    setEditingNote(undefined);
    setNoteContent('');
    setIsNoteModalOpen(false);
  };

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentResearcherForNote && noteContent.trim()) {
      if (editingNote) {
        onUpdateNote(currentResearcherForNote.id, { ...editingNote, content: noteContent, updatedAt: new Date().toISOString() });
      } else {
        onAddNote(currentResearcherForNote.id, noteContent);
      }
      handleCloseNoteModal();
    }
  };
  
  const handleSummarizeNotes = useCallback(async (researcher: Researcher) => {
    if (!researcher.notes || researcher.notes.length === 0) {
      setSummaries(prev => ({ ...prev, [researcher.id]: "No notes to summarize." }));
      return;
    }
     if (!process.env.API_KEY) {
      setSummaries(prev => ({ ...prev, [researcher.id]: "API Key not configured for summarization." }));
      return;
    }
    setLoadingSummary(prev => ({ ...prev, [researcher.id]: true }));
    const notesText = researcher.notes.map(n => n.content).join("\n\n");
    const summary = await summarizeText(notesText);
    setSummaries(prev => ({ ...prev, [researcher.id]: summary }));
    setLoadingSummary(prev => ({ ...prev, [researcher.id]: false }));
  }, []);

  const handleAnalyzeNotes = useCallback(async (researcher: Researcher) => {
    if (!researcher.notes || researcher.notes.length === 0) {
      setAnalyses(prev => ({ ...prev, [researcher.id]: { ...DEFAULT_NOTE_ANALYSIS, keyThemes: ["No notes to analyze."] } }));
      return;
    }
    if (!process.env.API_KEY) {
      setAnalyses(prev => ({ ...prev, [researcher.id]: { ...DEFAULT_NOTE_ANALYSIS, keyThemes: ["API Key not configured for analysis."] } }));
      return;
    }
    setLoadingAnalysis(prev => ({ ...prev, [researcher.id]: true }));
    const notesText = researcher.notes.map(n => n.content).join("\n\n");
    const analysis = await analyzeNotes(notesText);
    setAnalyses(prev => ({ ...prev, [researcher.id]: analysis }));
    setLoadingAnalysis(prev => ({ ...prev, [researcher.id]: false }));
  }, []);

  const getLabName = useCallback((labId?: string): string => {
    if (!labId) return 'N/A';
    const lab = labs.find(l => l.id === labId);
    return lab ? lab.name : 'Unknown Lab';
  }, [labs]);

  const getResearcherName = useCallback((researcherId?: string): string => {
    if (!researcherId) return 'N/A';
    const researcher = researchers.find(r => r.id === researcherId);
    return researcher ? researcher.name : 'Unknown Researcher';
  }, [researchers]);

  const getProjectName = useCallback((projectId?: string): string => {
    if (!projectId) return 'N/A';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  }, [projects]);
  
  const getResearcherGrants = useCallback((researcherId: string): Grant[] => {
    return grants.filter(g => g.principalInvestigatorId === researcherId || g.coPiIds?.includes(researcherId));
  }, [grants]);

  // Handlers for GrantDetailModal
  const handleOpenGrantDetailModal = useCallback((grant: Grant) => {
    setSelectedGrantForDetail(grant);
    setIsGrantDetailModalOpen(true);
  }, []);

  const handleCloseGrantDetailModal = useCallback(() => {
    setSelectedGrantForDetail(null);
    setIsGrantDetailModalOpen(false);
  }, []);
  
  const getGrantStatusColor = useCallback((status: GrantStatus) => {
    // This function can be moved to a utility if used in more places
    switch (status) {
      case GrantStatus.ACTIVE: return 'text-green-700 bg-green-100';
      case GrantStatus.AWARDED: return 'text-blue-700 bg-blue-100';
      case GrantStatus.PENDING: return 'text-yellow-700 bg-yellow-100';
      case GrantStatus.SUBMITTED: return 'text-indigo-700 bg-indigo-100';
      case GrantStatus.CLOSED: return 'text-gray-700 bg-gray-100';
      case GrantStatus.NOT_FUNDED: return 'text-red-700 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  const filteredResearchers = useMemo(() => {
    if (!cardSearchTerm.trim()) {
      return researchers;
    }
    const lowerSearchTerm = cardSearchTerm.toLowerCase();
    return researchers.filter(researcher => {
      const lab = labs.find(l => l.id === researcher.labId);
      return (
        researcher.name.toLowerCase().includes(lowerSearchTerm) ||
        (researcher.title && researcher.title.toLowerCase().includes(lowerSearchTerm)) ||
        researcher.email.toLowerCase().includes(lowerSearchTerm) ||
        researcher.department.toLowerCase().includes(lowerSearchTerm) ||
        (researcher.research && researcher.research.toLowerCase().includes(lowerSearchTerm)) || // Changed from researchInterests
        (researcher.netId && researcher.netId.toLowerCase().includes(lowerSearchTerm)) ||
        (researcher.org && researcher.org.toLowerCase().includes(lowerSearchTerm)) ||
        (researcher.div && researcher.div.toLowerCase().includes(lowerSearchTerm)) ||
        (lab && lab.name.toLowerCase().includes(lowerSearchTerm))
      );
    });
  }, [researchers, cardSearchTerm, labs]);


  return (
    <PageShell title="Researchers" onAddItem={() => handleOpenModal()} addItemLabel="Add Researcher">
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
                placeholder="Filter researcher cards..."
                value={cardSearchTerm}
                onChange={(e) => setCardSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-72"
                aria-label="Filter researcher cards by search term"
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {researchers.length === 0 && <p className="text-center text-gray-500 py-5">No researchers found. Add one to get started.</p>}
      
      {currentView === 'card' && researchers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResearchers.map(researcher => {
            const lab = labs.find(l => l.id === researcher.labId);
            const researcherGrants = getResearcherGrants(researcher.id);
            const details = [
              { label: 'Title', value: researcher.title },
              { label: 'Email', value: researcher.email },
              { label: 'NetID', value: researcher.netId },
              { label: 'Department', value: researcher.department },
              { label: 'Organization', value: researcher.org },
              { label: 'Division', value: researcher.div },
              { label: 'Employee ID', value: researcher.employeeId },
              { label: 'UCR CID', value: researcher.ucrCid },
              { label: 'Lab', value: lab ? <Link to={`/labs#${lab.id}`} className="text-blue-600 hover:underline">{lab.name}</Link> : 'N/A' },
              { label: 'Research', value: researcher.research || 'N/A' }, // Changed from Research Interests
              { 
                label: 'Profile URL', 
                value: researcher.profileUrl ? 
                  <a href={researcher.profileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">
                    View Profile <LinkIcon className="w-3 h-3 ml-1" />
                  </a> 
                  : null 
              },
            ];

            return (
              <EntityCard
                key={researcher.id}
                title={researcher.name}
                details={details}
                onEdit={() => handleOpenModal(researcher)}
                onDelete={() => {
                  if(window.confirm(`Are you sure you want to delete ${researcher.name}? This action cannot be undone.`)) {
                    onDeleteResearcher(researcher.id);
                  }
                }}
              >
                {/* Notes Section */}
                <div className="mt-4">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">CRM Notes ({researcher.notes?.length || 0})</h4>
                  <button
                    onClick={() => handleOpenNoteModal(researcher)}
                    className="mb-3 text-sm bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md shadow-sm flex items-center"
                  >
                   <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-1" /> Add Note
                  </button>
                  {researcher.notes && researcher.notes.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {researcher.notes.slice().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(note => (
                        <div key={note.id} className="bg-gray-50 p-2 rounded-md text-xs">
                          <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                          <p className="text-gray-400 mt-1 text-right">
                            {new Date(note.createdAt).toLocaleDateString()}
                            <button onClick={() => handleOpenNoteModal(researcher, note)} className="ml-2 text-blue-500 hover:text-blue-700">Edit</button>
                            <button onClick={() => {
                                if(window.confirm('Are you sure you want to delete this note?')) {
                                  onDeleteNote(researcher.id, note.id);
                                }
                              }} className="ml-2 text-red-500 hover:red-blue-700">Delete</button>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {researcher.notes && researcher.notes.length > 0 && process.env.API_KEY && (
                    <div className="mt-3 space-x-2">
                      <button
                        onClick={() => handleSummarizeNotes(researcher)}
                        disabled={loadingSummary[researcher.id]}
                        className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md shadow-sm flex items-center disabled:opacity-50"
                      >
                       <DocumentTextIcon className="w-4 h-4 mr-1" /> {loadingSummary[researcher.id] ? 'Summarizing...' : 'Summarize Notes'}
                      </button>
                       <button
                        onClick={() => handleAnalyzeNotes(researcher)}
                        disabled={loadingAnalysis[researcher.id]}
                        className="text-sm bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded-md shadow-sm flex items-center disabled:opacity-50"
                      >
                        <LightBulbIcon className="w-4 h-4 mr-1" /> {loadingAnalysis[researcher.id] ? 'Analyzing...' : 'Analyze Notes'}
                      </button>
                    </div>
                  )}
                  {!process.env.API_KEY && researcher.notes && researcher.notes.length > 0 && (
                       <p className="text-xs text-amber-600 mt-2">Note: API Key not configured. AI summarization and analysis are unavailable.</p>
                  )}
                  {loadingSummary[researcher.id] && <LoadingSpinner size="sm" message="AI summarizing. Please wait..." />}
                  {summaries[researcher.id] && !loadingSummary[researcher.id] && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <h5 className="text-sm font-semibold text-blue-700">Summary:</h5>
                      <p className="text-xs text-blue-600 whitespace-pre-wrap">{summaries[researcher.id]}</p>
                    </div>
                  )}
                  {loadingAnalysis[researcher.id] && <LoadingSpinner size="sm" message="AI analyzing. Please wait..." />}
                  {analyses[researcher.id] && !loadingAnalysis[researcher.id] && (
                    <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-md">
                      <h5 className="text-sm font-semibold text-purple-700">Analysis:</h5>
                      <p className="text-xs text-purple-600"><strong>Sentiment:</strong> {analyses[researcher.id]?.sentiment}</p>
                      {analyses[researcher.id]?.keyThemes.length > 0 && (<p className="text-xs text-purple-600"><strong>Key Themes:</strong> {analyses[researcher.id]?.keyThemes.join(', ')}</p>)}
                    </div>
                  )}
                </div>
                {/* Grants Section */}
                {researcherGrants.length > 0 && (
                   <div className="mt-4 pt-3 border-t border-gray-200">
                    <h4 className="text-md font-semibold text-gray-700 mb-2 flex items-center">
                        <CurrencyDollarIcon className="w-5 h-5 mr-2 text-green-600" />
                        Associated Grants ({researcherGrants.length})
                    </h4>
                     <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5 max-h-24 overflow-y-auto pr-1">
                        {researcherGrants.map(grant => (
                          <li key={grant.id}>
                            <button 
                              onClick={() => handleOpenGrantDetailModal(grant)}
                              className="text-blue-600 hover:underline focus:outline-none"
                            >
                              {grant.title} (${grant.amount.toLocaleString()}) - <span className="text-xs italic">{grant.status}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                   </div>
                )}
              </EntityCard>
            );
          })}
           {filteredResearchers.length === 0 && cardSearchTerm.trim() !== '' && (
              <p className="text-center text-gray-500 col-span-full py-5">
                No researchers match your search term "{cardSearchTerm}".
              </p>
            )}
        </div>
      )}

      {currentView === 'table' && (
        researchers.length > 0 ? (
          <ResearchersTable
            researchers={researchers}
            grants={grants}
            onEditResearcher={handleOpenModal}
            onDeleteResearcher={(researcherId) => {
              const researcher = researchers.find(r => r.id === researcherId);
              if(researcher && window.confirm(`Are you sure you want to delete ${researcher.name}? This action cannot be undone.`)) {
                  onDeleteResearcher(researcherId);
              }
            }}
            onOpenNoteModal={handleOpenNoteModal}
            onViewGrantDetails={handleOpenGrantDetailModal}
            getLabName={getLabName}
          />
        ) : cardSearchTerm.trim() === '' && (<p className="text-center text-gray-500 py-5">No researchers to display in table view.</p>)
        // No message if table view is active and search term has filtered out card view items
      )}


      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingResearcher ? 'Edit Researcher' : 'Add New Researcher'}>
        <ResearcherForm
          key={editingResearcher ? editingResearcher.id : 'new-researcher'}
          onSubmit={handleSubmitResearcher}
          onCancel={handleCloseModal}
          labs={labs}
          initialData={editingResearcher}
        />
      </Modal>
      
      <Modal isOpen={isNoteModalOpen} onClose={handleCloseNoteModal} title={editingNote ? 'Edit Note' : 'Add Note' + (currentResearcherForNote ? ` for ${currentResearcherForNote.name}` : '')}>
        {currentResearcherForNote && (
          <form onSubmit={handleSubmitNote} className="space-y-3">
            <div>
              <label htmlFor="noteContent" className="block text-sm font-medium text-gray-700">Note Content</label>
              <textarea
                id="noteContent"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={5}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={handleCloseNoteModal} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300">Cancel</button>
              <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">{editingNote ? 'Save Changes' : 'Add Note'}</button>
            </div>
          </form>
        )}
      </Modal>

      <GrantDetailModal
        grant={selectedGrantForDetail}
        isOpen={isGrantDetailModalOpen}
        onClose={handleCloseGrantDetailModal}
        getResearcherName={getResearcherName}
        getProjectName={getProjectName}
        getStatusColor={getGrantStatusColor}
      />
    </PageShell>
  );
};

export default ResearchersPage;
