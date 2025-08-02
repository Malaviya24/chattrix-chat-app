const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

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
  5, // 5 attempts
  'Too many authentication attempts. Please try again later.'
);

const messageLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  30, // 30 messages per minute
  'Too many messages. Please slow down.'
);

const roomCreationLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 rooms per hour
  'Too many room creations. Please try again later.'
);

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potentially dangerous characters
        obj[key] = obj[key]
          .replace(/[<>]/g, '') // Remove < and >
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/on\w+=/gi, '') // Remove event handlers
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

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'];
  const sessionToken = req.session?.csrfToken;

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return res.status(403).json({ error: 'CSRF token validation failed' });
  }

  next();
};

// Generate CSRF token
const generateCSRFToken = (req, res, next) => {
  if (!req.session) {
    req.session = {};
  }
  
  req.session.csrfToken = crypto.randomBytes(32).toString('hex');
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
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
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
    .isLength({ min: 1 })
    .withMessage('Password is required'),
  
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