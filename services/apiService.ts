
import { Researcher, Lab, Project, ComputeResource, Note, ComputeResourceType } from '../types';

// --- SIMULATED DATABASE STORE ---
// In a real backend, this would be an SQLite database.
// For simulation, we'll use in-memory arrays initialized with some data.

const initialResearchers: Researcher[] = [
  { 
    id: 'r1', 
    name: 'Dr. Alice Wonderland', 
    firstName: 'Alice',
    lastName: 'Wonderland',
    netId: 'alicew',
    title: 'Lead AI Researcher',
    email: 'alice.w@ucr.edu', 
    employeeId: 'E12345',
    ucrCid: 'UCR001',
    org: 'College of Engineering',
    div: 'CSE Department',
    department: 'Computer Science', 
    research: 'Artificial Intelligence, Machine Learning, Natural Language Processing', // Changed from researchInterests
    profileUrl: 'https://sample-ucr.edu/profiles/alicew',
    labId: 'l1', 
    notes: [
      {id: 'n1_1', researcherId: 'r1', content: 'Met with Alice to discuss new AI project proposal. Seems promising.', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()},
      {id: 'n1_2', researcherId: 'r1', content: 'Followed up on GPU requirements for the project.', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString()},
  ]},
  { 
    id: 'r2', 
    name: 'Dr. Bob The Builder', 
    firstName: 'Bob',
    lastName: 'Builder',
    netId: 'bobb',
    title: 'Senior Engineer',
    email: 'bob.b@ucr.edu', 
    employeeId: 'E67890',
    ucrCid: 'UCR002',
    org: 'College of Engineering',
    div: 'MAE Department',
    department: 'Engineering', 
    research: 'Sustainable Materials, Structural Engineering', // Changed from researchInterests
    profileUrl: 'https://sample-ucr.edu/profiles/bobb',
    labId: 'l2', 
    notes: [] 
  },
  { 
    id: 'r3', 
    name: 'Dr. Carol Danvers', 
    firstName: 'Carol',
    lastName: 'Danvers',
    netId: 'carold',
    title: 'Professor of Physics',
    email: 'carol.d@ucr.edu', 
    employeeId: 'E11223',
    ucrCid: 'UCR003',
    org: 'College of Natural and Agricultural Sciences',
    div: 'Physics Department',
    department: 'Physics', 
    research: 'Quantum Mechanics, Astrophysics', // Changed from researchInterests
    profileUrl: undefined, 
    notes: [] 
  },
];
const initialLabs: Lab[] = [
  { id: 'l1', name: 'AI & ML Research Lab', principalInvestigatorId: 'r1', description: 'Focuses on cutting-edge AI research.', projectIds: ['p1'] },
  { id: 'l2', name: 'Sustainable Engineering Solutions Lab', principalInvestigatorId: 'r2', description: 'Developing green tech for the future.', projectIds: ['p2'] },
];
const initialProjects: Project[] = [
  { id: 'p1', name: 'Project Phoenix: Next-Gen AI', description: 'Developing advanced AI models.', leadResearcherId: 'r1', labIds: ['l1'], computeResourceIds: ['cr1'], startDate: '2023-01-15' },
  { id: 'p2', name: 'EcoStructures Initiative', description: 'Research into sustainable building materials.', leadResearcherId: 'r2', labIds: ['l2'], computeResourceIds: ['cr2'], startDate: '2023-03-01', endDate: '2024-08-30' },
  { id: 'p3', name: 'Quantum Entanglement Studies', description: 'Exploring quantum phenomena.', leadResearcherId: 'r3', startDate: '2024-02-20' },
];
const initialComputeResources: ComputeResource[] = [
  { 
    id: 'cr1', 
    name: 'Olympus Cluster', 
    type: ComputeResourceType.CLUSTER, 
    specification: 'High-performance computing cluster with 256 nodes and 1024 NVIDIA A100 GPUs.', 
    status: 'Available', 
    projectIds: ['p1'],
    clusterType: 'HPC',
    nodes: 256,
    cpus: 512, 
    cpusPerNode: 2,
    nodeMemory: "512GB",
    totalRam: "128TB",
    gpus: 1024,
    gpusPerNode: 4,
    clusterName: "ucr-hpc-olympus",
    totalCores: 16384 
  },
  { 
    id: 'cr2', 
    name: 'Titan Workstation', 
    type: ComputeResourceType.HIGH_END_WORKSTATION, 
    specification: '128 Core CPU, 512GB RAM, 4x RTX A6000', 
    status: 'In Use', 
    projectIds:['p2'],
    clusterType: undefined, 
    nodes: undefined,
    cpus: 1,
    cpusPerNode: undefined,
    nodeMemory: "512GB",
    totalRam: "512GB",
    gpus: 4,
    gpusPerNode: undefined,
    clusterName: undefined,
    totalCores: 128
  },
];

// Define a type for the internal DB structure where notes are always an array
type DBResearcher = Omit<Researcher, 'notes'> & { notes: Note[] };

let db = {
  researchers: [...initialResearchers.map(r => ({...r, notes: r.notes ? [...r.notes.map(n => ({...n}))] : [] }))] as DBResearcher[], 
  labs: [...initialLabs.map(l => ({...l}))],
  projects: [...initialProjects.map(p => ({...p}))],
  computeResources: [...initialComputeResources.map(cr => ({...cr}))], // Deep copy compute resources
};

const simulateDelay = (ms: number = Math.random() * 300 + 50) => new Promise(resolve => setTimeout(resolve, ms));

// --- Researchers API ---
export const fetchResearchers = async (): Promise<Researcher[]> => {
  await simulateDelay();
  // Return as Researcher[], notes can be optional as per the public type
  return db.researchers.map(r => ({ ...r, notes: r.notes.length > 0 ? [...r.notes.map(n => ({...n}))] : undefined }));
};

export const addResearcherAPI = async (researcherData: Omit<Researcher, 'id' | 'notes'>): Promise<Researcher> => {
  await simulateDelay();
  const newDbResearcher: DBResearcher = { 
    ...researcherData, 
    id: Date.now().toString(), 
    notes: [] 
  };
  db.researchers.push(newDbResearcher);
  // Return as Researcher type
  const returnResearcher: Researcher = {...newDbResearcher, notes: undefined }; // notes are empty, so represent as undefined per Researcher type
  return returnResearcher;
};

export const updateResearcherAPI = async (researcher: Researcher): Promise<Researcher> => {
  await simulateDelay();
  const { notes: inputNotes, ...restOfResearcher } = researcher;
  const newNotesArray = inputNotes ? inputNotes.map(n => ({ ...n })) : [];

  // Create an object that conforms to DBResearcher for storing in the internal db
  const updatedDbEntry: DBResearcher = {
    ...restOfResearcher,
    id: researcher.id, // Ensure id is part of restOfResearcher or explicitly added
    notes: newNotesArray,
  };

  db.researchers = db.researchers.map(r => (r.id === researcher.id ? updatedDbEntry : r));
  
  // Return as Researcher type
  // The 'researcher' object passed in already conforms to Researcher.
  // We just need to ensure the notes are correctly represented if they were modified.
  return { ...researcher, notes: newNotesArray.length > 0 ? newNotesArray : undefined }; 
};

export const deleteResearcherAPI = async (researcherId: string): Promise<{ id: string }> => {
  await simulateDelay();
  db.researchers = db.researchers.filter(r => r.id !== researcherId);
  db.labs = db.labs.map(lab => lab.principalInvestigatorId === researcherId ? { ...lab, principalInvestigatorId: undefined } : lab);
  db.projects = db.projects.map(project => project.leadResearcherId === researcherId ? { ...project, leadResearcherId: undefined } : project);
  return { id: researcherId };
};

// --- Labs API ---
export const fetchLabs = async (): Promise<Lab[]> => {
  await simulateDelay();
  return db.labs.map(l => ({...l}));
};

export const addLabAPI = async (labData: Omit<Lab, 'id'>): Promise<Lab> => {
  await simulateDelay();
  const newLab: Lab = { ...labData, id: Date.now().toString() };
  db.labs.push(newLab);
  return {...newLab};
};

export const updateLabAPI = async (lab: Lab): Promise<Lab> => {
  await simulateDelay();
  db.labs = db.labs.map(l => l.id === lab.id ? {...lab} : l);
  return {...lab};
};

export const deleteLabAPI = async (labId: string): Promise<{ id: string }> => {
  await simulateDelay();
  db.labs = db.labs.filter(l => l.id !== labId);
  db.researchers = db.researchers.map(r => r.labId === labId ? { ...r, labId: undefined } : r);
  db.projects = db.projects.map(p => ({ ...p, labIds: p.labIds?.filter(id => id !== labId) }));
  return { id: labId };
};

// --- Projects API ---
export const fetchProjects = async (): Promise<Project[]> => {
  await simulateDelay();
  return db.projects.map(p => ({...p}));
};

export const addProjectAPI = async (projectData: Omit<Project, 'id'>): Promise<Project> => {
  await simulateDelay();
  const newProject: Project = { ...projectData, id: Date.now().toString() };
  db.projects.push(newProject);
  return {...newProject};
};

export const updateProjectAPI = async (project: Project): Promise<Project> => {
  await simulateDelay();
  db.projects = db.projects.map(p => p.id === project.id ? {...project} : p);
  return {...project};
};

export const deleteProjectAPI = async (projectId: string): Promise<{ id: string }> => {
  await simulateDelay();
  db.projects = db.projects.filter(p => p.id !== projectId);
  db.labs = db.labs.map(l => ({ ...l, projectIds: l.projectIds?.filter(id => id !== projectId) }));
  db.computeResources = db.computeResources.map(cr => ({ ...cr, projectIds: cr.projectIds?.filter(id => id !== projectId) }));
  return { id: projectId };
};

// --- Compute Resources API ---
export const fetchComputeResources = async (): Promise<ComputeResource[]> => {
  await simulateDelay();
  return db.computeResources.map(cr => ({...cr})); // Return copies
};

export const addComputeResourceAPI = async (resourceData: Omit<ComputeResource, 'id'>): Promise<ComputeResource> => {
  await simulateDelay();
  // All properties from resourceData, including new ones, will be spread here
  const newResource: ComputeResource = { ...resourceData, id: Date.now().toString() };
  db.computeResources.push(newResource);
  return {...newResource}; // Return a copy
};

export const updateComputeResourceAPI = async (resource: ComputeResource): Promise<ComputeResource> => {
  await simulateDelay();
  // All properties from resource, including new ones, will be spread here
  db.computeResources = db.computeResources.map(cr => cr.id === resource.id ? {...resource} : cr);
  return {...resource}; // Return a copy
};

export const deleteComputeResourceAPI = async (resourceId: string): Promise<{ id: string }> => {
  await simulateDelay();
  db.computeResources = db.computeResources.filter(cr => cr.id !== resourceId);
  db.projects = db.projects.map(p => ({ ...p, computeResourceIds: p.computeResourceIds?.filter(id => id !== resourceId) }));
  return { id: resourceId };
};

// --- Notes API (as part of Researchers) ---
export const addNoteToResearcherAPI = async (researcherId: string, content: string): Promise<Note> => {
  await simulateDelay();
  const researcherIndex = db.researchers.findIndex(r => r.id === researcherId);
  if (researcherIndex === -1) throw new Error("Researcher not found");

  const newNote: Note = {
    id: Date.now().toString(),
    researcherId,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const researcher = db.researchers[researcherIndex];
  researcher.notes.push(newNote); // notes is always an array in DBResearcher
  return {...newNote};
};

export const updateNoteForResearcherAPI = async (researcherId: string, updatedNote: Note): Promise<Note> => {
  await simulateDelay();
  const researcherIndex = db.researchers.findIndex(r => r.id === researcherId);
  if (researcherIndex === -1) throw new Error("Researcher not found");
  
  const researcher = db.researchers[researcherIndex];
  const noteIndex = researcher.notes.findIndex(n => n.id === updatedNote.id);
  if (noteIndex === -1) throw new Error("Note not found");

  const finalUpdatedNote = { ...updatedNote, updatedAt: new Date().toISOString() };
  researcher.notes[noteIndex] = finalUpdatedNote;
  return {...finalUpdatedNote};
};

export const deleteNoteForResearcherAPI = async (researcherId: string, noteId: string): Promise<{ researcherId: string, noteId: string }> => {
  await simulateDelay();
  const researcherIndex = db.researchers.findIndex(r => r.id === researcherId);
  if (researcherIndex === -1) throw new Error("Researcher not found");

  const researcher = db.researchers[researcherIndex];
  researcher.notes = researcher.notes.filter(n => n.id !== noteId);
  return { researcherId, noteId };
};

// --- Helper to get all data for global search context ---
export const fetchAllDataForSearch = async (): Promise<{ researchers: Researcher[], labs: Lab[], projects: Project[], computeResources: ComputeResource[] }> => {
  await simulateDelay();
  return {
    // Ensure fetched researchers conform to Researcher interface (notes optional)
    researchers: db.researchers.map(r => ({ ...r, notes: r.notes.length > 0 ? [...r.notes.map(n => ({...n}))] : undefined })),
    labs: db.labs.map(l => ({...l})),
    projects: db.projects.map(p => ({...p})),
    computeResources: db.computeResources.map(cr => ({...cr})), // Return copies of compute resources
  };
};