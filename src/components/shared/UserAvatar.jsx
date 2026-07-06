import React from 'react';
import Avatar from 'react-nice-avatar';

export default function UserAvatar({ url, name, size = 40, className = '', style = {} }) {
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--primary-light, #E5E7EB)',
    ...style
  };

  // If there's no URL, show initial
  if (!url) {
    return (
      <div className={className} style={containerStyle}>
        <span style={{ fontSize: size * 0.4, fontWeight: 700, color: 'var(--primary-dark, #4B5563)' }}>
          {name ? name.charAt(0).toUpperCase() : '?'}
        </span>
      </div>
    );
  }

  // If it's a JSON config string from react-nice-avatar
  if (url.startsWith('{')) {
    try {
      const config = JSON.parse(url);
      return (
        <div className={className} style={containerStyle}>
          <Avatar style={{ width: '100%', height: '100%' }} {...config} />
        </div>
      );
    } catch (e) {
      // Fallback if parse fails
    }
  }

  // Otherwise, it's a normal image URL
  return (
    <img 
      src={url} 
      alt={name || "Avatar"} 
      className={className}
      style={{ ...containerStyle, objectFit: 'cover' }} 
    />
  );
}
