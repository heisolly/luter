import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import { ArrowRight, Github, BookOpen, Layers, Users } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate('/onboarding');
    } else {
      // Redirect to Luter Central Auth, or just onboard if simulating
      window.location.href = "https://auth.luter.app/login?redirect=http://classroom.localhost:5173/onboarding";
      // Fallback for local testing if central auth isn't running
      navigate('/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans overflow-x-hidden selection:bg-purple-600 selection:text-white" style={{ backgroundColor: '#111116' }}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-lg shadow-purple-600/20">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">ClassroomIO</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#resources" className="hover:text-white transition-colors">Resources</a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleGetStarted} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Log in
            </button>
            <button onClick={handleGetStarted} className="px-5 py-2 rounded-full bg-slate-200 text-slate-900 text-sm font-semibold hover:bg-white transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/10 border border-purple-600/20 text-purple-400 text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            ClassroomIO is now open source
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-8xl font-bold text-white tracking-tight leading-[1.1] mb-8"
          >
            The Open Source <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-400">
              Learning Platform
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Build, launch, and scale your online academy with the most powerful and extensible LMS designed for modern creators and institutions.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button onClick={handleGetStarted} className="w-full sm:w-auto px-8 py-4 rounded-full bg-purple-600 text-white text-lg font-semibold hover:bg-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25">
              Start Building Free <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 text-white text-lg font-semibold hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2">
              <Github className="w-5 h-5" /> Star on GitHub
            </button>
          </motion.div>
        </div>

        {/* Dashboard Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-24 max-w-6xl mx-auto relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10"></div>
          <div className="rounded-xl border border-white/10 bg-slate-900 p-2 shadow-2xl overflow-hidden">
            <div className="rounded-lg border border-white/5 bg-slate-950 aspect-[16/9] flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#111116' }}>
              {/* Abstract Mockup UI representing the dashboard */}
              <div className="absolute inset-0 flex">
                {/* Sidebar */}
                <div className="w-64 border-r border-white/5 p-6 flex flex-col gap-6">
                  <div className="w-32 h-6 bg-white/10 rounded-md"></div>
                  <div className="flex flex-col gap-3 mt-4">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-full h-8 bg-white/5 rounded-md"></div>)}
                  </div>
                </div>
                {/* Main Content */}
                <div className="flex-1 p-8">
                  <div className="w-48 h-8 bg-white/10 rounded-md mb-8"></div>
                  <div className="grid grid-cols-3 gap-6 mb-8">
                     {[1,2,3].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/5"></div>)}
                  </div>
                  <div className="w-full h-64 bg-purple-600/10 rounded-xl border border-purple-600/20"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
