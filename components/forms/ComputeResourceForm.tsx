
import React, { useState, useEffect } from 'react';
import { ComputeResource, ComputeResourceType, Project } from '../../types';
import { COMPUTE_RESOURCE_TYPES } from '../../constants';

interface ComputeResourceFormProps {
  onSubmit: (resource: ComputeResource) => void;
  onCancel: () => void;
  projects: Project[];
  initialData?: ComputeResource;
}

const ComputeResourceForm: React.FC<ComputeResourceFormProps> = ({ onSubmit, onCancel, projects, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<ComputeResourceType>(initialData?.type || ComputeResourceType.CLUSTER);
  const [specification, setSpecification] = useState(initialData?.specification || '');
  const [status, setStatus] = useState<'Available' | 'In Use' | 'Maintenance'>(initialData?.status || 'Available');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(initialData?.projectIds || []);

  // New fields
  const [clusterType, setClusterType] = useState(initialData?.clusterType || '');
  const [nodes, setNodes] = useState<number | undefined>(initialData?.nodes);
  const [cpus, setCpus] = useState<number | undefined>(initialData?.cpus);
  const [cpusPerNode, setCpusPerNode] = useState<number | undefined>(initialData?.cpusPerNode);
  const [nodeMemory, setNodeMemory] = useState(initialData?.nodeMemory || '');
  const [totalRam, setTotalRam] = useState(initialData?.totalRam || '');
  const [gpus, setGpus] = useState<number | undefined>(initialData?.gpus);
  const [gpusPerNode, setGpusPerNode] = useState<number | undefined>(initialData?.gpusPerNode);
  const [clusterName, setClusterName] = useState(initialData?.clusterName || '');
  const [totalCores, setTotalCores] = useState<number | undefined>(initialData?.totalCores);


  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setSpecification(initialData.specification);
      setStatus(initialData.status);
      setSelectedProjectIds(initialData.projectIds || []);
      // Set new fields from initialData
      setClusterType(initialData.clusterType || '');
      setNodes(initialData.nodes);
      setCpus(initialData.cpus);
      setCpusPerNode(initialData.cpusPerNode);
      setNodeMemory(initialData.nodeMemory || '');
      setTotalRam(initialData.totalRam || '');
      setGpus(initialData.gpus);
      setGpusPerNode(initialData.gpusPerNode);
      setClusterName(initialData.clusterName || '');
      setTotalCores(initialData.totalCores);
    } else {
        // Reset form for new entry
        setName('');
        setType(ComputeResourceType.CLUSTER);
        setSpecification('');
        setStatus('Available');
        setSelectedProjectIds([]);
        setClusterType('');
        setNodes(undefined);
        setCpus(undefined);
        setCpusPerNode(undefined);
        setNodeMemory('');
        setTotalRam('');
        setGpus(undefined);
        setGpusPerNode(undefined);
        setClusterName('');
        setTotalCores(undefined);
    }
  }, [initialData]);

  const handleProjectSelection = (projectId: string) => {
    setSelectedProjectIds(prev => 
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resourceData: ComputeResource = {
      id: initialData?.id || Date.now().toString(),
      name,
      type,
      specification,
      status,
      projectIds: selectedProjectIds,
      clusterType: clusterType || undefined,
      nodes: nodes,
      cpus: cpus,
      cpusPerNode: cpusPerNode,
      nodeMemory: nodeMemory || undefined,
      totalRam: totalRam || undefined,
      gpus: gpus,
      gpusPerNode: gpusPerNode,
      clusterName: clusterName || undefined,
      totalCores: totalCores,
    };
    onSubmit(resourceData);
  };
  
  const handleNumberInputChange = (setter: React.Dispatch<React.SetStateAction<number | undefined>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setter(value === '' ? undefined : parseInt(value, 10));
  };

  const sortedProjects = [...projects].sort((a,b) => a.name.localeCompare(b.name));


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="resourceName" className="block text-sm font-medium text-gray-700">Friendly Name</label>
          <input type="text" id="resourceName" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="resourceClusterName" className="block text-sm font-medium text-gray-700">Cluster Name (Official/Technical)</label>
          <input type="text" id="resourceClusterName" value={clusterName} onChange={(e) => setClusterName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="resourceType" className="block text-sm font-medium text-gray-700">Type</label>
          <select 
            id="resourceType" 
            value={type} 
            onChange={(e) => setType(e.target.value as ComputeResourceType)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {COMPUTE_RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
            <label htmlFor="resourceStatus" className="block text-sm font-medium text-gray-700">Status</label>
            <select 
              id="resourceStatus" 
              value={status} 
              onChange={(e) => setStatus(e.target.value as 'Available' | 'In Use' | 'Maintenance')} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="Available">Available</option>
              <option value="In Use">In Use</option>
              <option value="Maintenance">Maintenance</option>
            </select>
        </div>
      </div>
      
      {type === ComputeResourceType.CLUSTER && (
        <>
          <h3 className="text-md font-medium text-gray-700 pt-2 border-t mt-4">Cluster Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label htmlFor="clusterType" className="block text-sm font-medium text-gray-700">Cluster Type (e.g., HPC)</label>
                <input type="text" id="clusterType" value={clusterType} onChange={(e) => setClusterType(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
            </div>
            <div>
                <label htmlFor="nodes" className="block text-sm font-medium text-gray-700">Nodes</label>
                <input type="number" id="nodes" value={nodes === undefined ? '' : nodes} onChange={handleNumberInputChange(setNodes)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
            </div>
            <div>
                <label htmlFor="cpusPerNode" className="block text-sm font-medium text-gray-700">CPUs per Node</label>
                <input type="number" id="cpusPerNode" value={cpusPerNode === undefined ? '' : cpusPerNode} onChange={handleNumberInputChange(setCpusPerNode)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
            </div>
             <div>
                <label htmlFor="cpus" className="block text-sm font-medium text-gray-700">Total CPUs (Sockets)</label>
                <input type="number" id="cpus" value={cpus === undefined ? '' : cpus} onChange={handleNumberInputChange(setCpus)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
            </div>
            <div>
                <label htmlFor="totalCores" className="block text-sm font-medium text-gray-700">Total Cores</label>
                <input type="number" id="totalCores" value={totalCores === undefined ? '' : totalCores} onChange={handleNumberInputChange(setTotalCores)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
            </div>
            <div>
                <label htmlFor="nodeMemory" className="block text-sm font-medium text-gray-700">Node Memory (e.g., 256GB)</label>
                <input type="text" id="nodeMemory" value={nodeMemory} onChange={(e) => setNodeMemory(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
            </div>
            <div>
                <label htmlFor="totalRam" className="block text-sm font-medium text-gray-700">Total RAM (e.g., 64TB)</label>
                <input type="text" id="totalRam" value={totalRam} onChange={(e) => setTotalRam(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
            </div>
             <div>
                <label htmlFor="gpusPerNode" className="block text-sm font-medium text-gray-700">GPUs per Node</label>
                <input type="number" id="gpusPerNode" value={gpusPerNode === undefined ? '' : gpusPerNode} onChange={handleNumberInputChange(setGpusPerNode)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
            </div>
            <div>
                <label htmlFor="gpus" className="block text-sm font-medium text-gray-700">Total GPUs</label>
                <input type="number" id="gpus" value={gpus === undefined ? '' : gpus} onChange={handleNumberInputChange(setGpus)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
            </div>
          </div>
        </>
      )}
      
      {(type === ComputeResourceType.HIGH_END_WORKSTATION || type === ComputeResourceType.CLOUD_VM) && (
         <>
          <h3 className="text-md font-medium text-gray-700 pt-2 border-t mt-4">Resource Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                  <label htmlFor="totalCores" className="block text-sm font-medium text-gray-700">Total Cores</label>
                  <input type="number" id="totalCores" value={totalCores === undefined ? '' : totalCores} onChange={handleNumberInputChange(setTotalCores)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
            </div>
            <div>
                  <label htmlFor="totalRam" className="block text-sm font-medium text-gray-700">Total RAM (e.g., 128GB)</label>
                  <input type="text" id="totalRam" value={totalRam} onChange={(e) => setTotalRam(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
            </div>
             <div>
                  <label htmlFor="gpus" className="block text-sm font-medium text-gray-700">Total GPUs</label>
                  <input type="number" id="gpus" value={gpus === undefined ? '' : gpus} onChange={handleNumberInputChange(setGpus)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
            </div>
          </div>
         </>
      )}


      <div>
        <label htmlFor="resourceSpec" className="block text-sm font-medium text-gray-700">General Specification (Text)</label>
        <textarea id="resourceSpec" value={specification} onChange={(e) => setSpecification(e.target.value)} rows={2} placeholder="Brief summary or additional details" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Assign Projects (Optional)</label>
        <div className="mt-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
          {sortedProjects.length === 0 && <p className="text-xs text-gray-500">No projects available.</p>}
          {sortedProjects.map(project => (
            <div key={project.id} className="flex items-center">
              <input
                id={`cr-project-${project.id}`}
                type="checkbox"
                checked={selectedProjectIds.includes(project.id)}
                onChange={() => handleProjectSelection(project.id)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`cr-project-${project.id}`} className="ml-2 text-sm text-gray-700">{project.name}</label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{initialData ? 'Save Changes' : 'Add Resource'}</button>
      </div>
    </form>
  );
};

export default ComputeResourceForm;
