
import React, { useState, useEffect } from 'react';
import { Lab, Researcher, Project } from '../../types';

interface LabFormProps {
  onSubmit: (lab: Lab) => void;
  onCancel: () => void;
  researchers: Researcher[];
  projects: Project[];
  initialData?: Lab;
}

const LabForm: React.FC<LabFormProps> = ({ onSubmit, onCancel, researchers, projects, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [principalInvestigatorId, setPrincipalInvestigatorId] = useState(initialData?.principalInvestigatorId || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(initialData?.projectIds || []);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPrincipalInvestigatorId(initialData.principalInvestigatorId || '');
      setDescription(initialData.description);
      setSelectedProjectIds(initialData.projectIds || []);
    } else {
      // Reset form for new entry
      setName('');
      setPrincipalInvestigatorId('');
      setDescription('');
      setSelectedProjectIds([]);
    }
  }, [initialData]);

  const handleProjectSelection = (projectId: string) => {
    setSelectedProjectIds(prev => 
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const labData: Lab = {
      id: initialData?.id || Date.now().toString(),
      name,
      principalInvestigatorId: principalInvestigatorId || undefined,
      description,
      projectIds: selectedProjectIds,
    };
    onSubmit(labData);
  };

  const sortedResearchers = [...researchers].sort((a, b) => a.name.localeCompare(b.name));
  const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="labName" className="block text-sm font-medium text-gray-700">Lab Name</label>
        <input type="text" id="labName" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="labPI" className="block text-sm font-medium text-gray-700">Principal Investigator (Optional)</label>
        <select 
          id="labPI" 
          value={principalInvestigatorId} 
          onChange={(e) => setPrincipalInvestigatorId(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">-- Select a PI --</option>
          {sortedResearchers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="labDescription" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea id="labDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
       <div>
        <label className="block text-sm font-medium text-gray-700">Assign Projects (Optional)</label>
        <div className="mt-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
          {sortedProjects.length === 0 && <p className="text-xs text-gray-500">No projects available.</p>}
          {sortedProjects.map(project => (
            <div key={project.id} className="flex items-center">
              <input
                id={`project-${project.id}`}
                type="checkbox"
                checked={selectedProjectIds.includes(project.id)}
                onChange={() => handleProjectSelection(project.id)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`project-${project.id}`} className="ml-2 text-sm text-gray-700">{project.name}</label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{initialData ? 'Save Changes' : 'Add Lab'}</button>
      </div>
    </form>
  );
};

export default LabForm;
