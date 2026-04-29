import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Programs from './pages/Programs';
import RadioLive from './pages/RadioLive';
import Media from './pages/Media';
import About from './pages/About';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import AdminPanel from './components/AdminPanel';
import ConfirmEmail from './pages/ConfirmEmail';
import Footer from './components/Footer';
import Preloader from './components/Preloader';
import LiveViewer from './pages/LiveViewer';
import LiveAdPopup from './components/LiveAdPopup';

const AppContent = () => {
  const [pageLoading, setPageLoading] = useState(false);
  const location = useLocation();

  const isAdmin = location.pathname.startsWith('/admin') || location.pathname.startsWith('/auth');

  const handlePageTransition = () => {
    setPageLoading(true);
    setTimeout(() => setPageLoading(false), 600);
  };

  return (
    <div className="min-h-screen bg-white">
      {pageLoading && <Preloader />}
      {!isAdmin && <Header onNavigate={handlePageTransition} />}
      {!isAdmin && <LiveAdPopup />}
      <main className={!isAdmin ? 'pt-16 lg:pt-20' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/radio" element={<RadioLive />} />
          <Route path="/live" element={<LiveViewer />} />
          <Route path="/media" element={<Media />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/auth/confirm" element={<ConfirmEmail />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Preloader />;

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
