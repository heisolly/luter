import React, { Component } from 'react';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F8FAFC',
    padding: '24px',
    fontFamily: "var(--font-outfit), system-ui, sans-serif",
    textAlign: 'center',
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
  },
  card: {
    maxWidth: '480px',
    width: '100%',
    background: '#FFFFFF',
    boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: '24px',
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconWrapper: {
    width: '80px',
    height: '80px',
    borderRadius: '24px',
    background: '#FEE2E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  icon: {
    fontSize: '40px',
    lineHeight: 1,
  },
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 12px',
    letterSpacing: '-0.02em',
  },
  subtext: {
    fontSize: '15px',
    color: '#6B7280',
    margin: '0 0 32px',
    lineHeight: 1.6,
  },
  reloadBtn: {
    background: '#111827',
    color: '#FFFFFF',
    border: 'none',
    padding: '14px 32px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'inherit',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  errorDetail: {
    marginTop: '32px',
    padding: '16px',
    background: '#F3F4F6',
    borderRadius: '12px',
    fontSize: '13px',
    color: '#4B5563',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    wordBreak: 'break-word',
    textAlign: 'left',
    width: '100%',
    maxHeight: '120px',
    overflowY: 'auto',
    border: '1px solid #E5E7EB',
  },
};

export default class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.iconWrapper}>
              <span style={styles.icon}>😅</span>
            </div>

            <h1 style={styles.heading}>Oops! Something went wrong</h1>

            <p style={styles.subtext}>
              We've encountered an unexpected error. Don't worry, your work is safe. Just refresh the page to get back on track.
            </p>

            <button
              onClick={() => window.location.reload()}
              style={styles.reloadBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Refresh Page
            </button>

            <div style={styles.errorDetail}>
              {this.state.error.message}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
