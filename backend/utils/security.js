const crypto = require('crypto');

/**
 * Generate a secure session secret
 * @param {number} length - Length of the secret (default: 64)
 * @returns {string} - Hex string of random bytes
 */
function generateSessionSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a secure API key
 * @param {number} length - Length of the key (default: 32)
 * @returns {string} - Base64 URL-safe string
 */
function generateApiKey(length = 32) {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Hash a password using bcrypt-compatible method
 * @param {string} password - Plain text password
 * @param {number} rounds - Salt rounds (default: 12)
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password, rounds = 12) {
  const bcrypt = require('bcrypt');
  return await bcrypt.hash(password, rounds);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
async function verifyPassword(password, hash) {
  const bcrypt = require('bcrypt');
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a secure random token
 * @param {number} length - Length in bytes (default: 32)
 * @returns {string} - Hex string token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Sanitize input to prevent XSS and injection attacks
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Rate limiting helper - creates a simple in-memory rate limiter
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} maxRequests - Maximum requests per window
 * @returns {Function} - Middleware function
 */
function createRateLimiter(windowMs = 15 * 60 * 1000, maxRequests = 100) {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [ip, timestamps] of requests.entries()) {
      requests.set(ip, timestamps.filter(t => t > windowStart));
      if (requests.get(ip).length === 0) {
        requests.delete(ip);
      }
    }
    
    // Check current IP
    const userRequests = requests.get(key) || [];
    const recentRequests = userRequests.filter(t => t > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(key, recentRequests);
    
    next();
  };
}

/**
 * Check if running in production
 * @returns {boolean} - True if production environment
 */
function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Validate environment variables
 * @param {string[]} required - Array of required environment variables
 * @throws {Error} - If any required variables are missing
 */
function validateEnvironment(required = []) {
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Generate setup instructions for missing environment variables
 * @returns {string} - Setup instructions
 */
function generateSetupInstructions() {
  const instructions = [];
  
  if (!process.env.SESSION_SECRET) {
    const newSecret = generateSessionSecret();
    instructions.push(`SESSION_SECRET=${newSecret}`);
  }
  
  if (!process.env.GOOGLE_CLIENT_ID) {
    instructions.push('GOOGLE_CLIENT_ID=your_google_client_id');
    instructions.push('GOOGLE_CLIENT_SECRET=your_google_client_secret');
    instructions.push('# Get these from https://console.cloud.google.com/');
  }
  
  if (!process.env.MONGODB_URI) {
    instructions.push('MONGODB_URI=mongodb://localhost:27017/minicrm');
  }
  
  if (!process.env.REDIS_URL) {
    instructions.push('REDIS_URL=redis://localhost:6379');
  }
  
  return instructions.length > 0 
    ? `Add these to your .env file:\n\n${instructions.join('\n')}\n`
    : 'Environment configuration looks complete!';
}

module.exports = {
  generateSessionSecret,
  generateApiKey,
  hashPassword,
  verifyPassword,
  generateToken,
  sanitizeInput,
  isValidEmail,
  createRateLimiter,
  isProduction,
  validateEnvironment,
  generateSetupInstructions
};