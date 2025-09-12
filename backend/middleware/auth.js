const { OAuth2Client } = require('google-auth-library');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to verify Google access token
async function verifyGoogleToken(token) {
  try {
    // For access tokens, verify with Google's tokeninfo endpoint
    const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
    
    if (!response.ok) {
      throw new Error('Invalid token');
    }
    
    const tokenInfo = await response.json();
    
    // Verify the token is for your app (optional but recommended)
    if (tokenInfo.audience !== process.env.GOOGLE_CLIENT_ID) {
      throw new Error('Token audience mismatch');
    }
    
    return tokenInfo;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

// Updated authentication middleware
const requireAuth = async (req, res, next) => {
  console.log('=== AUTH DEBUG ===');
  console.log('Headers:', req.headers.authorization ? 'Bearer token present' : 'No Bearer token');
  console.log('Session authenticated:', req.isAuthenticated ? req.isAuthenticated() : false);
  
  try {
    // Method 1: Check session-based auth (for frontend)
    if (req.isAuthenticated && req.isAuthenticated()) {
      console.log('✅ Session auth successful');
      return next();
    }
    
    // Method 2: Check Bearer token (for Postman/API clients)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log('🔑 Verifying Bearer token...');
      
      try {
        const tokenInfo = await verifyGoogleToken(token);
        console.log('✅ Bearer token verified for:', tokenInfo.email);
        
        // Create a user object similar to session auth
        req.user = {
          id: tokenInfo.user_id || tokenInfo.email, // Use email as fallback ID
          email: tokenInfo.email,
          googleId: tokenInfo.user_id
        };
        
        return next();
      } catch (tokenError) {
        console.log('❌ Bearer token verification failed:', tokenError.message);
        return res.status(401).json({ error: 'Invalid access token' });
      }
    }
    
    // Neither session nor valid Bearer token
    console.log('❌ No valid authentication found');
    res.status(401).json({ error: 'Authentication required' });
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Optional auth middleware (doesn't block if not authenticated)
const optionalAuth = async (req, res, next) => {
  try {
    // Try to authenticate but don't block if it fails
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        const tokenInfo = await verifyGoogleToken(token);
        req.user = {
          id: tokenInfo.user_id || tokenInfo.email,
          email: tokenInfo.email,
          googleId: tokenInfo.user_id
        };
      } catch (tokenError) {
        // Ignore token errors for optional auth
        console.log('Optional auth: Bearer token invalid, continuing without auth');
      }
    }
    
    // Continue regardless of auth status
    next();
  } catch (error) {
    // Continue even if there's an error
    next();
  }
};

// Admin auth middleware (if you need admin-only routes)
const requireAdmin = async (req, res, next) => {
  // First ensure user is authenticated
  await requireAuth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    res.status(403).json({ error: 'Admin access required' });
  });
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin,
  verifyGoogleToken
};