import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  CreditCard, 
  BookOpen,
  Download,
  Trash,
  Eye,
  EyeSlash,
  Moon,
  Sun,
  DeviceMobile,
  Monitor,
  Question,
  Envelope,
  Lock,
  Key,
  SignOut,
  Check,
  X,
  ArrowRight,
  Sparkle,
  Gear,
  UserCircle,
  Notification,
  Books,
  ChartBar,
  GearSix,
  CrownSimple,
  Plus,
  BookOpenText,
  Student,
  GraduationCap,
  Backpack
} from '@phosphor-icons/react';
import { supabase } from '../../supabaseClient';
import { LuterPageLoader } from '../shared/LuterPageLoader';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    study: true,
    updates: false
  });

  // Determine user type
  const isUniversityStudent = profile?.is_university_user !== false && profile?.role !== 'solo_learner';
  const isSoloLearner = !isUniversityStudent;

  // Form states
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    university: '',
    faculty: '',
    level: '',
    bio: '',
    interests: [],
    institution: '',
    program_name: '',
    education_level: ''
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Fetch profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setProfile(profile);
          setProfileData({
            fullName: profile.full_name || '',
            email: user.email || '',
            university: profile.university || '',
            faculty: profile.faculty || '',
            level: profile.level || '',
            bio: profile.bio || '',
            interests: profile.interests || [],
            institution: profile.institution || '',
            program_name: profile.program_name || '',
            education_level: profile.education_level || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.fullName,
          university: profileData.university,
          faculty: profileData.faculty,
          level: profileData.level,
          bio: profileData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      showMessage('success', 'Profile updated successfully!');
    } catch (error) {
      showMessage('error', 'Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.new !== passwordData.confirm) {
      showMessage('error', 'Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      });
      
      if (error) throw error;
      showMessage('success', 'Password updated successfully!');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      showMessage('error', 'Failed to update password');
      console.error('Error updating password:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/signin';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCircle },
    { id: 'account', label: 'Account', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'about', label: 'About', icon: Question }
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const tabVariants = {
    inactive: { scale: 1, backgroundColor: 'transparent' },
    active: { scale: 1.05, backgroundColor: 'rgba(151, 24, 251, 0.1)' }
  };

  if (loading && !profile) {
    return <LuterPageLoader message="Loading settings..." minHeight="80vh" />;
  }

  return (
    <div style={{ 
      fontFamily: 'Outfit, sans-serif',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fafbff 0%, #f5f3ff 100%)',
      padding: '20px'
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '32px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #9718fb 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Gear size={24} color="white" />
          </div>
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#1a1a2e',
              margin: 0,
              letterSpacing: '-0.5px'
            }}>
              Settings
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280', 
              margin: 0,
              fontWeight: '400'
            }}>
              Manage your account settings and preferences
            </p>
          </div>
        </div>
      </motion.div>

      {/* Message Toast */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 1000,
              padding: '16px 24px',
              borderRadius: '12px',
              background: message.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white',
              fontWeight: '500',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
              {message.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Sidebar */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            width: '280px',
            flexShrink: 0
          }}
        >
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(151, 24, 251, 0.1)'
          }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  variants={tabVariants}
                  animate={activeTab === tab.id ? 'active' : 'inactive'}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: 'none',
                    borderRadius: '12px',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: activeTab === tab.id ? '#9718fb' : '#6b7280',
                    transition: 'all 0.2s ease',
                    marginBottom: '4px'
                  }}
                >
                  <Icon 
                    size={20} 
                    weight={activeTab === tab.id ? 'fill' : 'regular'}
                  />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      style={{
                        position: 'absolute',
                        right: '16px',
                        width: '4px',
                        height: '20px',
                        borderRadius: '2px',
                        background: '#9718fb'
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ flex: 1 }}
        >
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(151, 24, 251, 0.1)'
          }}>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* User Type Header */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  marginBottom: '24px',
                  padding: '16px',
                  background: isUniversityStudent ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '12px',
                  border: `1px solid ${isUniversityStudent ? '#0ea5e9' : '#f59e0b'}`
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#f3f4f6',
                    border: '2px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isUniversityStudent ? (
                      <GraduationCap size={24} color="#1a1a2e" />
                    ) : (
                      <Backpack size={24} color="#1a1a2e" />
                    )}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 4px' }}>
                      {isUniversityStudent ? 'University Student' : 'Solo Learner'}
                    </h2>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                      {isUniversityStudent ? 'Manage your academic profile and course information' : 'Manage your learning profile and interests'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Common Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'Outfit, sans-serif',
                          transition: 'all 0.2s ease',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#9718fb'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'Outfit, sans-serif',
                          backgroundColor: '#f9fafb',
                          color: '#6b7280',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>
                  </div>

                  {/* University Student Fields */}
                  {isUniversityStudent && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                            University
                          </label>
                          <input
                            type="text"
                            value={profileData.university}
                            onChange={(e) => setProfileData({ ...profileData, university: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '10px',
                              fontSize: '14px',
                              fontFamily: 'Outfit, sans-serif',
                              transition: 'all 0.2s ease',
                              outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#9718fb'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                            Faculty
                          </label>
                          <input
                            type="text"
                            value={profileData.faculty}
                            onChange={(e) => setProfileData({ ...profileData, faculty: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '10px',
                              fontSize: '14px',
                              fontFamily: 'Outfit, sans-serif',
                              transition: 'all 0.2s ease',
                              outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#9718fb'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                            Level
                          </label>
                          <input
                            type="text"
                            value={profileData.level}
                            onChange={(e) => setProfileData({ ...profileData, level: e.target.value })}
                            placeholder="e.g., 200 Level, 3rd Year"
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '10px',
                              fontSize: '14px',
                              fontFamily: 'Outfit, sans-serif',
                              transition: 'all 0.2s ease',
                              outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#9718fb'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                            Program
                          </label>
                          <input
                            type="text"
                            value={profileData.program_name}
                            onChange={(e) => setProfileData({ ...profileData, program_name: e.target.value })}
                            placeholder="e.g., Computer Science, Medicine"
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '10px',
                              fontSize: '14px',
                              fontFamily: 'Outfit, sans-serif',
                              transition: 'all 0.2s ease',
                              outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#9718fb'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Solo Learner Fields */}
                  {isSoloLearner && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                            Institution
                          </label>
                          <input
                            type="text"
                            value={profileData.institution}
                            onChange={(e) => setProfileData({ ...profileData, institution: e.target.value })}
                            placeholder="e.g., Self-taught, Online Course"
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '10px',
                              fontSize: '14px',
                              fontFamily: 'Outfit, sans-serif',
                              transition: 'all 0.2s ease',
                              outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#9718fb'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                            Education Level
                          </label>
                          <select
                            value={profileData.education_level}
                            onChange={(e) => setProfileData({ ...profileData, education_level: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '10px',
                              fontSize: '14px',
                              fontFamily: 'Outfit, sans-serif',
                              transition: 'all 0.2s ease',
                              outline: 'none',
                              backgroundColor: 'white'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#9718fb'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          >
                            <option value="">Select Level</option>
                            <option value="Primary">Primary</option>
                            <option value="Secondary">Secondary</option>
                            <option value="Tertiary">Tertiary</option>
                            <option value="Professional">Professional</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                          Learning Interests
                        </label>
                        <input
                          type="text"
                          value={profileData.interests?.join(', ') || ''}
                          onChange={(e) => setProfileData({ ...profileData, interests: e.target.value.split(',').map(i => i.trim()).filter(i => i) })}
                          placeholder="e.g., Web Development, Data Science, Design"
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontFamily: 'Outfit, sans-serif',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#9718fb'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                          Separate interests with commas
                        </p>
                      </div>
                    </>
                  )}

                  {/* Common Bio Field */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Bio
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={4}
                      placeholder={isUniversityStudent ? "Tell us about your academic journey and goals..." : "Tell us about your learning journey and interests..."}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontFamily: 'Outfit, sans-serif',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#9718fb'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '14px 24px',
                      background: 'linear-gradient(135deg, #9718fb 0%, #7c3aed 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(151, 24, 251, 0.3)'
                    }}
                  >
                    {loading ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '16px', 
                          height: '16px', 
                          border: '2px solid white', 
                          borderTop: '2px solid transparent', 
                          borderRadius: '50%', 
                          animation: 'spin 1s linear infinite' 
                        }} />
                        Saving...
                      </div>
                    ) : (
                      <>
                        <Check size={18} />
                        Save Changes
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a2e', marginBottom: '24px' }}>
                  Account Security
                </h2>
                
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                    Change Password
                  </h3>
                  <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Current Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.current}
                          onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px 12px 44px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontFamily: 'Outfit, sans-serif',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#9718fb'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                        <Lock 
                          size={18} 
                          style={{ 
                            position: 'absolute', 
                            left: '16px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            color: '#9ca3af'
                          }} 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        New Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.new}
                          onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px 12px 44px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontFamily: 'Outfit, sans-serif',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#9718fb'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                        <Key 
                          size={18} 
                          style={{ 
                            position: 'absolute', 
                            left: '16px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            color: '#9ca3af'
                          }} 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Confirm New Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.confirm}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px 12px 44px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontFamily: 'Outfit, sans-serif',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#9718fb'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                        <Key 
                          size={18} 
                          style={{ 
                            position: 'absolute', 
                            left: '16px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            color: '#9ca3af'
                          }} 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          padding: '8px 12px',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#6b7280',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                        {showPassword ? 'Hide' : 'Show'} Passwords
                      </button>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        padding: '14px 24px',
                        background: 'linear-gradient(135deg, #9718fb 0%, #7c3aed 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(151, 24, 251, 0.3)'
                      }}
                    >
                      {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            border: '2px solid white', 
                            borderTop: '2px solid transparent', 
                            borderRadius: '50%', 
                            animation: 'spin 1s linear infinite' 
                          }} />
                          Updating...
                        </div>
                      ) : (
                        <>
                          <Lock size={18} />
                          Update Password
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>

                <div style={{ 
                  padding: '20px', 
                  background: '#fef3c7', 
                  borderRadius: '12px', 
                  border: '1px solid #f59e0b',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <Shield size={20} color="#d97706" />
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#92400e', margin: 0 }}>
                      Two-Factor Authentication
                    </h4>
                  </div>
                  <p style={{ fontSize: '14px', color: '#78350f', margin: '0 0 16px 0' }}>
                    Add an extra layer of security to your account with 2FA.
                  </p>
                  <button
                    style={{
                      padding: '10px 16px',
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Enable 2FA
                  </button>
                </div>
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a2e', marginBottom: '24px' }}>
                  Notification Preferences
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { key: 'email', label: 'Email Notifications', description: 'Receive updates and alerts via email' },
                    { key: 'push', label: 'Push Notifications', description: 'Get instant notifications in your browser' },
                    { key: 'study', label: 'Study Reminders', description: 'Remind me about study sessions and deadlines' },
                    { key: 'updates', label: 'Product Updates', description: 'Stay informed about new features and improvements' }
                  ].map((item) => (
                    <motion.div
                      key={item.key}
                      whileHover={{ scale: 1.01 }}
                      style={{
                        padding: '20px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: notifications[item.key] ? 'linear-gradient(135deg, #9718fb 0%, #7c3aed 100%)' : '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Bell size={20} color={notifications[item.key] ? 'white' : '#9ca3af'} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 4px 0' }}>
                            {item.label}
                          </h4>
                          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div style={{
                        width: '48px',
                        height: '24px',
                        borderRadius: '12px',
                        background: notifications[item.key] ? 'linear-gradient(135deg, #9718fb 0%, #7c3aed 100%)' : '#e5e7eb',
                        position: 'relative',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '2px',
                          left: notifications[item.key] ? '26px' : '2px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'white',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a2e', marginBottom: '24px' }}>
                  Appearance Settings
                </h2>
                
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                    Theme
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDarkMode(false)}
                      style={{
                        padding: '20px',
                        border: darkMode ? '2px solid #e5e7eb' : '2px solid #9718fb',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        background: darkMode ? '#f9fafb' : 'white',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <Sun size={24} color={!darkMode ? '#9718fb' : '#9ca3af'} />
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a2e' }}>
                          Light Mode
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                        Clean and bright interface for daytime use
                      </p>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDarkMode(true)}
                      style={{
                        padding: '20px',
                        border: darkMode ? '2px solid #9718fb' : '2px solid #e5e7eb',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        background: darkMode ? '#1f2937' : '#f9fafb',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <Moon size={24} color={darkMode ? '#9718fb' : '#9ca3af'} />
                        <span style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#f3f4f6' : '#1a1a2e' }}>
                          Dark Mode
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: darkMode ? '#d1d5db' : '#6b7280', margin: 0 }}>
                        Easy on the eyes for nighttime studying
                      </p>
                    </motion.div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                    Accent Color
                  </h3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['#9718fb', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
                      <motion.div
                        key={color}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {/* Handle color change */}}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: color,
                          cursor: 'pointer',
                          border: color === '#9718fb' ? '3px solid #1a1a2e' : '3px solid transparent',
                          transition: 'all 0.2s ease'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a2e', marginBottom: '24px' }}>
                  Privacy & Security
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    style={{
                      padding: '20px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Eye size={20} color="white" />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 4px 0' }}>
                          Profile Visibility
                        </h4>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                          Control who can see your profile information
                        </p>
                      </div>
                    </div>
                    <select style={{
                      padding: '8px 12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Outfit, sans-serif',
                      outline: 'none'
                    }}>
                      <option>Everyone</option>
                      <option>Only Friends</option>
                      <option>Private</option>
                    </select>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    style={{
                      padding: '20px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Download size={20} color="white" />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 4px 0' }}>
                          Data Export
                        </h4>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                          Download all your data in JSON format
                        </p>
                      </div>
                    </div>
                    <button style={{
                      padding: '10px 16px',
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}>
                      Export Data
                    </button>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    style={{
                      padding: '20px',
                      border: '2px solid #fecaca',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#fef2f2'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Trash size={20} color="white" />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#991b1b', margin: '0 0 4px 0' }}>
                          Delete Account
                        </h4>
                        <p style={{ fontSize: '14px', color: '#7f1d1d', margin: 0 }}>
                          Permanently delete your account and all data
                        </p>
                      </div>
                    </div>
                    <button style={{
                      padding: '10px 16px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}>
                      Delete Account
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a2e', marginBottom: '24px' }}>
                  About Luter
                </h2>
                
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #9718fb 0%, #7c3aed 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <Sparkle size={40} color="white" />
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 8px' }}>
                    Luter
                  </h3>
                  <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 8px' }}>
                    Version 1.0.0
                  </p>
                  <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                    © 2024 Luter. All rights reserved.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <Envelope size={20} color="#9718fb" />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 4px' }}>
                        Support
                      </p>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                        support@luter.app
                      </p>
                    </div>
                  </div>

                  <div style={{
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <Globe2 size={20} color="#9718fb" />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 4px' }}>
                        Website
                      </p>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                        www.luter.app
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSignOut}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <SignOut size={18} />
                    Sign Out
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;
