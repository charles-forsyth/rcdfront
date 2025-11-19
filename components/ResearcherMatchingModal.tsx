
import React, { useState } from 'react';
import { MatchedResearcher, Researcher as FullResearcher, PotentialGrant, Grant, GrantStatus } from '../types';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import { UserCircleIcon, LightBulbIcon, ChatBubbleBottomCenterTextIcon, LinkIcon, PlusCircleIcon, ExclamationCircleIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface ResearcherMatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  error?: string | null;
  matchedResearchers: MatchedResearcher[];
  researchers: FullResearcher[]; // Full list of available researchers for linking

  mode: 'createPendingGrant' | 'addCoPi';
  
  // Props for 'createPendingGrant' mode
  targetPotentialGrant?: PotentialGrant | null;
  managedGrants?: Grant[]; 
  onAddGrant?: (grant: Grant) => void;

  // Props for 'addCoPi' mode
  targetManagedGrant?: Grant | null;
  onUpdateGrant?: (grant: Grant) => void;
}

const parseAmountToNumber = (amountValue?: string | number): number => {
  if (typeof amountValue === 'number') {
    return amountValue;
  }
  if (!amountValue || typeof amountValue !== 'string') {
    return 0;
  }
  let str = amountValue.toLowerCase().replace(/[\$,]/g, '').trim();
  if (str.includes("varies") || str.includes("see description") || str.includes("tbd") || str.includes("n/a")) return 0;
  if (str.includes("up to")) str = str.replace("up to", "").trim();
  if (str.includes("-")) str = str.split('-')[0].trim();
  let multiplier = 1;
  if (str.endsWith('k')) { multiplier = 1000; str = str.slice(0, -1); } 
  else if (str.endsWith('m')) { multiplier = 1000000; str = str.slice(0, -1); }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num * multiplier;
};

const parseSubmissionDateForProposalDueDate = (submissionDate?: string): string | undefined => {
  if (!submissionDate) return undefined;
  const lowerSubDate = submissionDate.toLowerCase();
  if (lowerSubDate.includes("rolling") || lowerSubDate.includes("tbd") || lowerSubDate.includes("n/a")) return undefined;
  try {
    const d = new Date(submissionDate);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().split('T')[0];
  } catch (e) { return undefined; }
};


const ResearcherMatchingModal: React.FC<ResearcherMatchingModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  error,
  matchedResearchers,
  researchers,
  mode,
  targetPotentialGrant,
  managedGrants,
  onAddGrant,
  targetManagedGrant,
  onUpdateGrant,
}) => {
  if (!isOpen) return null;

  // Track researchers who have been actioned in this modal session to update button states
  const [actionedResearcherIds, setActionedResearcherIds] = useState<Record<string, 'added' | 'exists'>>({});


  const modalTitle = mode === 'createPendingGrant' && targetPotentialGrant?.title
    ? `Potential Researcher Matches for "${targetPotentialGrant.title}"`
    : mode === 'addCoPi' && targetManagedGrant?.title
    ? `Potential Co-PIs/Collaborators for "${targetManagedGrant.title}"`
    : "Potential Researcher Matches";

  const handleCreateAndAssignGrant = (matchedResearcher: MatchedResearcher) => {
    if (!targetPotentialGrant || !matchedResearcher.originalId || !onAddGrant) {
      alert("Error: Missing grant details, researcher ID, or add function.");
      return;
    }

    const newGrant: Grant = {
      id: Date.now().toString(),
      title: targetPotentialGrant.title,
      agency: targetPotentialGrant.agency,
      awardNumber: (targetPotentialGrant.awardNumber && !["tbd", "n/a"].includes(targetPotentialGrant.awardNumber.toLowerCase())) 
                    ? targetPotentialGrant.awardNumber 
                    : undefined,
      principalInvestigatorId: matchedResearcher.originalId,
      coPiIds: undefined,
      amount: parseAmountToNumber(targetPotentialGrant.amount),
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      status: GrantStatus.PENDING,
      description: targetPotentialGrant.description,
      proposalDueDate: parseSubmissionDateForProposalDueDate(targetPotentialGrant.submissionDate),
      awardDate: undefined,
      projectIds: undefined,
    };

    try {
      onAddGrant(newGrant);
      alert(`Successfully created new pending grant "${newGrant.title}" with ${matchedResearcher.name} as PI.`);
      setActionedResearcherIds(prev => ({...prev, [matchedResearcher.originalId!]: 'added'}));
    } catch (e) {
      console.error("Failed to add grant:", e);
      alert("Failed to create the grant. Please try again.");
    }
  };

  const handleAddCoPiToGrant = (matchedResearcher: MatchedResearcher) => {
    if (!targetManagedGrant || !matchedResearcher.originalId || !onUpdateGrant) {
      alert("Error: Missing target grant, researcher ID, or update function.");
      return;
    }

    if (targetManagedGrant.principalInvestigatorId === matchedResearcher.originalId || 
        targetManagedGrant.coPiIds?.includes(matchedResearcher.originalId)) {
      setActionedResearcherIds(prev => ({...prev, [matchedResearcher.originalId!]: 'exists'}));
      // No alert needed, button state will reflect this.
      return;
    }

    const updatedGrant: Grant = {
      ...targetManagedGrant,
      coPiIds: [...(targetManagedGrant.coPiIds || []), matchedResearcher.originalId],
    };
    
    try {
      onUpdateGrant(updatedGrant);
      alert(`${matchedResearcher.name} has been added as a Co-PI to "${targetManagedGrant.title}".`);
      setActionedResearcherIds(prev => ({...prev, [matchedResearcher.originalId!]: 'added'}));
    } catch (e) {
      console.error("Failed to update grant with Co-PI:", e);
      alert("Failed to add Co-PI. Please try again.");
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      {isLoading && <LoadingSpinner message="AI is analyzing researchers. This may take a moment..." />}
      {error && !isLoading && <p className="text-red-600 bg-red-100 p-3 rounded-md my-3 text-sm">{error}</p>}
      
      {!isLoading && !error && matchedResearchers.length === 0 && (
        <p className="text-gray-600 my-4 text-sm">
          {mode === 'createPendingGrant' 
            ? "No specific researchers were matched for this grant opportunity." 
            : "No potential Co-PIs/Collaborators found for this grant based on current researcher profiles."}
        </p>
      )}

      {!isLoading && (targetPotentialGrant || targetManagedGrant) && matchedResearchers.length > 0 && (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 mt-2">
          {matchedResearchers.map((match) => {
            const originalResearcher = researchers.find(r => r.id === match.originalId || r.name === match.name);
            const researcherId = originalResearcher?.id || match.originalId; // Prefer originalResearcher.id if found

            let buttonAction: (() => void) | undefined;
            let buttonText = "";
            let buttonDisabled = !researcherId;
            let buttonTitle = "";
            let ButtonIconComponent = PlusCircleIcon; // Default icon

            if (mode === 'createPendingGrant' && targetPotentialGrant && onAddGrant) {
              const grantExists = managedGrants?.some(
                g => g.title === targetPotentialGrant.title && g.agency === targetPotentialGrant.agency
              );
              if (grantExists || actionedResearcherIds[researcherId!] === 'added') {
                 buttonText = grantExists ? "Grant Exists" : "Grant Created";
                 buttonDisabled = true;
                 ButtonIconComponent = ExclamationCircleIcon;
                 buttonTitle = grantExists ? "A grant with this title and agency already exists." : "This grant has been created.";
              } else {
                buttonAction = () => handleCreateAndAssignGrant(match);
                buttonText = "Create Pending Grant & Assign as PI";
                buttonTitle = `Create pending grant for "${targetPotentialGrant.title}" with ${match.name} as PI`;
              }
            } else if (mode === 'addCoPi' && targetManagedGrant && onUpdateGrant) {
                ButtonIconComponent = UserPlusIcon;
                if (actionedResearcherIds[researcherId!] === 'added') {
                    buttonText = "Added as Co-PI";
                    buttonDisabled = true;
                } else if (targetManagedGrant.principalInvestigatorId === researcherId) {
                    buttonText = "Already PI";
                    buttonDisabled = true;
                    buttonTitle = `${match.name} is already the Principal Investigator.`;
                } else if (targetManagedGrant.coPiIds?.includes(researcherId!)) {
                    buttonText = "Already Co-PI";
                    buttonDisabled = true;
                    buttonTitle = `${match.name} is already a Co-PI.`;
                } else {
                    buttonAction = () => handleAddCoPiToGrant(match);
                    buttonText = "Add as Co-PI";
                    buttonTitle = `Add ${match.name} as a Co-PI to "${targetManagedGrant.title}"`;
                }
            }
            
            return (
                <div key={`${match.originalId || match.name}-${mode}`} className="p-4 bg-slate-50 rounded-lg shadow-sm border border-slate-200">
                  <div className="flex items-center mb-2">
                      <UserCircleIcon className="w-6 h-6 text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">
                      {originalResearcher && originalResearcher.id ? (
                          <Link to={`/researchers#${originalResearcher.id}`} className="hover:underline" title={`View profile of ${match.name}`}>
                          {match.name} <LinkIcon className="w-4 h-4 inline-block text-blue-500" />
                          </Link>
                      ) : (
                          match.name
                      )}
                      </h3>
                  </div>
                  {match.research && (
                      <div className="flex items-start text-sm text-gray-600 mb-1">
                      <LightBulbIcon className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 shrink-0" />
                      <p><span className="font-medium">Research:</span> {match.research}</p>
                      </div>
                  )}
                  <div className="flex items-start text-sm text-gray-700 mb-3">
                      <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-teal-500 mr-2 mt-0.5 shrink-0" />
                      <p><span className="font-medium">AI Match Reason:</span> {match.matchReason}</p>
                  </div>

                  {buttonAction && (
                    <button
                        onClick={buttonAction}
                        disabled={buttonDisabled}
                        className={`w-full mt-2 font-semibold py-2 px-3 rounded-md shadow-sm text-xs flex items-center justify-center transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed
                          ${buttonDisabled && (actionedResearcherIds[researcherId!] === 'exists' || buttonText.includes("Already") || buttonText.includes("Grant Exists")) 
                            ? 'bg-amber-500 text-white' 
                            : buttonDisabled && actionedResearcherIds[researcherId!] === 'added'
                            ? 'bg-green-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        title={buttonTitle}
                    >
                        <ButtonIconComponent className="w-4 h-4 mr-1.5" />
                        {buttonText}
                    </button>
                  )}
                   {!buttonAction && buttonText && ( // For disabled states without a direct action
                     <div className={`w-full mt-2 font-semibold py-2 px-3 rounded-md shadow-sm text-xs flex items-center justify-center text-white
                          ${(actionedResearcherIds[researcherId!] === 'exists' || buttonText.includes("Already") || buttonText.includes("Grant Exists")) 
                            ? 'bg-amber-500' 
                            : 'bg-gray-400' // Default disabled look
                          }`}
                        title={buttonTitle}
                    >
                         <ButtonIconComponent className="w-4 h-4 mr-1.5" />
                        {buttonText}
                    </div>
                   )}
                </div>
            );
            })}
        </div>
      )}
       <div className="mt-6 text-right">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default ResearcherMatchingModal;
