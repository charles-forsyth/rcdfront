
export interface Researcher {
  id: string;
  name: string; // Full name, e.g., "Nael Abu-Ghazaleh"
  firstName?: string;
  lastName?: string;
  netId?: string;
  title?: string;
  email: string;
  employeeId?: string;
  ucrCid?: string;
  org?: string;
  div?: string;
  department: string; // Existing, maps to "Department" from prompt
  research?: string; // Changed from researchInterests
  profileUrl?: string;
  labId?: string;
  notes?: Note[];
}

export interface Lab {
  id: string;
  name: string;
  principalInvestigatorId?: string;
  description: string;
  projectIds?: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  leadResearcherId?: string;
  labIds?: string[];
  computeResourceIds?: string[];
  startDate: string;
  endDate?: string;
  grantIds?: string[]; // Added to link projects to grants
}

export enum ComputeResourceType {
  CLUSTER = "Cluster",
  HIGH_END_WORKSTATION = "High-End Workstation",
  CLOUD_VM = "Cloud VM"
}

export interface ComputeResource {
  id:string;
  name: string; // Friendly name, e.g., "Olympus Cluster"
  type: ComputeResourceType;
  specification: string; // General text description, e.g., "32 Cores, 128GB RAM, 4x RTX 4090"
  status: "Available" | "In Use" | "Maintenance";
  projectIds?: string[];

  // New fields for detailed cluster specification
  clusterType?: string; // e.g., "HPC", "HTC", "Kubernetes"
  nodes?: number;
  cpus?: number; // Total CPU packages/sockets in the cluster
  cpusPerNode?: number;
  nodeMemory?: string; // e.g., "256GB", "512GB"
  totalRam?: string; // e.g., "64TB"
  gpus?: number; // Total GPUs in the cluster
  gpusPerNode?: number;
  clusterName?: string; // Official or technical name, if different from `name`
  totalCores?: number; // Total physical cores in the cluster
}

export interface Note {
  id: string;
  researcherId: string;
  content: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export enum GrantStatus {
  ACTIVE = "Active",
  PENDING = "Pending",
  AWARDED = "Awarded",
  CLOSED = "Closed",
  NOT_FUNDED = "Not Funded",
  SUBMITTED = "Submitted", // Adding a common early stage
}

export interface Grant {
  id: string;
  title: string;
  agency: string;
  awardNumber?: string; // Optional as it might not exist for pending/submitted
  principalInvestigatorId: string; // Link to Researcher.id
  coPiIds?: string[]; // Link to Researcher.id array
  amount: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  status: GrantStatus;
  projectIds?: string[]; // Link to Project.id array
  description?: string;
  proposalDueDate?: string; // Optional ISO date string
  awardDate?: string; // Optional ISO date string
}


export interface SearchResultItem {
  id: string;
  type: 'Researcher' | 'Lab' | 'Project' | 'ComputeResource' | 'Note' | 'Grant';
  name: string;
  matchContext: string; // snippet where match occurred
}

export interface NoteAnalysis {
  sentiment: 'Positive' | 'Negative' | 'Neutral' | 'Mixed' | 'Unknown';
  keyThemes: string[];
  summary?: string;
}

export type Entity = Researcher | Lab | Project | ComputeResource | Grant;
export type EntityType = 'researchers' | 'labs' | 'projects' | 'computeResources' | 'grants';

export interface NavItem {
  name: string;
  path: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
}

export interface ApplicationData {
  researchers: Researcher[];
  labs: Lab[];
  projects: Project[];
  computeResources: ComputeResource[];
  grants: Grant[];
}

// For AI Grant Search results
export interface PotentialGrant {
  id: string; // Internal client-side ID for selection management
  title: string;
  agency: string;
  awardNumber?: string; // Might be "TBD" or not applicable
  amount?: string | number; // e.g., "$100,000 - $500,000" or 250000
  submissionDate?: string; // e.g., "2024-12-01", "Rolling", "TBD"
  description: string;
}

// For AI Researcher Cross-Referencing results
export interface MatchedResearcher {
  name: string;
  research?: string; // Changed from researchInterests
  matchReason: string;
  originalId?: string; // To link back to the full researcher object
}
