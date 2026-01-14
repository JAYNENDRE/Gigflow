import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import { supabase } from '../lib/supabase';
import { ArrowLeft, DollarSign, User } from 'lucide-react';

interface Gig {
  id: string;
  title: string;
  description: string;
  budget: number;
  owner_id: string;
  status: string;
  created_at: string;
}

interface Bid {
  id: string;
  gig_id: string;
  freelancer_id: string;
  message: string;
  price: number;
  status: string;
  created_at: string;
}

export default function GigDetails() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gig, setGig] = useState<Gig | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidMessage, setBidMessage] = useState('');
  const [bidPrice, setBidPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const gigId = window.location.hash.split('/')[2];

  useEffect(() => {
    if (gigId) {
      fetchGigDetails();
    }
  }, [gigId]);

  const fetchGigDetails = async () => {
    try {
      const { data: gigData, error: gigError } = await supabase
        .from('gigs')
        .select('*')
        .eq('id', gigId)
        .single();

      if (gigError) throw gigError;
      setGig(gigData);

      if (gigData && user && gigData.owner_id === user.id) {
        const { data: bidsData, error: bidsError } = await supabase
          .from('bids')
          .select('*')
          .eq('gig_id', gigId)
          .order('created_at', { ascending: false });

        if (bidsError) throw bidsError;
        setBids(bidsData || []);
      }
    } catch (error) {
      console.error('Error fetching gig details:', error);
      setError('Failed to load gig details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!user) {
        throw new Error('You must be logged in to submit a bid');
      }

      const { error: insertError } = await supabase
        .from('bids')
        .insert([
          {
            gig_id: gigId,
            freelancer_id: user.id,
            message: bidMessage,
            price: parseFloat(bidPrice),
            status: 'pending',
          },
        ]);

      if (insertError) throw insertError;

      setBidMessage('');
      setBidPrice('');
      alert('Bid submitted successfully!');
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHire = async (bidId: string) => {
    if (!confirm('Are you sure you want to hire this freelancer? This action cannot be undone.')) {
      return;
    }

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hire-freelancer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({ bidId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to hire freelancer');
      }

      alert('Freelancer hired successfully!');
      fetchGigDetails();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to hire freelancer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Gig not found</p>
      </div>
    );
  }

  const isOwner = user && gig.owner_id === user.id;
  const isAssigned = gig.status === 'assigned';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{gig.title}</h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isAssigned
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {isAssigned ? 'Assigned' : 'Open'}
            </span>
          </div>

          <p className="text-gray-600 mb-6 whitespace-pre-wrap">{gig.description}</p>

          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-blue-600 mr-1" />
              <span className="text-2xl font-bold text-blue-600">{gig.budget}</span>
            </div>
            <span className="text-gray-500">
              Posted {new Date(gig.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {isOwner ? (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Bids ({bids.length})
            </h2>

            {bids.length === 0 ? (
              <p className="text-gray-600">No bids yet.</p>
            ) : (
              <div className="space-y-4">
                {bids.map((bid) => (
                  <div
                    key={bid.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">
                          Freelancer
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-blue-600">
                          ${bid.price}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            bid.status === 'hired'
                              ? 'bg-green-100 text-green-800'
                              : bid.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {bid.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3">{bid.message}</p>
                    {bid.status === 'pending' && !isAssigned && (
                      <button
                        onClick={() => handleHire(bid.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Hire This Freelancer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Submit Your Bid
            </h2>

            {isAssigned ? (
              <p className="text-gray-600">
                This gig has already been assigned to a freelancer.
              </p>
            ) : (
              <form onSubmit={handleSubmitBid} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Proposal Message
                  </label>
                  <textarea
                    id="message"
                    required
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain why you're the best fit for this gig..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Your Bid Price ($)
                  </label>
                  <input
                    id="price"
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={bidPrice}
                    onChange={(e) => setBidPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 450"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 font-medium"
                >
                  {submitting ? 'Submitting...' : 'Submit Bid'}
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
