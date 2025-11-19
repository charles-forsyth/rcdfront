
import React, { useState, useEffect } from 'react';
import { Grant, Researcher, Project, GrantStatus } from '../../types';
import { GRANT_STATUSES } from '../../constants';

interface GrantFormProps {
  onSubmit: (grant: Grant) => void;
  onCancel: () => void;
  researchers: Researcher[];
  projects: Project[];
  initialData?: Grant;
}

const GrantForm: React.FC<GrantFormProps> = ({ onSubmit, onCancel, researchers, projects, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [agency, setAgency] = useState(initialData?.agency || '');
  const [awardNumber, setAwardNumber] = useState(initialData?.awardNumber || '');
  const [principalInvestigatorId, setPrincipalInvestigatorId] = useState(initialData?.principalInvestigatorId || '');
  const [coPiIds, setCoPiIds] = useState<string[]>(initialData?.coPiIds || []);
  const [amount, setAmount] = useState<number | ''>(initialData?.amount ?? '');
  const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [status, setStatus] = useState<GrantStatus>(initialData?.status || GrantStatus.PENDING);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(initialData?.projectIds || []);
  const [description, setDescription] = useState(initialData?.description || '');
  const [proposalDueDate, setProposalDueDate] = useState(initialData?.proposalDueDate || '');
  const [awardDate, setAwardDate] = useState(initialData?.awardDate || '');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setAgency(initialData.agency);
      setAwardNumber(initialData.awardNumber || '');
      setPrincipalInvestigatorId(initialData.principalInvestigatorId);
      setCoPiIds(initialData.coPiIds || []);
      setAmount(initialData.amount ?? '');
      setStartDate(initialData.startDate);
      setEndDate(initialData.endDate || '');
      setStatus(initialData.status);
      setSelectedProjectIds(initialData.projectIds || []);
      setDescription(initialData.description || '');
      setProposalDueDate(initialData.proposalDueDate || '');
      setAwardDate(initialData.awardDate || '');
    } else {
      // Reset for new entry
      setTitle('');
      setAgency('');
      setAwardNumber('');
      setPrincipalInvestigatorId('');
      setCoPiIds([]);
      setAmount('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setStatus(GrantStatus.PENDING);
      setSelectedProjectIds([]);
      setDescription('');
      setProposalDueDate('');
      setAwardDate('');
    }
  }, [initialData]);

  const handleMultiSelectChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter(prev => prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '') {
        alert("Amount cannot be empty."); // Or handle more gracefully
        return;
    }
    const grantData: Grant = {
      id: initialData?.id || Date.now().toString(),
      title,
      agency,
      awardNumber: awardNumber || undefined,
      principalInvestigatorId,
      coPiIds: coPiIds.length > 0 ? coPiIds : undefined,
      amount: Number(amount),
      startDate,
      endDate,
      status,
      projectIds: selectedProjectIds.length > 0 ? selectedProjectIds : undefined,
      description: description || undefined,
      proposalDueDate: proposalDueDate || undefined,
      awardDate: awardDate || undefined,
    };
    onSubmit(grantData);
  };

  const sortedResearchers = [...researchers].sort((a,b) => a.name.localeCompare(b.name));
  const sortedProjects = [...projects].sort((a,b) => a.name.localeCompare(b.name));


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="grantTitle" className="block text-sm font-medium text-gray-700">Grant Title</label>
        <input type="text" id="grantTitle" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="grantAgency" className="block text-sm font-medium text-gray-700">Funding Agency</label>
          <input type="text" id="grantAgency" value={agency} onChange={(e) => setAgency(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="grantAwardNumber" className="block text-sm font-medium text-gray-700">Award Number (Optional)</label>
          <input type="text" id="grantAwardNumber" value={awardNumber} onChange={(e) => setAwardNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
      </div>

      <div>
        <label htmlFor="grantPI" className="block text-sm font-medium text-gray-700">Principal Investigator (PI)</label>
        <select 
          id="grantPI" 
          value={principalInvestigatorId} 
          onChange={(e) => setPrincipalInvestigatorId(e.target.value)} 
          required 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">-- Select PI --</option>
          {sortedResearchers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Co-Principal Investigators (Co-PIs) (Optional)</label>
        <div className="mt-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
          {sortedResearchers.filter(r => r.id !== principalInvestigatorId).length === 0 && <p className="text-xs text-gray-500">No other researchers available or PI not selected.</p>}
          {sortedResearchers.filter(r => r.id !== principalInvestigatorId).map(r => (
            <div key={`copi-${r.id}`} className="flex items-center">
              <input id={`copi-${r.id}`} type="checkbox" checked={coPiIds.includes(r.id)} onChange={() => handleMultiSelectChange(setCoPiIds, r.id)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
              <label htmlFor={`copi-${r.id}`} className="ml-2 text-sm text-gray-700">{r.name}</label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="grantAmount" className="block text-sm font-medium text-gray-700">Amount (USD)</label>
          <input type="number" id="grantAmount" value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} required min="0" step="any" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="grantStatus" className="block text-sm font-medium text-gray-700">Status</label>
          <select 
            id="grantStatus" 
            value={status} 
            onChange={(e) => setStatus(e.target.value as GrantStatus)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {GRANT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="grantStartDate" className="block text-sm font-medium text-gray-700">Start Date</label>
            <input type="date" id="grantStartDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
        <div>
            <label htmlFor="grantEndDate" className="block text-sm font-medium text-gray-700">End Date</label>
            <input type="date" id="grantEndDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="grantProposalDueDate" className="block text-sm font-medium text-gray-700">Proposal Due Date (Optional)</label>
            <input type="date" id="grantProposalDueDate" value={proposalDueDate} onChange={(e) => setProposalDueDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
        <div>
            <label htmlFor="grantAwardDate" className="block text-sm font-medium text-gray-700">Award Date (Optional)</label>
            <input type="date" id="grantAwardDate" value={awardDate} onChange={(e) => setAwardDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Associated Projects (Optional)</label>
        <div className="mt-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
          {sortedProjects.length === 0 && <p className="text-xs text-gray-500">No projects available.</p>}
          {sortedProjects.map(p => (
            <div key={`project-${p.id}`} className="flex items-center">
              <input id={`project-${p.id}`} type="checkbox" checked={selectedProjectIds.includes(p.id)} onChange={() => handleMultiSelectChange(setSelectedProjectIds, p.id)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
              <label htmlFor={`project-${p.id}`} className="ml-2 text-sm text-gray-700">{p.name}</label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="grantDescription" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
        <textarea id="grantDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{initialData ? 'Save Changes' : 'Add Grant'}</button>
      </div>
    </form>
  );
};

export default GrantForm;
