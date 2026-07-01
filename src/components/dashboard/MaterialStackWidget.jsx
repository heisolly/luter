import React, { useState } from 'react';

const MaterialStackWidget = ({ isDark = false }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Mock data for the materials
  const materials = [
    {
      id: 1,
      title: "Fractions",
      subtitle: "LEVEL 1",
      icon: "🎨", // Using emoji as placeholder for the 3D illustration
      items: [
        { id: 'i1', title: 'Warm Up', active: true, icon: '🚀' },
        { id: 'i2', title: 'Combining Parts', active: false, icon: '⚪' }
      ]
    },
    {
      id: 2,
      title: "Algebra Basics",
      subtitle: "LEVEL 2",
      icon: "📐",
      items: [
        { id: 'i3', title: 'Variables', active: true, icon: '🚀' },
        { id: 'i4', title: 'Equations', active: false, icon: '⚪' }
      ]
    },
    { id: 3, title: "Geometry", subtitle: "LEVEL 1", icon: "🧊", items: [] },
    { id: 4, title: "Calculus", subtitle: "LEVEL 3", icon: "📈", items: [] },
    { id: 5, title: "Statistics", subtitle: "LEVEL 2", icon: "📊", items: [] },
  ];

  const activeMaterial = materials[activeIndex];

  const colors = {
    bgOuter: isDark ? '#1F2937' : '#F8FAFC', // slightly softer background for the widget area
    bgCard: isDark ? '#111827' : '#FFFFFF',
    textPrimary: isDark ? '#F3F4F6' : '#111827',
    textSecondary: isDark ? '#9CA3AF' : '#6B7280',
    textAccent: isDark ? '#60A5FA' : '#3B82F6',
    border: isDark ? '#374151' : '#E2E8F0',
    cardBorder: isDark ? '#374151' : '#E5E7EB',
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '480px',
      backgroundColor: colors.bgOuter,
      borderRadius: '32px',
      padding: '40px 24px 24px 24px',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '32px'
    }}>
      
      {/* Stacked Cards Area */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '360px', height: '420px' }}>
        
        {/* Background Card 2 */}
        <div style={{
          position: 'absolute',
          top: '20px',
          bottom: '-20px',
          left: '20px',
          right: '-20px',
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: '24px',
          zIndex: 0,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          opacity: 0.5
        }}></div>

        {/* Background Card 1 */}
        <div style={{
          position: 'absolute',
          top: '10px',
          bottom: '-10px',
          left: '10px',
          right: '-10px',
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: '24px',
          zIndex: 1,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
          opacity: 0.8
        }}></div>

        {/* Front Card */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: '24px',
          zIndex: 2,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px 24px 24px 24px',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: colors.textPrimary, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
              {activeMaterial.title}
            </h2>
            <p style={{ fontSize: '12px', fontWeight: 700, color: colors.textAccent, margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>
              {activeMaterial.subtitle}
            </p>
          </div>

          {/* Illustration */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            fontSize: '120px',
            filter: 'drop-shadow(0 20px 13px rgba(0,0,0,0.15))',
            marginBottom: '24px'
          }}>
            {activeMaterial.icon}
          </div>

          {/* Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {activeMaterial.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    backgroundColor: item.active ? (isDark ? '#1E3A8A' : '#EFF6FF') : 'transparent',
                    border: item.active ? 'none' : `2px solid ${colors.border}`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '20px'
                  }}>
                    {item.active ? item.icon : ''}
                  </div>
                  <span style={{ 
                    fontSize: '15px', 
                    fontWeight: item.active ? 700 : 500, 
                    color: item.active ? colors.textPrimary : colors.textSecondary 
                  }}>
                    {item.title}
                  </span>
                </div>
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  backgroundColor: item.active ? colors.border : 'transparent',
                  border: item.active ? 'none' : `2px solid ${colors.border}`
                }} />
              </div>
            ))}
          </div>

          {/* Start Button */}
          <button style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {/* Glossy overlay effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '20%',
              right: 0,
              bottom: 0,
              background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.2) 25%, transparent 30%)',
              pointerEvents: 'none'
            }} />
            Start
          </button>
        </div>
      </div>

      {/* Thumbnails Row */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        {materials.map((mat, idx) => (
          <button
            key={mat.id}
            onClick={() => setActiveIndex(idx)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: colors.bgCard,
              border: activeIndex === idx ? `2px solid ${colors.textAccent}` : `1px solid ${colors.cardBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              opacity: activeIndex === idx ? 1 : 0.6,
              boxShadow: activeIndex === idx ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
            }}
            onMouseOver={(e) => {
              if (activeIndex !== idx) e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              if (activeIndex !== idx) e.currentTarget.style.opacity = '0.6';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {mat.icon}
          </button>
        ))}
      </div>

    </div>
  );
};

export default MaterialStackWidget;
