export const LANDING_URL = import.meta.env.PROD ? 'https://luter.app' : 'http://localhost:5173';
export const DASHBOARD_URL = import.meta.env.PROD ? 'https://dashboard.luter.app' : 'http://localhost:5173';

export const getAppUrl = (path = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If we are on the landing page, signin/signup/dashboard should go to the dashboard subdomain
  if (window.location.hostname === 'luter.app') {
    if (cleanPath.startsWith('/signin') || cleanPath.startsWith('/signup') || cleanPath.startsWith('/dashboard')) {
      return `${DASHBOARD_URL}${cleanPath}`;
    }
  }
  
  // If we are on the dashboard subdomain, landing page links should go to the landing page domain
  if (window.location.hostname === 'dashboard.luter.app') {
    const landingPaths = ['/', '/features', '/how-it-works', '/pricing', '/about', '/path-calculator'];
    if (landingPaths.includes(cleanPath)) {
      return `${LANDING_URL}${cleanPath}`;
    }
  }

  return cleanPath;
};
