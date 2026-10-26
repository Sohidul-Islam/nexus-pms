export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' && window.location.port === '4200') {
      return 'http://localhost:3001/api';
    }
    return '/api';
  }
  return '/api';
}
