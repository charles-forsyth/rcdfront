
import React, { useState, useCallback } from 'react';
import { Researcher, Lab, Project, ComputeResource, SearchResultItem, Entity, Grant } from '../../types'; // Added Grant
import { performGlobalSearch } from '../../services/geminiService';
import LoadingSpinner from '../LoadingSpinner';
import PageShell from '../PageShell';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface GlobalSearchPageProps {
  researchers: Researcher[];
  labs: Lab[];
  projects: Project[];
  computeResources: ComputeResource[];
  grants: Grant[]; // Added grants
}

const GlobalSearchPage: React.FC<GlobalSearchPageProps> = ({ researchers, labs, projects, computeResources, grants }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const searchData = {
        researchers: researchers as Entity[],
        labs: labs as Entity[],
        projects: projects as Entity[],
        computeResources: computeResources as Entity[],
        grants: grants as Entity[] // Pass grants to search service
      };
      const results = await performGlobalSearch(query, searchData);
      setSearchResults(results);
    } catch (err) {
      setError('An error occurred during search. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [query, researchers, labs, projects, computeResources, grants]);

  const getLinkPath = (item: SearchResultItem): string => {
    switch (item.type) {
      case 'Researcher': return `/researchers#${item.id}`;
      case 'Lab': return `/labs#${item.id}`;
      case 'Project': return `/projects#${item.id}`;
      case 'ComputeResource': return `/compute#${item.id}`;
      case 'Grant': return `/grants#${item.id}`; // Handle Grant type
      default: return `/#`;
    }
  };

  return (
    <PageShell title="Global AI Search">
      <div className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all data (e.g., 'AI in biology', 'NSF grant')"
            className="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !process.env.API_KEY}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 flex items-center disabled:opacity-70"
            title={!process.env.API_KEY ? "API Key not configured for search" : "Search"}
          >
            <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {!process.env.API_KEY && (
          <p className="text-xs text-red-500 mt-1">Note: API Key is not configured. AI Search may not function correctly.</p>
        )}
      </div>

      {isLoading && <LoadingSpinner message="AI is searching. Please wait..." />}
      {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
      
      {!isLoading && !error && searchResults.length === 0 && query && (
        <p className="text-center text-gray-500 mt-4">No results found for "{query}".</p>
      )}

      {!isLoading && !error && searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-700">Search Results ({searchResults.length}):</h3>
          {searchResults.map((item) => (
            <div key={`${item.type}-${item.id}`} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <Link to={getLinkPath(item)} className="text-lg font-semibold text-blue-600 hover:underline">
                {item.name} <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full ml-2">{item.type}</span>
              </Link>
              <p className="text-sm text-gray-600 mt-1">{item.matchContext}</p>
            </div>
          ))}
        </div>
      )}
       {!isLoading && searchResults.length === 0 && !query && (
         <div className="text-center py-10">
            <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Enter a search term above to find researchers, labs, projects, grants, or compute resources.</p>
            <p className="text-sm text-gray-400 mt-2">Powered by Gemini AI.</p>
        </div>
       )}
    </PageShell>
  );
};

export default GlobalSearchPage;
