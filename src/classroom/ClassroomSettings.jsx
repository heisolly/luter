import React, { useState } from 'react';

export default function ClassroomSettings({ user }) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    commentsOnPosts: true,
    commentsMentionYou: true,
    privateComments: true,
    lateSubmissions: true,
    resubmissions: true,
    invitations: true,
    scheduledPost: true,
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const ToggleSwitch = ({ checked, onChange }) => (
    <div 
      onClick={onChange}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: checked ? '#1a73e8' : '#b0b3b8',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
        display: 'flex',
        alignItems: 'center',
        padding: '0 2px'
      }}
    >
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: '#fff',
        transition: 'transform 0.2s',
        transform: checked ? 'translateX(20px)' : 'translateX(0)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
      }} />
    </div>
  );

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Profile Card */}
      <div style={{ background: '#fff', border: '1px solid #dadce0', borderRadius: '8px', padding: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 400, color: '#3c4043', margin: '0 0 24px 0' }}>Profile</h2>
        
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', color: '#3c4043', marginBottom: '12px' }}>Profile picture</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '50%', background: '#a142f4', 
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '18px', fontWeight: 500 
            }}>
              {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 'M'}
            </div>
            <a href="#" style={{ color: '#1a73e8', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Change</a>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', color: '#3c4043', marginBottom: '4px' }}>Account settings</div>
          <div style={{ fontSize: '13px', color: '#5f6368' }}>
            Change your password and security options, and access other Google services. <a href="#" style={{ color: '#1a73e8', textDecoration: 'none' }}>Manage</a>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '14px', color: '#3c4043', marginBottom: '4px' }}>Change name</div>
          <div style={{ fontSize: '13px', color: '#5f6368' }}>
            To change your name, go to your <a href="#" style={{ color: '#1a73e8', textDecoration: 'none' }}>account settings</a>.
          </div>
        </div>
      </div>

      {/* Notifications Card */}
      <div style={{ background: '#fff', border: '1px solid #dadce0', borderRadius: '8px', padding: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 400, color: '#3c4043', margin: '0 0 24px 0' }}>Notifications</h2>
        
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '16px', color: '#3c4043', marginBottom: '4px' }}>Email</div>
          <div style={{ fontSize: '13px', color: '#5f6368', marginBottom: '16px' }}>
            These settings apply to the notifications you get by email. <a href="#" style={{ color: '#1a73e8', textDecoration: 'none' }}>Learn more</a>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: '14px', color: '#3c4043' }}>Allow email notifications</div>
            <ToggleSwitch checked={settings.emailNotifications} onChange={() => toggleSetting('emailNotifications')} />
          </div>
        </div>

        {settings.emailNotifications && (
          <>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '14px', color: '#3c4043', fontWeight: 500, marginBottom: '16px' }}>Comments</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#3c4043' }}>Comments on your posts</div>
                  <ToggleSwitch checked={settings.commentsOnPosts} onChange={() => toggleSetting('commentsOnPosts')} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#3c4043' }}>Comments that mention you</div>
                  <ToggleSwitch checked={settings.commentsMentionYou} onChange={() => toggleSetting('commentsMentionYou')} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#3c4043' }}>Private comments on work</div>
                  <ToggleSwitch checked={settings.privateComments} onChange={() => toggleSetting('privateComments')} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '14px', color: '#3c4043', fontWeight: 500, marginBottom: '16px' }}>Classes you teach</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#3c4043' }}>Late submissions of student work</div>
                  <ToggleSwitch checked={settings.lateSubmissions} onChange={() => toggleSetting('lateSubmissions')} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#3c4043' }}>Resubmissions of student work</div>
                  <ToggleSwitch checked={settings.resubmissions} onChange={() => toggleSetting('resubmissions')} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#3c4043' }}>Invitations to co-teach classes</div>
                  <ToggleSwitch checked={settings.invitations} onChange={() => toggleSetting('invitations')} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#3c4043' }}>Scheduled post published or failed</div>
                  <ToggleSwitch checked={settings.scheduledPost} onChange={() => toggleSetting('scheduledPost')} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '14px', color: '#3c4043', fontWeight: 500, marginBottom: '4px' }}>Class notifications</div>
              <div style={{ fontSize: '13px', color: '#5f6368', marginBottom: '8px' }}>
                These settings apply to both your email and device notifications for each class
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
