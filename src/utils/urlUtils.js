export const LANDING_URL = import.meta.env.PROD ? 'https://luter.app' : 'http://localhost:5173';
export const DASHBOARD_URL = import.meta.env.PROD ? 'https://dashboard.luter.app' : 'http://localhost:5173';

export const getAppUrl = (path = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  const dashboardPaths = [
    '/dashboard', '/admin',
    '/compete', '/sessions', '/library', '/store', '/home', '/upload', '/settings'
  ];

  const landingPaths = ['/', '/features', '/how-it-works', '/pricing', '/about', '/path-calculator'];

  // If we are on the landing page, app paths should go to the dashboard subdomain
  if (window.location.hostname === 'luter.app') {
    if (dashboardPaths.some(p => cleanPath.startsWith(p))) {
      return `${DASHBOARD_URL}${cleanPath}`;
    }
  }
  
  // If we are on the dashboard subdomain, landing page paths should go to the landing page domain
  if (window.location.hostname === 'dashboard.luter.app') {
    if (landingPaths.includes(cleanPath)) {
      return `${LANDING_URL}${cleanPath}`;
    }
  }

  return cleanPath;
};
