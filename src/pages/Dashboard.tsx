import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import { supabase } from '../lib/supabase';
import { Search, Plus, Briefcase } from 'lucide-react';

interface Gig {
  id: string;
  title: string;
  description: string;
  budget: number;
  owner_id: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGigs();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredGigs(gigs);
    } else {
      const filtered = gigs.filter(gig =>
        gig.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGigs(filtered);
    }
  }, [searchTerm, gigs]);

  const fetchGigs = async () => {
    try {
      const { data, error } = await supabase
        .from('gigs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGigs(data || []);
      setFilteredGigs(data || []);
    } catch (error) {
      console.error('Error fetching gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">GigFlow</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/create-gig')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Post Gig
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Available Gigs
          </h1>
          <p className="text-gray-600">
            Browse open gigs and submit your bids
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search gigs by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading gigs...</p>
          </div>
        ) : filteredGigs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {searchTerm ? 'No gigs found matching your search.' : 'No open gigs available.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredGigs.map((gig) => (
              <div
                key={gig.id}
                onClick={() => navigate(`/gig/${gig.id}`)}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {gig.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {gig.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-blue-600">
                    ${gig.budget}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(gig.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
