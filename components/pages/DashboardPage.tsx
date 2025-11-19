
import React, { useEffect, useState, useCallback } from 'react';
import { Researcher, Lab, Project, ComputeResource, Note, Grant, GrantStatus } from '../../types'; // Added Grant
import { UserIcon, BeakerIcon, ClipboardDocumentListIcon, ServerStackIcon, ChatBubbleLeftEllipsisIcon, SparklesIcon, CurrencyDollarIcon, CalendarDaysIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'; // Added CurrencyDollarIcon, CalendarDaysIcon, ExclamationTriangleIcon
import { Link } from 'react-router-dom';
import { summarizeText } from '../../services/geminiService';
import LoadingSpinner from '../LoadingSpinner';
import UtilizationBar from '../UtilizationBar';

interface DashboardPageProps {
  researchers: Researcher[];
  labs: Lab[];
  projects: Project[];
  computeResources: ComputeResource[];
  grants: Grant[]; // Added grants
}

interface LatestSupportItem {
  researcher: Researcher;
  latestNote: Note;
  summary?: string;
  isLoadingSummary: boolean;
  error?: string;
}

const StatCard: React.FC<{ title: string; count: number; icon: React.ElementType; linkTo: string; color: string }> = ({ title, count, icon: Icon, linkTo, color }) => (
  <Link to={linkTo} className={`bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex items-center space-x-4 border-l-4 ${color}`}>
    <div className="p-3 bg-gray-100 rounded-full">
      <Icon className="w-8 h-8 text-gray-700" />
    </div>
    <div>
      <p className="text-3xl font-bold text-gray-800">{count}</p>
      <p className="text-gray-600">{title}</p>
    </div>
  </Link>
);

const calculateDaysRemaining = (endDateString: string): number => {
  const end = new Date(endDateString);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};


const DashboardPage: React.FC<DashboardPageProps> = ({ researchers, labs, projects, computeResources, grants }) => {
  const [latestSupportItems, setLatestSupportItems] = useState<LatestSupportItem[]>([]);

  const getNoteTimestamp = (note: Note) => new Date(note.updatedAt || note.createdAt).getTime();

  useEffect(() => {
    const fetchSummaries = async () => {
      const researchersWithNotes = researchers.filter(r => r.notes && r.notes.length > 0);
      
      const sortedResearchers = researchersWithNotes.map(r => {
        const sortedNotes = [...r.notes!].sort((a, b) => getNoteTimestamp(b) - getNoteTimestamp(a));
        return { researcher: r, latestNote: sortedNotes[0] };
      }).sort((a, b) => getNoteTimestamp(b.latestNote) - getNoteTimestamp(a.latestNote));

      const top3ResearchersWithLatestNote = sortedResearchers.slice(0, 3);

      const itemsToProcess: LatestSupportItem[] = top3ResearchersWithLatestNote.map(item => ({
        ...item,
        isLoadingSummary: true,
      }));
      setLatestSupportItems(itemsToProcess);

      for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i];
        try {
          const summary = await summarizeText(item.latestNote.content);
          setLatestSupportItems(prevItems => prevItems.map(psi => 
            psi.researcher.id === item.researcher.id ? { ...psi, summary, isLoadingSummary: false } : psi
          ));
        } catch (e) {
          console.error("Error summarizing note for dashboard:", e);
          setLatestSupportItems(prevItems => prevItems.map(psi => 
            psi.researcher.id === item.researcher.id ? { ...psi, error: "Could not load summary.", isLoadingSummary: false } : psi
          ));
        }
      }
    };

    if (process.env.API_KEY) { 
        fetchSummaries();
    } else {
        setLatestSupportItems(prev => prev.map(item => ({ ...item, isLoadingSummary: false, error: "API Key not configured."})))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [researchers]); 

  const recentProjects = projects.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 5);

  const topActiveProjects = projects
    .filter(p => p.leadResearcherId && p.computeResourceIds && p.computeResourceIds.length > 0)
    .sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()) 
    .slice(0, 3)
    .map(p => {
      const lead = researchers.find(r => r.id === p.leadResearcherId);
      const lab = lead?.labId ? labs.find(l => l.id === lead.labId) : undefined;
      const resource = computeResources.find(cr => cr.id === p.computeResourceIds![0]); 
      
      let projectUtilization = 0;
      let overallResourceUtilization = 0;

      if (resource) {
        switch (resource.status) {
          case 'Available':
            overallResourceUtilization = 5; 
            break;
          case 'Maintenance':
            overallResourceUtilization = 0; 
            break;
          case 'In Use':
            overallResourceUtilization = Math.min(95, 60 + (resource.projectIds?.length || 0) * 10);
            break;
          default:
            overallResourceUtilization = 0;
        }

        if (resource.projectIds?.includes(p.id)) {
            switch (resource.status) {
            case 'Available':
                projectUtilization = 15; 
                break;
            case 'Maintenance':
                projectUtilization = 0;
                break;
            case 'In Use':
                projectUtilization = 75; 
                break;
            default:
                projectUtilization = 0;
            }
        } else {
            projectUtilization = 0;
        }
      }

      return {
        project: p,
        leadResearcher: lead,
        lab,
        resource,
        projectUtilization,
        overallResourceUtilization
      };
    });

  const grantsEndingSoon = grants
    .filter(grant => {
      const daysLeft = calculateDaysRemaining(grant.endDate);
      return (grant.status === GrantStatus.ACTIVE || grant.status === GrantStatus.AWARDED) && daysLeft >= 0 && daysLeft <= 90;
    })
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 5); // Limit to top 5


  return (
    <div className="p-6 space-y-8">
      <h1 className="text-4xl font-bold text-gray-800">UCR Research Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Researchers" count={researchers.length} icon={UserIcon} linkTo="/researchers" color="border-blue-500" />
        <StatCard title="Labs" count={labs.length} icon={BeakerIcon} linkTo="/labs" color="border-green-500" />
        <StatCard title="Projects" count={projects.length} icon={ClipboardDocumentListIcon} linkTo="/projects" color="border-purple-500" />
        <StatCard title="Grants" count={grants.length} icon={CurrencyDollarIcon} linkTo="/grants" color="border-pink-500" />
        <StatCard title="Compute Resources" count={computeResources.length} icon={ServerStackIcon} linkTo="/compute" color="border-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Recent Projects</h2>
          {recentProjects.length > 0 ? (
            <ul className="space-y-3">
              {recentProjects.map(project => (
                <li key={project.id} className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                  <Link to={`/projects#${project.id}`} className="text-blue-600 hover:text-blue-800 font-medium">{project.name}</Link>
                  <p className="text-sm text-gray-500">Started: {new Date(project.startDate).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No projects yet.</p>
          )}
        </div>
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center">
            <ChatBubbleLeftEllipsisIcon className="w-7 h-7 mr-2 text-indigo-500" />
            Latest Support
          </h2>
          {latestSupportItems.length > 0 ? (
            <ul className="space-y-4">
              {latestSupportItems.map(item => (
                <li key={item.researcher.id} className="p-3 bg-indigo-50 rounded-md">
                  <Link to={`/researchers#${item.researcher.id}`} className="text-indigo-700 hover:text-indigo-900 font-semibold block">{item.researcher.name}</Link>
                  <p className="text-xs text-gray-500 mb-1">Latest Note: {new Date(item.latestNote.updatedAt || item.latestNote.createdAt).toLocaleDateString()}</p>
                  {item.isLoadingSummary && <LoadingSpinner size="sm" message="AI summarizing..." />}
                  {item.error && <p className="text-xs text-red-500">{item.error}</p>}
                  {item.summary && !item.isLoadingSummary && (
                    <p className="text-sm text-gray-600 italic">"{item.summary}"</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
             !process.env.API_KEY && latestSupportItems.every(item => item.error) ?
             <p className="text-gray-500 text-sm">AI summaries require API key configuration.</p> :
            <p className="text-gray-500">No recent support notes with AI summaries available.</p>
          )}
        </div>
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center">
            <CalendarDaysIcon className="w-7 h-7 mr-2 text-red-500" />
            Grants Ending Soon
          </h2>
          {grantsEndingSoon.length > 0 ? (
            <ul className="space-y-3">
              {grantsEndingSoon.map(grant => {
                const daysRemaining = calculateDaysRemaining(grant.endDate);
                const pi = researchers.find(r => r.id === grant.principalInvestigatorId);
                let urgencyColor = 'text-gray-600';
                if (daysRemaining <= 30) urgencyColor = 'text-red-600 font-semibold';
                else if (daysRemaining <= 60) urgencyColor = 'text-yellow-600 font-semibold';
                
                return (
                  <li key={grant.id} className="p-3 bg-red-50 rounded-md hover:bg-red-100 transition-colors">
                    <Link to={`/grants#${grant.id}`} className="text-red-700 hover:text-red-900 font-medium block">{grant.title}</Link>
                    {pi && <p className="text-xs text-gray-500">PI: {pi.name}</p>}
                    <p className={`text-sm ${urgencyColor}`}>
                      Ends: {new Date(grant.endDate).toLocaleDateString()} ({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left)
                      {daysRemaining <= 30 && <ExclamationTriangleIcon className="w-4 h-4 inline-block ml-1 text-red-500" />}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-500">No active or awarded grants are ending within the next 90 days.</p>
          )}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 mb-5 flex items-center">
            <SparklesIcon className="w-7 h-7 mr-2 text-teal-500" />
            Top Project Utilization
        </h2>
        {topActiveProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {topActiveProjects.map(item => (
                    <div key={item.project.id} className="bg-teal-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <Link to={`/projects#${item.project.id}`} className="text-teal-700 hover:text-teal-900 text-lg font-semibold block mb-1">{item.project.name}</Link>
                        {item.leadResearcher && (
                            <p className="text-xs text-gray-600">
                                Lead: <Link to={`/researchers#${item.leadResearcher.id}`} className="text-teal-600 hover:underline">{item.leadResearcher.name}</Link>
                            </p>
                        )}
                        {item.lab && (
                             <p className="text-xs text-gray-600">
                                Lab: <Link to={`/labs#${item.lab.id}`} className="text-teal-600 hover:underline">{item.lab.name}</Link>
                            </p>
                        )}
                        {item.resource && (
                            <div className="mt-3 pt-3 border-t border-teal-200">
                               <p className="text-sm font-medium text-gray-700 mb-1">
                                Resource: <Link to={`/compute#${item.resource.id}`} className="text-teal-600 hover:underline">{item.resource.name}</Link>
                               </p>
                                <UtilizationBar
                                    label="Project Usage"
                                    percentage={item.projectUtilization}
                                    bgColor="bg-teal-500"
                                    height="h-4"
                                    ariaLabel={`Project ${item.project.name} usage of ${item.resource.name}`}
                                />
                                <UtilizationBar
                                    label="Overall Resource Usage"
                                    percentage={item.overallResourceUtilization}
                                    bgColor="bg-sky-400"
                                    height="h-4"
                                    ariaLabel={`Overall usage of ${item.resource.name}`}
                                />
                            </div>
                        )}
                         {!item.resource && <p className="text-xs text-gray-500 mt-2">No compute resource details available.</p>}
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-gray-500">No projects with active compute resource utilization to display.</p>
        )}
      </div>


      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link to="/researchers" className="bg-blue-500 hover:bg-blue-600 text-white text-center py-3 px-4 rounded-lg shadow transition-colors">Manage Researchers</Link>
            <Link to="/labs" className="bg-green-500 hover:bg-green-600 text-white text-center py-3 px-4 rounded-lg shadow transition-colors">Manage Labs</Link>
            <Link to="/projects" className="bg-purple-500 hover:bg-purple-600 text-white text-center py-3 px-4 rounded-lg shadow transition-colors">Manage Projects</Link>
            <Link to="/grants" className="bg-pink-500 hover:bg-pink-600 text-white text-center py-3 px-4 rounded-lg shadow transition-colors">Manage Grants</Link>
            <Link to="/compute" className="bg-yellow-500 hover:bg-yellow-600 text-white text-center py-3 px-4 rounded-lg shadow transition-colors">Manage Compute</Link>
        </div>
      </div>
       <p className="text-center text-sm text-gray-500 mt-8">
        Welcome to the Research Computing Dashboard for the University of California, Riverside.
      </p>
    </div>
  );
};

export default DashboardPage;
