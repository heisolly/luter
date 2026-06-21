import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import { BookOpen, CheckCircle, ChevronRight } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null); // 'teacher' | 'student'
  const [orgName, setOrgName] = useState('');

  const handleComplete = () => {
    localStorage.setItem('luter_classroom_onboarded', 'true');
    if (role === 'teacher') {
      navigate('/courses');
    } else {
      navigate('/lms/mylearning');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans text-slate-200" style={{ backgroundColor: '#111116' }}>
      <div className="w-full max-w-xl">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-12 justify-center"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-lg shadow-purple-600/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">ClassroomIO</span>
        </motion.div>

        <div className="bg-slate-900 rounded-2xl border border-white/5 p-8 shadow-2xl">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome aboard!</h2>
              <p className="text-gray-400 mb-8">How are you planning to use ClassroomIO?</p>

              <div className="space-y-4">
                <button 
                  onClick={() => setRole('teacher')}
                  className={`w-full text-left p-6 rounded-xl border transition-all ${role === 'teacher' ? 'border-purple-600 bg-purple-600/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-white">I'm a Creator / Teacher</h3>
                      <p className="text-sm text-gray-400 mt-1">I want to build an academy and create courses.</p>
                    </div>
                    {role === 'teacher' && <CheckCircle className="text-purple-600 w-6 h-6" />}
                  </div>
                </button>

                <button 
                  onClick={() => setRole('student')}
                  className={`w-full text-left p-6 rounded-xl border transition-all ${role === 'student' ? 'border-purple-600 bg-purple-600/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-white">I'm a Student</h3>
                      <p className="text-sm text-gray-400 mt-1">I want to enroll in courses and learn.</p>
                    </div>
                    {role === 'student' && <CheckCircle className="text-purple-600 w-6 h-6" />}
                  </div>
                </button>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!role}
                className="w-full mt-8 py-3 rounded-xl bg-purple-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {step === 2 && role === 'teacher' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-bold text-white mb-2">Create your Academy</h2>
              <p className="text-gray-400 mb-8">What should we call your new learning organization?</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Organization Name</label>
                  <input 
                    type="text" 
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Luter University"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={handleComplete}
                disabled={!orgName}
                className="w-full mt-8 py-3 rounded-xl bg-purple-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
              >
                Launch Academy
              </button>
            </motion.div>
          )}

          {step === 2 && role === 'student' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
              <p className="text-gray-400 mb-8">Let's take you to your learning dashboard.</p>

              <button 
                onClick={handleComplete}
                className="w-full py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
              >
                Go to My Learning
              </button>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
