
import { NavItem, ComputeResourceType, GrantStatus } from './types';
import { UserIcon, BeakerIcon, ClipboardDocumentListIcon, ServerStackIcon, HomeIcon, MagnifyingGlassIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export const APP_TITLE = "UCR Research Dashboard";
export const GEMINI_TEXT_MODEL = "gemini-2.5-flash-preview-04-17";

export const NAVIGATION_ITEMS: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: HomeIcon },
  { name: 'Researchers', path: '/researchers', icon: UserIcon },
  { name: 'Labs', path: '/labs', icon: BeakerIcon },
  { name: 'Projects', path: '/projects', icon: ClipboardDocumentListIcon },
  { name: 'Grants', path: '/grants', icon: CurrencyDollarIcon },
  { name: 'Compute', path: '/compute', icon: ServerStackIcon },
  { name: 'Global Search', path: '/search', icon: MagnifyingGlassIcon },
];

export const COMPUTE_RESOURCE_TYPES: ComputeResourceType[] = [
  ComputeResourceType.CLUSTER,
  ComputeResourceType.HIGH_END_WORKSTATION,
  ComputeResourceType.CLOUD_VM,
];

export const GRANT_STATUSES: GrantStatus[] = [
  GrantStatus.PENDING,
  GrantStatus.SUBMITTED,
  GrantStatus.AWARDED,
  GrantStatus.ACTIVE,
  GrantStatus.CLOSED,
  GrantStatus.NOT_FUNDED,
];


export const DEFAULT_NOTE_ANALYSIS = {
  sentiment: 'Unknown' as 'Unknown',
  keyThemes: [],
};