
import React, { useState, useEffect } from 'react';
import { Project, Researcher, Lab, ComputeResource, Grant } from '../../types'; // Added Grant

interface ProjectFormProps {
  onSubmit: (project: Project) => void;
  onCancel: () => void;
  researchers: Researcher[];
  labs: Lab[];
  computeResources: ComputeResource[];
  grants: Grant[]; // Added grants
  initialData?: Project;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, onCancel, researchers, labs, computeResources, grants, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [leadResearcherId, setLeadResearcherId] = useState(initialData?.leadResearcherId || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [selectedLabIds, setSelectedLabIds] = useState<string[]>(initialData?.labIds || []);
  const [selectedComputeResourceIds, setSelectedComputeResourceIds] = useState<string[]>(initialData?.computeResourceIds || []);
  const [selectedGrantIds, setSelectedGrantIds] = useState<string[]>(initialData?.grantIds || []); // Added grantIds

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setLeadResearcherId(initialData.leadResearcherId || '');
      setStartDate(initialData.startDate);
      setEndDate(initialData.endDate || '');
      setSelectedLabIds(initialData.labIds || []);
      setSelectedComputeResourceIds(initialData.computeResourceIds || []);
      setSelectedGrantIds(initialData.grantIds || []); // Set initial grantIds
    } else {
        setName('');
        setDescription('');
        setLeadResearcherId('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate('');
        setSelectedLabIds([]);
        setSelectedComputeResourceIds([]);
        setSelectedGrantIds([]);
    }
  }, [initialData]);

  const handleSelection = (id: string, currentList: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const projectData: Project = {
      id: initialData?.id || Date.now().toString(),
      name,
      description,
      leadResearcherId: leadResearcherId || undefined,
      startDate,
      endDate: endDate || undefined,
      labIds: selectedLabIds,
      computeResourceIds: selectedComputeResourceIds,
      grantIds: selectedGrantIds.length > 0 ? selectedGrantIds : undefined, // Add grantIds
    };
    onSubmit(projectData);
  };

  const sortedResearchers = [...researchers].sort((a, b) => a.name.localeCompare(b.name));
  const sortedLabs = [...labs].sort((a, b) => a.name.localeCompare(b.name));
  const sortedComputeResources = [...computeResources].sort((a, b) => a.name.localeCompare(b.name));
  const sortedGrants = [...grants].sort((a,b) => a.title.localeCompare(b.title));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">Project Name</label>
        <input type="text" id="projectName" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea id="projectDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="projectLead" className="block text-sm font-medium text-gray-700">Lead Researcher (Optional)</label>
        <select 
          id="projectLead" 
          value={leadResearcherId} 
          onChange={(e) => setLeadResearcherId(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">-- Select Lead Researcher --</option>
          {sortedResearchers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="projectStartDate" className="block text-sm font-medium text-gray-700">Start Date</label>
            <input type="date" id="projectStartDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
        <div>
            <label htmlFor="projectEndDate" className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
            <input type="date" id="projectEndDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Assign Labs (Optional)</label>
        <div className="mt-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
          {sortedLabs.length === 0 && <p className="text-xs text-gray-500">No labs available.</p>}
          {sortedLabs.map(lab => (
            <div key={lab.id} className="flex items-center">
              <input id={`lab-${lab.id}`} type="checkbox" checked={selectedLabIds.includes(lab.id)} onChange={() => handleSelection(lab.id, selectedLabIds, setSelectedLabIds)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
              <label htmlFor={`lab-${lab.id}`} className="ml-2 text-sm text-gray-700">{lab.name}</label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Assign Compute Resources (Optional)</label>
        <div className="mt-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
          {sortedComputeResources.length === 0 && <p className="text-xs text-gray-500">No compute resources available.</p>}
          {sortedComputeResources.map(cr => (
            <div key={cr.id} className="flex items-center">
              <input id={`cr-${cr.id}`} type="checkbox" checked={selectedComputeResourceIds.includes(cr.id)} onChange={() => handleSelection(cr.id, selectedComputeResourceIds, setSelectedComputeResourceIds)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
              <label htmlFor={`cr-${cr.id}`} className="ml-2 text-sm text-gray-700">{cr.name} ({cr.type})</label>
            </div>
          ))}
        </div>
      </div>
      {/* Assign Grants Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Assign Grants (Optional)</label>
        <div className="mt-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
          {sortedGrants.length === 0 && <p className="text-xs text-gray-500">No grants available.</p>}
          {sortedGrants.map(grant => (
            <div key={`grant-${grant.id}`} className="flex items-center">
              <input id={`grant-${grant.id}`} type="checkbox" checked={selectedGrantIds.includes(grant.id)} onChange={() => handleSelection(grant.id, selectedGrantIds, setSelectedGrantIds)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
              <label htmlFor={`grant-${grant.id}`} className="ml-2 text-sm text-gray-700">{grant.title} ({grant.agency})</label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{initialData ? 'Save Changes' : 'Add Project'}</button>
      </div>
    </form>
  );
};

export default ProjectForm;
