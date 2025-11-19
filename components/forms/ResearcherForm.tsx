
import React, { useState, useEffect } from 'react';
import { Researcher, Lab, Note } from '../../types'; // Ensure Note is imported

interface ResearcherFormProps {
  onSubmit: (researcher: Omit<Researcher, 'id' | 'notes'> & { id?: string; notes?: Note[] }) => void;
  onCancel: () => void;
  labs: Lab[];
  initialData?: Researcher;
}

const ResearcherForm: React.FC<ResearcherFormProps> = ({ onSubmit, onCancel, labs, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [netId, setNetId] = useState(initialData?.netId || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [employeeId, setEmployeeId] = useState(initialData?.employeeId || '');
  const [ucrCid, setUcrCid] = useState(initialData?.ucrCid || '');
  const [org, setOrg] = useState(initialData?.org || '');
  const [div, setDiv] = useState(initialData?.div || '');
  const [department, setDepartment] = useState(initialData?.department || '');
  const [research, setResearch] = useState(initialData?.research || ''); // Changed from researchInterests
  const [profileUrl, setProfileUrl] = useState(initialData?.profileUrl || '');
  const [labId, setLabId] = useState(initialData?.labId || '');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setFirstName(initialData.firstName || '');
      setLastName(initialData.lastName || '');
      setNetId(initialData.netId || '');
      setTitle(initialData.title || '');
      setEmail(initialData.email);
      setEmployeeId(initialData.employeeId || '');
      setUcrCid(initialData.ucrCid || '');
      setOrg(initialData.org || '');
      setDiv(initialData.div || '');
      setDepartment(initialData.department);
      setResearch(initialData.research || ''); // Changed from researchInterests
      setProfileUrl(initialData.profileUrl || '');
      setLabId(initialData.labId || '');
    } else {
      // Reset form for new entry
      setName('');
      setFirstName('');
      setLastName('');
      setNetId('');
      setTitle('');
      setEmail('');
      setEmployeeId('');
      setUcrCid('');
      setOrg('');
      setDiv('');
      setDepartment('');
      setResearch(''); // Changed from researchInterests
      setProfileUrl('');
      setLabId('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const researcherData: Omit<Researcher, 'id' | 'notes'> & { id?: string; notes?: Note[] } = {
      name,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      netId: netId || undefined,
      title: title || undefined,
      email,
      employeeId: employeeId || undefined,
      ucrCid: ucrCid || undefined,
      org: org || undefined,
      div: div || undefined,
      department,
      research: research || undefined, // Changed from researchInterests
      profileUrl: profileUrl || undefined,
      labId: labId || undefined,
    };

    if (initialData && initialData.id) {
      researcherData.id = initialData.id;
      researcherData.notes = initialData.notes || []; // Pass existing notes for updates
    }
    // For new researchers, 'id' and 'notes' will be handled by the calling component (ResearchersPage)
    
    onSubmit(researcherData);
  };

  const sortedLabs = [...labs].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="researcherName" className="block text-sm font-medium text-gray-700">Full Name (e.g., Nael Abu-Ghazaleh)</label>
          <input type="text" id="researcherName" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
         <div>
          <label htmlFor="researcherEmail" className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" id="researcherEmail" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="researcherFirstName" className="block text-sm font-medium text-gray-700">First Name (Optional)</label>
          <input type="text" id="researcherFirstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="researcherLastName" className="block text-sm font-medium text-gray-700">Last Name (Optional)</label>
          <input type="text" id="researcherLastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="researcherNetId" className="block text-sm font-medium text-gray-700">NetID (Optional)</label>
          <input type="text" id="researcherNetId" value={netId} onChange={(e) => setNetId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="researcherTitle" className="block text-sm font-medium text-gray-700">Title (Optional)</label>
          <input type="text" id="researcherTitle" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="researcherEmployeeId" className="block text-sm font-medium text-gray-700">Employee ID (Optional)</label>
          <input type="text" id="researcherEmployeeId" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="researcherUcrCid" className="block text-sm font-medium text-gray-700">UCR CID (Optional)</label>
          <input type="text" id="researcherUcrCid" value={ucrCid} onChange={(e) => setUcrCid(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="researcherOrg" className="block text-sm font-medium text-gray-700">Organization (Org) (Optional)</label>
          <input type="text" id="researcherOrg" value={org} onChange={(e) => setOrg(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="researcherDiv" className="block text-sm font-medium text-gray-700">Division (Div) (Optional)</label>
          <input type="text" id="researcherDiv" value={div} onChange={(e) => setDiv(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
      </div>
      
      <div>
        <label htmlFor="researcherDepartment" className="block text-sm font-medium text-gray-700">Department</label>
        <input type="text" id="researcherDepartment" value={department} onChange={(e) => setDepartment(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      
      <div>
        <label htmlFor="researcherResearch" className="block text-sm font-medium text-gray-700">Research (Optional)</label>
        <textarea id="researcherResearch" value={research} onChange={(e) => setResearch(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>

      <div>
        <label htmlFor="researcherProfileUrl" className="block text-sm font-medium text-gray-700">Profile URL (Optional)</label>
        <input type="url" id="researcherProfileUrl" value={profileUrl} onChange={(e) => setProfileUrl(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      
      <div>
        <label htmlFor="researcherLab" className="block text-sm font-medium text-gray-700">Assign to Lab (Optional)</label>
        <select 
          id="researcherLab" 
          value={labId} 
          onChange={(e) => setLabId(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">-- Select a Lab --</option>
          {sortedLabs.map(lab => <option key={lab.id} value={lab.id}>{lab.name}</option>)}
        </select>
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{initialData ? 'Save Changes' : 'Add Researcher'}</button>
      </div>
    </form>
  );
};

export default ResearcherForm;
