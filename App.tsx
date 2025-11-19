
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Researcher, Lab, Project, ComputeResource, Note, ComputeResourceType, ApplicationData, Grant, GrantStatus } from './types';
import Layout from './components/Layout';
import DashboardPage from './components/pages/DashboardPage';
import ResearchersPage from './components/pages/ResearchersPage';
import LabsPage from './components/pages/LabsPage';
import ProjectsPage from './components/pages/ProjectsPage';
import ComputeResourcesPage from './components/pages/ComputeResourcesPage';
import GlobalSearchPage from './components/pages/GlobalSearchPage';
import GrantsPage from './components/pages/GrantsPage'; // Import new GrantsPage

// Initial data to be used if localStorage is empty
const initialResearchersData: Researcher[] = [
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
    profileUrl: '', 
    notes: [] 
  },
];
const initialLabsData: Lab[] = [
  { id: 'l1', name: 'AI & ML Research Lab', principalInvestigatorId: 'r1', description: 'Focuses on cutting-edge AI research.', projectIds: ['p1'] },
  { id: 'l2', name: 'Sustainable Engineering Solutions Lab', principalInvestigatorId: 'r2', description: 'Developing green tech for the future.', projectIds: ['p2'] },
];
const initialProjectsData: Project[] = [
  { id: 'p1', name: 'Project Phoenix: Next-Gen AI', description: 'Developing advanced AI models.', leadResearcherId: 'r1', labIds: ['l1'], computeResourceIds: ['cr1'], startDate: '2023-01-15', grantIds: ['g1'] },
  { id: 'p2', name: 'EcoStructures Initiative', description: 'Research into sustainable building materials.', leadResearcherId: 'r2', labIds: ['l2'], computeResourceIds: ['cr2'], startDate: '2023-03-01', endDate: '2024-08-30' },
  { id: 'p3', name: 'Quantum Entanglement Studies', description: 'Exploring quantum phenomena.', leadResearcherId: 'r3', startDate: '2024-02-20' },
];
const initialComputeResourcesData: ComputeResource[] = [
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

const initialGrantsData: Grant[] = [
  {
    id: 'g1',
    title: 'NSF CAREER: Advancing AI for Scientific Discovery',
    agency: 'National Science Foundation',
    awardNumber: 'NSF-2300001',
    principalInvestigatorId: 'r1',
    coPiIds: ['r2'],
    amount: 750000,
    startDate: '2023-09-01',
    endDate: '2028-08-31',
    status: GrantStatus.ACTIVE,
    projectIds: ['p1'],
    description: 'A 5-year project to develop novel AI algorithms for accelerating discovery in materials science.',
    awardDate: '2023-07-15',
  },
  {
    id: 'g2',
    title: 'DOE Grant for Quantum Computing Research',
    agency: 'Department of Energy',
    awardNumber: 'DOE-QC-005',
    principalInvestigatorId: 'r3',
    amount: 1200000,
    startDate: '2024-01-01',
    endDate: '2027-12-31',
    status: GrantStatus.AWARDED,
    projectIds: ['p3'],
    description: 'Exploring new quantum algorithms and their applications.',
    proposalDueDate: '2023-06-01',
    awardDate: '2023-11-01',
  },
   {
    id: 'g3',
    title: 'NIH Research Grant on Cellular Biology',
    agency: 'National Institutes of Health',
    awardNumber: 'NIH-CB-001',
    principalInvestigatorId: 'r1', // Alice is also PI on this
    amount: 450000,
    startDate: '2022-06-01',
    endDate: '2025-05-31',
    status: GrantStatus.ACTIVE,
    projectIds: [], // Not yet linked to a specific project in this dataset
    description: 'Investigating cellular mechanisms in response to external stimuli.',
    awardDate: '2022-04-10',
  },
];


const App: React.FC = () => {
  const [researchers, setResearchers] = useState<Researcher[]>(() => {
    const saved = localStorage.getItem('researchers');
    return saved ? JSON.parse(saved) : initialResearchersData;
  });
  const [labs, setLabs] = useState<Lab[]>(() => {
    const saved = localStorage.getItem('labs');
    return saved ? JSON.parse(saved) : initialLabsData;
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('projects');
    return saved ? JSON.parse(saved) : initialProjectsData;
  });
  const [computeResources, setComputeResources] = useState<ComputeResource[]>(() => {
    const saved = localStorage.getItem('computeResources');
    return saved ? JSON.parse(saved) : initialComputeResourcesData;
  });
  const [grants, setGrants] = useState<Grant[]>(() => {
    const saved = localStorage.getItem('grants');
    return saved ? JSON.parse(saved) : initialGrantsData;
  });


  useEffect(() => {
    localStorage.setItem('researchers', JSON.stringify(researchers));
  }, [researchers]);

  useEffect(() => {
    localStorage.setItem('labs', JSON.stringify(labs));
  }, [labs]);

  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('computeResources', JSON.stringify(computeResources));
  }, [computeResources]);

  useEffect(() => {
    localStorage.setItem('grants', JSON.stringify(grants));
  }, [grants]);


  // CRUD Operations
  const addResearcher = useCallback((researcher: Researcher) => {
    setResearchers(prev => [...prev, researcher]);
  }, []);

  const updateResearcher = useCallback((updatedResearcher: Researcher) => {
    setResearchers(prev => prev.map(r => r.id === updatedResearcher.id ? updatedResearcher : r));
  }, []);

  const deleteResearcher = useCallback((id: string) => {
    setResearchers(prev => prev.filter(r => r.id !== id));
    setLabs(prevLabs => prevLabs.map(lab => lab.principalInvestigatorId === id ? { ...lab, principalInvestigatorId: undefined } : lab));
    setProjects(prevProjects => prevProjects.map(project => project.leadResearcherId === id ? { ...project, leadResearcherId: undefined } : project));
    // Unlink from grants
    setGrants(prevGrants => prevGrants.map(grant => {
        let updatedGrant = {...grant};
        if (grant.principalInvestigatorId === id) {
            updatedGrant.principalInvestigatorId = ''; // Or handle differently, e.g., prompt for new PI
        }
        if (grant.coPiIds?.includes(id)) {
            updatedGrant.coPiIds = grant.coPiIds.filter(coPiId => coPiId !== id);
        }
        return updatedGrant;
    }));
  }, []);

  const addLab = useCallback((lab: Lab) => {
    setLabs(prev => [...prev, lab]);
  }, []);

  const updateLab = useCallback((updatedLab: Lab) => {
    setLabs(prev => prev.map(l => l.id === updatedLab.id ? updatedLab : l));
  }, []);

  const deleteLab = useCallback((id: string) => {
    setLabs(prev => prev.filter(l => l.id !== id));
    setResearchers(prev => prev.map(r => r.labId === id ? {...r, labId: undefined} : r));
    setProjects(prev => prev.map(p => ({...p, labIds: p.labIds?.filter(labId => labId !== id)})));
  }, []);

  const addProject = useCallback((project: Project) => {
    setProjects(prev => [...prev, project]);
  }, []);

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setLabs(prev => prev.map(l => ({...l, projectIds: l.projectIds?.filter(projId => projId !== id)})));
    setComputeResources(prev => prev.map(cr => ({...cr, projectIds: cr.projectIds?.filter(projId => projId !== id)})));
    // Unlink from grants
    setGrants(prevGrants => prevGrants.map(grant => {
        if (grant.projectIds?.includes(id)) {
            return { ...grant, projectIds: grant.projectIds.filter(projId => projId !== id) };
        }
        return grant;
    }));
  }, []);

  const addComputeResource = useCallback((resource: ComputeResource) => {
    setComputeResources(prev => [...prev, resource]);
  }, []);

  const updateComputeResource = useCallback((updatedResource: ComputeResource) => {
    setComputeResources(prev => prev.map(cr => cr.id === updatedResource.id ? updatedResource : cr));
  }, []);

  const deleteComputeResource = useCallback((id: string) => {
    setComputeResources(prev => prev.filter(cr => cr.id !== id));
    setProjects(prev => prev.map(p => ({...p, computeResourceIds: p.computeResourceIds?.filter(resId => resId !== id)})));
  }, []);

  // Grant CRUD
  const addGrant = useCallback((grant: Grant) => {
    setGrants(prev => [...prev, grant]);
  }, []);

  const updateGrant = useCallback((updatedGrant: Grant) => {
    setGrants(prev => prev.map(g => g.id === updatedGrant.id ? updatedGrant : g));
  }, []);

  const deleteGrant = useCallback((id: string) => {
    setGrants(prev => prev.filter(g => g.id !== id));
    // Unlink from projects
    setProjects(prevProjects => prevProjects.map(project => {
      if (project.grantIds?.includes(id)) {
        return { ...project, grantIds: project.grantIds.filter(grantId => grantId !== id) };
      }
      return project;
    }));
  }, []);


  const addNoteToResearcher = useCallback((researcherId: string, content: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      researcherId,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setResearchers(prevResearchers =>
      prevResearchers.map(r => {
        if (r.id === researcherId) {
          return { ...r, notes: [...(r.notes || []), newNote] };
        }
        return r;
      })
    );
  }, []);
  
  const updateNoteForResearcher = useCallback((researcherId: string, updatedNote: Note) => {
    setResearchers(prevResearchers =>
      prevResearchers.map(r => {
        if (r.id === researcherId) {
          return { ...r, notes: (r.notes || []).map(n => n.id === updatedNote.id ? updatedNote : n) };
        }
        return r;
      })
    );
  }, []);

  const deleteNoteForResearcher = useCallback((researcherId: string, noteId: string) => {
    setResearchers(prevResearchers =>
      prevResearchers.map(r => {
        if (r.id === researcherId) {
          return { ...r, notes: (r.notes || []).filter(n => n.id !== noteId) };
        }
        return r;
      })
    );
  }, []);

  const handleExportData = useCallback(() => {
    const dataToExport: ApplicationData = {
      researchers,
      labs,
      projects,
      computeResources,
      grants, // Added grants
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ucr_research_dashboard_data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [researchers, labs, projects, computeResources, grants]);

  const handleImportData = useCallback((jsonString: string): boolean => {
    try {
      const importedData = JSON.parse(jsonString) as Partial<ApplicationData>; 
      
      if (
        !importedData ||
        (importedData.researchers !== undefined && !Array.isArray(importedData.researchers)) ||
        (importedData.labs !== undefined && !Array.isArray(importedData.labs)) ||
        (importedData.projects !== undefined && !Array.isArray(importedData.projects)) ||
        (importedData.computeResources !== undefined && !Array.isArray(importedData.computeResources)) ||
        (importedData.grants !== undefined && !Array.isArray(importedData.grants))
      ) {
        console.error("Invalid data structure in imported file. One or more expected arrays are missing or not arrays.");
        alert("Error: Invalid data structure in imported file. Please ensure it's a valid export with correct array structures.");
        return false;
      }

      setResearchers(importedData.researchers || initialResearchersData);
      setLabs(importedData.labs || initialLabsData);
      setProjects(importedData.projects || initialProjectsData);
      setComputeResources(importedData.computeResources || initialComputeResourcesData);
      setGrants(importedData.grants || initialGrantsData); 
      
      alert("Data imported successfully!");
      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      alert("Error importing data. Please ensure the file is a valid JSON export and not corrupted.");
      return false;
    }
  }, []);


  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout onExportData={handleExportData} onImportData={handleImportData} />}>
          <Route index element={<DashboardPage researchers={researchers} labs={labs} projects={projects} computeResources={computeResources} grants={grants}/>} />
          <Route 
            path="researchers" 
            element={<ResearchersPage 
                        researchers={researchers} 
                        labs={labs} 
                        grants={grants}
                        projects={projects} // Pass projects
                        onAddResearcher={addResearcher} 
                        onUpdateResearcher={updateResearcher} 
                        onDeleteResearcher={deleteResearcher}
                        onAddNote={addNoteToResearcher}
                        onUpdateNote={updateNoteForResearcher}
                        onDeleteNote={deleteNoteForResearcher}
                        />} 
            />
          <Route 
            path="labs" 
            element={<LabsPage 
                        labs={labs} 
                        researchers={researchers} 
                        projects={projects}
                        onAddLab={addLab} 
                        onUpdateLab={updateLab} 
                        onDeleteLab={deleteLab} />} 
            />
          <Route 
            path="projects" 
            element={<ProjectsPage 
                        projects={projects} 
                        researchers={researchers} 
                        labs={labs} 
                        computeResources={computeResources}
                        grants={grants} // Pass grants
                        onAddProject={addProject} 
                        onUpdateProject={updateProject} 
                        onDeleteProject={deleteProject} />} 
            />
           <Route 
            path="grants" 
            element={<GrantsPage 
                        grants={grants} // Pass the main grants list
                        researchers={researchers}
                        projects={projects}
                        labs={labs} 
                        onAddGrant={addGrant} // Pass the addGrant callback
                        onUpdateGrant={updateGrant}
                        onDeleteGrant={deleteGrant} 
                        />} 
            />
          <Route 
            path="compute" 
            element={<ComputeResourcesPage 
                        computeResources={computeResources} 
                        projects={projects}
                        onAddResource={addComputeResource} 
                        onUpdateResource={updateComputeResource} 
                        onDeleteResource={deleteComputeResource}/>} 
            />
          <Route
            path="search"
            element={<GlobalSearchPage 
                        researchers={researchers}
                        labs={labs}
                        projects={projects}
                        computeResources={computeResources}
                        grants={grants} // Pass grants
                        />}
            />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
