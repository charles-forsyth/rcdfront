import React from 'react';
import { Grant, GrantStatus, Project, Researcher } from '../types';
import Modal from './Modal';
import { Link } from 'react-router-dom';
import { LinkIcon, UserCircleIcon, UsersIcon, ClipboardDocumentListIcon, CalendarDaysIcon, CurrencyDollarIcon, TagIcon, InformationCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface GrantDetailModalProps {
  grant: Grant | null;
  isOpen: boolean;
  onClose: () => void;
  getResearcherName: (researcherId?: string) => string;
  getProjectName: (projectId?: string) => string;
  getStatusColor: (status: GrantStatus) => string;
}

const DetailItem: React.FC<{ icon: React.ElementType, label: string, value?: React.ReactNode, fullWidth?: boolean }> = ({ icon: Icon, label, value, fullWidth }) => {
  if (!value && value !== 0) return null;
  return (
    <div className={`flex items-start space-x-2 ${fullWidth ? 'col-span-2' : ''}`}>
      <Icon className="w-5 h-5 text-blue-600 mt-0.5" />
      <div>
        <span className="font-semibold text-gray-700">{label}:</span>
        <div className="text-gray-600 ml-1">{value}</div>
      </div>
    </div>
  );
};


const GrantDetailModal: React.FC<GrantDetailModalProps> = ({ grant, isOpen, onClose, getResearcherName, getProjectName, getStatusColor }) => {
  if (!isOpen || !grant) return null;

  const piName = getResearcherName(grant.principalInvestigatorId);
  const coPiNames = grant.coPiIds?.map(id => getResearcherName(id)).filter(Boolean).join(', ');
  
   const grantProjects = grant.projectIds?.map(id => {
    const name = getProjectName(id);
    return { id, name };
   }).filter(p => p.name !== 'Unknown Project' && p.name !== 'N/A') || [];


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Grant Details: ${grant.title}`}>
      <div className="space-y-4 text-sm py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          <DetailItem icon={TagIcon} label="Agency" value={grant.agency} />
          <DetailItem icon={InformationCircleIcon} label="Award Number" value={grant.awardNumber || 'N/A'} />
          
          <DetailItem 
            icon={UserCircleIcon} 
            label="Principal Investigator (PI)" 
            value={piName !== 'N/A' ? <Link to={`/researchers#${grant.principalInvestigatorId}`} className="text-blue-600 hover:underline">{piName}</Link> : 'N/A'} 
          />
          {coPiNames && (
            <DetailItem 
              icon={UsersIcon} 
              label="Co-PIs" 
              value={
                grant.coPiIds?.map(id => (
                    <Link key={id} to={`/researchers#${id}`} className="text-blue-600 hover:underline mr-2 last:mr-0">{getResearcherName(id)}</Link>
                ))
              }
            />
          )}

          <DetailItem icon={CurrencyDollarIcon} label="Amount" value={`$${grant.amount.toLocaleString()}`} />
          <DetailItem 
            icon={TagIcon} 
            label="Status" 
            value={<span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(grant.status)}`}>{grant.status}</span>} 
          />

          <DetailItem icon={CalendarDaysIcon} label="Start Date" value={new Date(grant.startDate).toLocaleDateString()} />
          <DetailItem icon={CalendarDaysIcon} label="End Date" value={new Date(grant.endDate).toLocaleDateString()} />
          
          {grant.proposalDueDate && <DetailItem icon={CalendarDaysIcon} label="Proposal Due Date" value={new Date(grant.proposalDueDate).toLocaleDateString()} />}
          {grant.awardDate && <DetailItem icon={CalendarDaysIcon} label="Award Date" value={new Date(grant.awardDate).toLocaleDateString()} />}
        </div>

        {grant.description && (
            <DetailItem icon={DocumentTextIcon} label="Description" value={<p className="whitespace-pre-wrap">{grant.description}</p>} fullWidth={true}/>
        )}

        {grantProjects.length > 0 && (
          <div className="pt-2">
            <h4 className="text-md font-semibold text-gray-700 mb-1 flex items-center">
                <ClipboardDocumentListIcon className="w-5 h-5 mr-2 text-blue-600" />
                Associated Projects
            </h4>
            <ul className="list-disc list-inside ml-2 text-gray-600 space-y-0.5">
              {grantProjects.map(p => (
                <li key={p.id}>
                  <Link to={`/projects#${p.id}`} className="text-blue-600 hover:underline inline-flex items-center">
                    {p.name} <LinkIcon className="w-3 h-3 ml-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
         {!grantProjects.length && (
            <DetailItem icon={ClipboardDocumentListIcon} label="Associated Projects" value="None" />
        )}
      </div>
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
// Removed an assumed extra '};' from here if it existed. The provided code was:
// };
// export default GrantDetailModal;
// Which is correct. If the error persists, the extra brace is elsewhere or the issue is different.

export default GrantDetailModal;