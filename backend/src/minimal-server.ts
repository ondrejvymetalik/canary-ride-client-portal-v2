const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req: any, res: any) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Get current user endpoint
app.get('/api/auth/me', (req: any, res: any) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authorization token required',
        code: 'MISSING_TOKEN'
      }
    });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authorization token required',
        code: 'MISSING_TOKEN'
      }
    });
  }

  // Basic token validation (simplified for now)
  if (token.startsWith('booqable-token-')) {
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: 'demo-user',
          email: 'me@ondrejvymetalik.cz',
          name: 'Ondřej Vymětalík',
          bookingNumber: '6011'
        }
      }
    });
  }

  return res.status(401).json({
    success: false,
    error: {
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    }
  });
});

// Login endpoint (simplified)
app.post('/api/auth/login', (req: any, res: any) => {
  const { bookingNumber, email } = req.body;
  
  if (!bookingNumber || !email) {
    return res.status(400).json({
      success: false,
      error: 'Booking number and email are required'
    });
  }

  // Simplified validation for demo
  if (bookingNumber === '6011' && email === 'me@ondrejvymetalik.cz') {
    return res.json({
      success: true,
      data: {
        token: `booqable-token-${Date.now()}`,
        refreshToken: `booqable-refresh-${Date.now()}`,
        user: {
          id: 'demo-user',
          email: email,
          bookingNumber: bookingNumber,
          firstName: 'Ondřej',
          lastName: 'Vymětalík'
        }
      }
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid booking number or email'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Minimal Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS origins: http://localhost:3000, http://localhost:3001`);
});

export default app; 