import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateGig from './pages/CreateGig';
import GigDetails from './pages/GigDetails';

function App() {
  const { user, loading } = useAuth();
  const [route, setRoute] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash.slice(1) || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user && route !== '/register' && route !== '/login') {
    window.location.hash = '/login';
    return null;
  }

  if (user && (route === '/register' || route === '/login')) {
    window.location.hash = '/';
    return null;
  }

  if (route === '/register') {
    return <Register />;
  }

  if (route === '/login') {
    return <Login />;
  }

  if (route === '/create-gig') {
    return <CreateGig />;
  }

  if (route.startsWith('/gig/')) {
    return <GigDetails />;
  }

  return <Dashboard />;
}

export default App;
