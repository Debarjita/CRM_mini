// API configuration for different environments

const API_CONFIG = {
  // Use relative URLs in production (served by same domain)
  // Use localhost in development
  baseURL: process.env.NODE_ENV === 'production' 
    ? ''  // Empty string for production (relative URLs)
    : 'http://localhost:5000',  // Full URL for development
  
  timeout: 10000,
  withCredentials: true,
  
  headers: {
    'Content-Type': 'application/json',
  }
};

export default API_CONFIG;