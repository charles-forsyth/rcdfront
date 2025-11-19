
import React, { useState, useCallback, useMemo } from 'react';
import { Grant, Researcher, Project, GrantStatus, PotentialGrant, MatchedResearcher, Lab } from '../../types';
import Modal from '../Modal';
import GrantForm from '../forms/GrantForm';
import EntityCard from '../EntityCard';
import PageShell from '../PageShell';
import { Link } from 'react-router-dom';
import { Squares2X2Icon, TableCellsIcon, LinkIcon, MagnifyingGlassIcon, UsersIcon, DocumentMagnifyingGlassIcon, UserGroupIcon, EnvelopeIcon, ChartBarSquareIcon } from '@heroicons/react/24/outline'; // Added ChartBarSquareIcon
import GrantsTable from '../GrantsTable';
import LoadingSpinner from '../LoadingSpinner';
import { searchExternalGrants, findMatchingResearchers, generateGrantIntroEmail } from '../../services/geminiService';
import ResearcherMatchingModal from '../ResearcherMatchingModal';
import GrantsGanttChart from '../GrantsGanttChart'; // New Import

type ViewMode = 'card' | 'table' | 'gantt';

interface GrantsPageProps {
  grants: Grant[];
  researchers: Researcher[];
  projects: Project[];
  labs: Lab[]; 
  onAddGrant: (grant: Grant) => void;
  onUpdateGrant: (grant: Grant) => void;
  onDeleteGrant: (grantId: string) => void;
}

const GrantsPage: React.FC<GrantsPageProps> = ({
  grants,
  researchers,
  projects,
  labs, 
  onAddGrant,
  onUpdateGrant,
  onDeleteGrant,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState<Grant | undefined>(undefined);
  const [currentView, setCurrentView] = useState<ViewMode>('card');
  const [cardSearchTerm, setCardSearchTerm] = useState('');

  // State for AI Grant Search (Potential Grants)
  const [grantSearchQuery, setGrantSearchQuery] = useState('');
  const [potentialGrants, setPotentialGrants] = useState<PotentialGrant[]>([]);
  const [selectedPotentialGrant, setSelectedPotentialGrant] = useState<PotentialGrant | null>(null);
  const [isGrantSearchLoading, setIsGrantSearchLoading] = useState(false);
  const [grantSearchError, setGrantSearchError] = useState<string | null>(null);

  // State for Researcher Cross-Referencing (for Potential Grants)
  const [matchedResearchersForPotential, setMatchedResearchersForPotential] = useState<MatchedResearcher[]>([]);
  const [isCrossReferencingLoading, setIsCrossReferencingLoading] = useState(false);
  const [crossReferenceError, setCrossReferenceError] = useState<string | null>(null);
  const [isPotentialGrantMatchModalOpen, setIsPotentialGrantMatchModalOpen] = useState(false);

  // State for Finding Collaborators (for Managed Grants)
  const [selectedManagedGrantForCollab, setSelectedManagedGrantForCollab] = useState<Grant | null>(null);
  const [collaboratorSearchResults, setCollaboratorSearchResults] = useState<MatchedResearcher[]>([]);
  const [isCollabSearchLoading, setIsCollabSearchLoading] = useState(false);
  const [collabSearchError, setCollabSearchError] = useState<string | null>(null);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);

  // State for Email Generation
  const [emailGenGrantId, setEmailGenGrantId] = useState<string | null>(null);
  const [isEmailGenerating, setIsEmailGenerating] = useState(false);


  const handleOpenModal = (grant?: Grant) => {
    setEditingGrant(grant);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingGrant(undefined);
    setIsModalOpen(false);
  };

  const handleSubmitGrant = (grant: Grant) => {
    if (editingGrant) {
      onUpdateGrant(grant);
    } else {
      onAddGrant(grant);
    }
    handleCloseModal();
  };

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
  
  const getStatusColor = useCallback((status: GrantStatus) => {
    switch (status) {
      case GrantStatus.ACTIVE: return 'text-green-700 bg-green-100 border-green-300'; // Added border for gantt
      case GrantStatus.AWARDED: return 'text-blue-700 bg-blue-100 border-blue-300';
      case GrantStatus.PENDING: return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case GrantStatus.SUBMITTED: return 'text-indigo-700 bg-indigo-100 border-indigo-300';
      case GrantStatus.CLOSED: return 'text-gray-700 bg-gray-100 border-gray-300';
      case GrantStatus.NOT_FUNDED: return 'text-red-700 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  }, []);

  const handleGrantSearch = async () => {
    if (!grantSearchQuery.trim()) {
      setGrantSearchError("Please enter search criteria.");
      return;
    }
    if (!process.env.API_KEY) {
      setGrantSearchError("API Key not configured. Grant search is unavailable.");
      return;
    }

    setIsGrantSearchLoading(true);
    setGrantSearchError(null);
    setPotentialGrants([]);
    setSelectedPotentialGrant(null);
    try {
      const results = await searchExternalGrants(grantSearchQuery);
      setPotentialGrants(results);
      if (results.length === 0) {
        setGrantSearchError("No grants found matching your criteria.");
      }
    } catch (error) {
      console.error("Grant search failed:", error);
      setGrantSearchError((error as Error).message || "Failed to search for grants. Please try again.");
    } finally {
      setIsGrantSearchLoading(false);
    }
  };

  const handlePotentialGrantSelection = (grant: PotentialGrant) => {
    setSelectedPotentialGrant(prev => prev?.id === grant.id ? null : grant);
  };

  const prepareExtendedResearchersInfo = useCallback(() => {
    return researchers.map(researcher => {
        const lab = labs.find(l => l.id === researcher.labId);
        const associatedLabNames = lab ? [lab.name] : [];
        const researcherProjectsSet = new Set<Project>();
        projects.filter(p => p.leadResearcherId === researcher.id).forEach(p => researcherProjectsSet.add(p));
        if (researcher.labId) {
          projects.filter(p => p.labIds?.includes(researcher.labId!)).forEach(p => researcherProjectsSet.add(p));
        }
        const associatedProjectDetails = Array.from(researcherProjectsSet).map(p => ({ 
          name: p.name, 
          description: p.description 
        }));
        return {
          id: researcher.id, name: researcher.name, research: researcher.research,
          title: researcher.title, org: researcher.org, department: researcher.department,
          associatedLabNames, associatedProjectDetails,
        };
      });
  }, [researchers, labs, projects]);


  const handleCrossReferenceForPotentialGrant = async () => {
    if (!selectedPotentialGrant) {
      setCrossReferenceError("Please select a grant from the search results first.");
      return;
    }
     if (!process.env.API_KEY) {
      setCrossReferenceError("API Key not configured. Researcher matching is unavailable.");
      setIsPotentialGrantMatchModalOpen(true);
      return;
    }

    setIsCrossReferencingLoading(true);
    setCrossReferenceError(null);
    setMatchedResearchersForPotential([]);
    try {
      const extendedInfo = prepareExtendedResearchersInfo();
      const results = await findMatchingResearchers(selectedPotentialGrant.description, extendedInfo);
      setMatchedResearchersForPotential(results);
      if (results.length === 0) {
        setCrossReferenceError("No matching researchers found for this grant based on their extended profiles.");
      }
    } catch (error) {
      console.error("Researcher cross-referencing failed:", error);
      setCrossReferenceError((error as Error).message || "Failed to cross-reference researchers. Please try again.");
    } finally {
      setIsCrossReferencingLoading(false);
      setIsPotentialGrantMatchModalOpen(true); 
    }
  };


  const handleFindCollaboratorsForManagedGrant = async (grant: Grant) => {
    if (!grant.description) {
      setCollabSearchError("This grant has no description to base the collaborator search on. Please edit the grant to add one.");
      setIsCollabModalOpen(true); // Open modal to show error
      return;
    }
    if (!process.env.API_KEY) {
      setCollabSearchError("API Key not configured for AI features.");
      setIsCollabModalOpen(true); // Open modal to show error
      return;
    }

    setSelectedManagedGrantForCollab(grant);
    setIsCollabSearchLoading(true);
    setCollabSearchError(null);
    setCollaboratorSearchResults([]);
    try {
      const extendedInfo = prepareExtendedResearchersInfo();
      const results = await findMatchingResearchers(grant.description, extendedInfo);
      setCollaboratorSearchResults(results);
      if (results.length === 0) {
        setCollabSearchError(`No potential collaborators found for "${grant.title}" based on current researcher profiles.`);
      }
    } catch (error) {
      console.error("Collaborator search failed:", error);
      setCollabSearchError((error as Error).message || "Failed to find collaborators. Please try again.");
    } finally {
      setIsCollabSearchLoading(false);
      setIsCollabModalOpen(true);
    }
  };

  const handleDraftCollaborationEmail = async (grant: Grant) => {
    if (!process.env.API_KEY) {
        alert("API Key not configured. Email generation is unavailable.");
        return;
    }
    if (!grant.principalInvestigatorId) {
        alert("This grant does not have a Principal Investigator assigned. Please assign a PI first.");
        return;
    }
    const pi = researchers.find(r => r.id === grant.principalInvestigatorId);
    if (!pi) {
        alert("Principal Investigator details not found for this grant.");
        return;
    }

    setEmailGenGrantId(grant.id);
    setIsEmailGenerating(true);
    try {
        const { subject, body } = await generateGrantIntroEmail(grant, pi);
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank'); // Opens in a new window/tab
    } catch (error) {
        console.error("Error drafting collaboration email:", error);
        alert(`Failed to draft email: ${(error as Error).message}`);
    } finally {
        setIsEmailGenerating(false);
        setEmailGenGrantId(null);
    }
  };


  const filteredManagedGrants = useMemo(() => {
    if (!cardSearchTerm.trim()) {
      return grants;
    }
    const lowerSearchTerm = cardSearchTerm.toLowerCase();
    return grants.filter(grant => {
      const piName = getResearcherName(grant.principalInvestigatorId).toLowerCase();
      return (
        grant.title.toLowerCase().includes(lowerSearchTerm) ||
        grant.agency.toLowerCase().includes(lowerSearchTerm) ||
        (grant.awardNumber && grant.awardNumber.toLowerCase().includes(lowerSearchTerm)) ||
        (grant.description && grant.description.toLowerCase().includes(lowerSearchTerm)) ||
        piName.includes(lowerSearchTerm)
      );
    });
  }, [grants, cardSearchTerm, getResearcherName]);

  return (
    <PageShell title="Research Grants" onAddItem={() => handleOpenModal()} addItemLabel="Add Grant">
      {/* AI Grant Discovery Section */}
      <div className="bg-slate-50 p-4 sm:p-6 rounded-xl shadow-lg mb-8 border border-slate-200">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 mb-4 flex items-center">
          <DocumentMagnifyingGlassIcon className="w-7 h-7 mr-2 text-blue-600" />
          AI Grant Discovery
        </h2>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
          <input
            type="text"
            value={grantSearchQuery}
            onChange={(e) => setGrantSearchQuery(e.target.value)}
            placeholder="Enter keywords for grant search (e.g., 'cancer research NSF', 'AI ethics funding')"
            className="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            aria-label="Grant search criteria"
          />
          <button
            onClick={handleGrantSearch}
            disabled={isGrantSearchLoading || !process.env.API_KEY}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center text-sm disabled:opacity-60"
            title={!process.env.API_KEY ? "API Key not configured for AI search" : "Search for grants"}
          >
            <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
            {isGrantSearchLoading ? 'Searching...' : 'Search Grants'}
          </button>
        </div>
        {!process.env.API_KEY && <p className="text-xs text-red-600 mb-3">AI Grant Discovery requires API key configuration.</p>}
        {isGrantSearchLoading && <LoadingSpinner message="AI is searching for grants. Please wait..." />}
        {grantSearchError && !isGrantSearchLoading && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md mb-3">{grantSearchError}</p>}

        {potentialGrants.length > 0 && !isGrantSearchLoading && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Potential Grant Opportunities Found:</h3>
            <div className="overflow-x-auto shadow-md rounded-lg bg-white">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">Select</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agency</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Award #</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Date</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-sm">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {potentialGrants.map((pg) => (
                    <tr key={pg.id} className={`${selectedPotentialGrant?.id === pg.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={selectedPotentialGrant?.id === pg.id}
                          onChange={() => handlePotentialGrantSelection(pg)}
                          aria-label={`Select grant ${pg.title}`}
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-800">
                        <a 
                            href={`https://www.google.com/search?q=${encodeURIComponent(pg.title + " " + pg.agency)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            title={`Search for "${pg.title}" on Google`}
                        >
                            {pg.title}
                            <LinkIcon className="w-3 h-3 inline-block ml-1 opacity-60" />
                        </a>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{pg.agency}</td>
                      <td className="px-3 py-2 text-gray-600">{pg.awardNumber || 'N/A'}</td>
                      <td className="px-3 py-2 text-gray-600">{typeof pg.amount === 'number' ? `$${pg.amount.toLocaleString()}` : pg.amount || 'N/A'}</td>
                      <td className="px-3 py-2 text-gray-600">{pg.submissionDate || 'N/A'}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-sm truncate" title={pg.description}>{pg.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={handleCrossReferenceForPotentialGrant}
                disabled={!selectedPotentialGrant || isCrossReferencingLoading || !process.env.API_KEY}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 flex items-center text-sm disabled:opacity-60"
                 title={!process.env.API_KEY ? "API Key not configured for AI features" : (!selectedPotentialGrant ? "Select a grant from the table above" : "Find matching PIs for selected grant")}
              >
                <UsersIcon className="w-5 h-5 mr-2" />
                {isCrossReferencingLoading ? 'Matching PIs...' : 'Cross-Reference PIs'}
              </button>
            </div>
          </div>
        )}
      </div>

      <ResearcherMatchingModal
        isOpen={isPotentialGrantMatchModalOpen}
        onClose={() => setIsPotentialGrantMatchModalOpen(false)}
        mode="createPendingGrant"
        targetPotentialGrant={selectedPotentialGrant}
        matchedResearchers={matchedResearchersForPotential}
        isLoading={isCrossReferencingLoading}
        error={crossReferenceError}
        researchers={researchers} 
        managedGrants={grants}
        onAddGrant={onAddGrant}
      />
      
      <ResearcherMatchingModal
        isOpen={isCollabModalOpen}
        onClose={() => {
            setIsCollabModalOpen(false);
            setSelectedManagedGrantForCollab(null);
            setCollaboratorSearchResults([]);
            setCollabSearchError(null);
        }}
        mode="addCoPi"
        targetManagedGrant={selectedManagedGrantForCollab}
        matchedResearchers={collaboratorSearchResults}
        isLoading={isCollabSearchLoading}
        error={collabSearchError}
        researchers={researchers}
        onUpdateGrant={onUpdateGrant}
      />

      {/* Managed Grants Display */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 mt-8 space-y-3 sm:space-y-0 sm:gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Managed Grants</h2>
        <div className="flex space-x-2 items-center"> 
            <button
            onClick={() => setCurrentView('card')}
            className={`px-3 py-2 rounded-md text-sm font-medium flex items-center
                ${currentView === 'card' ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            aria-pressed={currentView === 'card'}
            >
            <Squares2X2Icon className="w-5 h-5 mr-1.5" />
            Card
            </button>
            <button
            onClick={() => setCurrentView('table')}
            className={`px-3 py-2 rounded-md text-sm font-medium flex items-center
                ${currentView === 'table' ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            aria-pressed={currentView === 'table'}
            >
            <TableCellsIcon className="w-5 h-5 mr-1.5" />
            Table
            </button>
            <button
            onClick={() => setCurrentView('gantt')}
            className={`px-3 py-2 rounded-md text-sm font-medium flex items-center
                ${currentView === 'gantt' ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            aria-pressed={currentView === 'gantt'}
            >
            <ChartBarSquareIcon className="w-5 h-5 mr-1.5" />
            Gantt
            </button>
        </div>
         <div className="relative w-full sm:w-auto">
            <input
                type="text"
                placeholder="Filter managed grant cards..."
                value={cardSearchTerm}
                onChange={(e) => setCardSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-72"
                aria-label="Filter managed grant cards by search term"
                disabled={currentView !== 'card'}
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>


      {grants.length === 0 && <p className="text-center text-gray-500 py-5">No managed grants found. Add one to get started or use the AI Grant Discovery tool.</p>}

      {currentView === 'card' && grants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredManagedGrants.map(grant => {
            const pi = getResearcherName(grant.principalInvestigatorId);
            const coPis = grant.coPiIds?.map(id => getResearcherName(id)).filter(Boolean).join(', ');
            const grantProjects = grant.projectIds?.map(id => projects.find(p => p.id === id)).filter(Boolean) as Project[];

            const details = [
              { label: 'Agency', value: grant.agency },
              { label: 'Award #', value: grant.awardNumber || 'N/A' },
              { label: 'PI', value: <Link to={`/researchers#${grant.principalInvestigatorId}`} className="text-blue-600 hover:underline">{pi}</Link> },
              { label: 'Co-PIs', value: coPis || 'N/A' },
              { label: 'Amount', value: `$${grant.amount.toLocaleString()}` },
              { label: 'Status', value: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(grant.status).split(' ')[0]} ${getStatusColor(grant.status).split(' ')[1]}`}>{grant.status}</span>}, // Simplified for card view
              { label: 'Start Date', value: new Date(grant.startDate).toLocaleDateString() },
              { label: 'End Date', value: new Date(grant.endDate).toLocaleDateString() },
              { label: 'Proposal Due', value: grant.proposalDueDate ? new Date(grant.proposalDueDate).toLocaleDateString() : 'N/A' },
              { label: 'Award Date', value: grant.awardDate ? new Date(grant.awardDate).toLocaleDateString() : 'N/A' },
              { label: 'Description', value: grant.description },
            ];

            return (
              <EntityCard
                key={grant.id}
                title={grant.title}
                details={details.filter(d => d.value !== undefined && d.value !== null && d.value !== 'N/A')}
                onEdit={() => handleOpenModal(grant)}
                onDelete={() => {
                  if (window.confirm(`Are you sure you want to delete grant "${grant.title}"? This action cannot be undone.`)) {
                    onDeleteGrant(grant.id);
                  }
                }}
              >
                <div className="mt-4 space-y-2"> 
                  {grantProjects && grantProjects.length > 0 && (
                    <div className="mb-2"> 
                      <h4 className="text-md font-semibold text-gray-700 mb-1">Associated Projects ({grantProjects.length})</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5 max-h-20 overflow-y-auto">
                        {grantProjects.map(p => (
                          <li key={p.id}>
                            <Link to={`/projects#${p.id}`} className="hover:text-blue-600 inline-flex items-center">
                              {p.name} <LinkIcon className="w-3 h-3 ml-1" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                   <button
                        onClick={() => handleFindCollaboratorsForManagedGrant(grant)}
                        disabled={
                            !grant.description || 
                            !process.env.API_KEY ||
                            (isCollabSearchLoading && selectedManagedGrantForCollab?.id === grant.id)
                        }
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-3 rounded-md shadow-sm text-xs flex items-center justify-center transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                            !process.env.API_KEY ? "API Key not configured" 
                            : !grant.description ? "Grant needs a description for AI matching" 
                            : (isCollabSearchLoading && selectedManagedGrantForCollab?.id === grant.id) ? `Finding collaborators for ${grant.title}...`
                            : `Find Co-PIs/Collaborators for ${grant.title}`
                        }
                    >
                        {isCollabSearchLoading && selectedManagedGrantForCollab?.id === grant.id ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Finding...
                            </>
                        ) : (
                            <>
                                <UserGroupIcon className="w-4 h-4 mr-1.5" />
                                Find Co-PIs/Collaborators
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => handleDraftCollaborationEmail(grant)}
                        disabled={!grant.principalInvestigatorId || !process.env.API_KEY || (isEmailGenerating && emailGenGrantId === grant.id)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-3 rounded-md shadow-sm text-xs flex items-center justify-center transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                            !process.env.API_KEY ? "API Key not configured"
                            : !grant.principalInvestigatorId ? "Grant needs a PI assigned"
                            : (isEmailGenerating && emailGenGrantId === grant.id) ? `Drafting email for ${grant.title}...`
                            : `Draft collaboration email for ${grant.title}`
                        }
                    >
                        {isEmailGenerating && emailGenGrantId === grant.id ? (
                             <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Drafting...
                            </>
                        ) : (
                            <>
                               <EnvelopeIcon className="w-4 h-4 mr-1.5" />
                                Draft Collaboration Email
                            </>
                        )}
                    </button>
                </div>
              </EntityCard>
            );
          })}
          {filteredManagedGrants.length === 0 && cardSearchTerm.trim() !== '' && (
             <p className="text-center text-gray-500 col-span-full py-5">
                No managed grants match your search term "{cardSearchTerm}".
              </p>
          )}
        </div>
      )}
      
      {currentView === 'table' && (
        grants.length > 0 ? (
            <GrantsTable
                grants={grants}
                onEditGrant={handleOpenModal}
                onDeleteGrant={(grantId) => {
                    const grant = grants.find(g => g.id === grantId);
                    if (grant && window.confirm(`Are you sure you want to delete grant "${grant.title}"? This action cannot be undone.`)) {
                        onDeleteGrant(grantId);
                    }
                }}
                getResearcherName={getResearcherName}
                getProjectName={getProjectName} 
                getStatusColor={(status: GrantStatus) => getStatusColor(status).split(' ')[0] + ' ' + getStatusColor(status).split(' ')[1]} // Pass only text and bg color for table
            />
        ) : cardSearchTerm.trim() === '' && ( <p className="text-center text-gray-500 py-5">No managed grants to display in table view.</p>)
      )}

      {currentView === 'gantt' && grants.length > 0 && (
         <GrantsGanttChart 
            grants={grants} 
            getStatusColor={getStatusColor} 
            getResearcherName={getResearcherName}
        />
      )}
      {currentView === 'gantt' && grants.length === 0 && (
        <p className="text-center text-gray-500 py-5">No managed grants to display in Gantt chart view.</p>
      )}


      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingGrant ? 'Edit Grant' : 'Add New Grant'}>
        <GrantForm
          key={editingGrant ? editingGrant.id : 'new-grant'}
          onSubmit={handleSubmitGrant}
          onCancel={handleCloseModal}
          researchers={researchers}
          projects={projects}
          initialData={editingGrant}
        />
      </Modal>
    </PageShell>
  );
};

export default GrantsPage;
