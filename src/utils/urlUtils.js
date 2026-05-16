export const LANDING_URL = import.meta.env.PROD ? 'https://luter.app' : 'http://localhost:5173';
export const DASHBOARD_URL = LANDING_URL;
export const ADMIN_URL = import.meta.env.PROD ? 'https://admin.luter.app' : 'http://localhost:5173';

export const getAppUrl = (path = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (import.meta.env.PROD && cleanPath.startsWith('/admin')) {
    return `${ADMIN_URL}${cleanPath}`;
  }

  return cleanPath;
};
