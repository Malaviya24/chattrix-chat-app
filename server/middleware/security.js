const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

// Enhanced CSRF token generation with cryptographic security
const generateSecureCSRFToken = () => {
  const randomBytes = crypto.randomBytes(32);
  const timestamp = Date.now().toString();
  const data = `${randomBytes.toString('hex')}:${timestamp}`;
  const hash = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'your-secret-key').update(data).digest('hex');
  return `${data}:${hash}`;
};

// Validate CSRF token with cryptographic verification
const validateCSRFToken = (token) => {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) return false;
    
    const [randomBytes, timestamp, hash] = parts;
    const data = `${randomBytes}:${timestamp}`;
    const expectedHash = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'your-secret-key').update(data).digest('hex');
    
    // Check if token is not expired (24 hours)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 24 * 60 * 60 * 1000) return false;
    
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch (error) {
    return false;
  }
};

// Rate limiting middleware
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limits for different endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  20, // 20 attempts (increased from 5)
  'Too many authentication attempts. Please try again later.'
);

const messageLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  30, // 30 messages per minute
  'Too many messages. Please slow down.'
);

const roomCreationLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  50, // 50 rooms per hour (increased from 10)
  'Too many room creations. Please try again later.'
);

// Enhanced input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Enhanced XSS protection
        obj[key] = obj[key]
          .replace(/[<>]/g, '') // Remove < and >
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/on\w+=/gi, '') // Remove event handlers
          .replace(/data:/gi, '') // Remove data: protocol
          .replace(/vbscript:/gi, '') // Remove vbscript: protocol
          .replace(/expression\(/gi, '') // Remove CSS expressions
          .replace(/url\(/gi, '') // Remove CSS url()
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
};

// Enhanced CSRF protection middleware
const csrfProtection = (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'];
  
  if (!csrfToken) {
    return res.status(403).json({ 
      error: 'CSRF token missing',
      message: 'Security token required for this request'
    });
  }

  if (!validateCSRFToken(csrfToken)) {
    return res.status(403).json({ 
      error: 'CSRF token validation failed',
      message: 'Invalid or expired security token'
    });
  }

  next();
};

// Generate CSRF token with enhanced security
const generateCSRFToken = (req, res, next) => {
  if (!req.session) {
    req.session = {};
  }
  
  // Generate cryptographically secure token
  req.session.csrfToken = generateSecureCSRFToken();
  req.session.csrfTokenCreated = Date.now();
  
  next();
};

// Validation middleware for room creation
const validateRoomCreation = [
  body('nickname')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Nickname must be between 1 and 20 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Nickname can only contain letters, numbers, underscores, and hyphens'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    next();
  }
];

// Validation middleware for joining room
const validateJoinRoom = [
  body('nickname')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Nickname must be between 1 and 20 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Nickname can only contain letters, numbers, underscores, and hyphens'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    next();
  }
];

// Session security middleware
const sessionSecurity = (req, res, next) => {
  // Set secure session options
  if (req.session) {
    req.session.cookie.secure = process.env.NODE_ENV === 'production';
    req.session.cookie.httpOnly = true;
    req.session.cookie.sameSite = 'strict';
  }
  next();
};

// Content Security Policy
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "ws:", "wss:"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
};

// Helmet configuration
const helmetConfig = helmet({
  contentSecurityPolicy: cspConfig,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

module.exports = {
  authLimiter,
  messageLimiter,
  roomCreationLimiter,
  sanitizeInput,
  csrfProtection,
  generateCSRFToken,
  validateRoomCreation,
  validateJoinRoom,
  sessionSecurity,
  helmetConfig
};