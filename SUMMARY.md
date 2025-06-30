# Canary Ride Client Portal V2

## Project Overview

A comprehensive customer web portal for Canary Ride motorcycle rentals in the Canary Islands. This application allows customers to manage their bookings, complete online check-in, make payments, and view inspection reports through a secure, modern web interface.

## Business Context

**Canary Ride** operates motorcycle rental services in Gran Canaria and Tenerife. The portal integrates with three main systems:
- **Booqable**: Inventory management, bookings, and customer data
- **Whip Around**: Fleet maintenance and inspection reports
- **Stripe**: Payment processing and financial transactions

## Architecture & Tech Stack

### Backend (Node.js/Express/TypeScript)
- **Framework**: Express.js with TypeScript
- **Authentication**: JWT tokens + Magic link (passwordless)
- **API Integration**: Axios for external service calls
- **File Uploads**: Multer for document handling
- **Email Service**: Nodemailer for notifications
- **Logging**: Winston with structured logging
- **Security**: Helmet, CORS, rate limiting, input validation

### Frontend (Next.js/React)
- **Framework**: Next.js 14 with TypeScript
- **UI Library**: React with modern components
- **Styling**: CSS Modules / Tailwind CSS (to be configured)
- **State Management**: React hooks + Context API
- **Forms**: React Hook Form with validation
- **Internationalization**: react-i18next (i18n ready)

## Project Structure

```
canary-ride-client-portal/
├── package.json                 # Root workspace configuration
├── SUMMARY.md                   # This documentation file
├── frontend/                    # Next.js client application
│   ├── package.json
│   ├── next.config.js
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   ├── components/         # Reusable UI components
│   │   │   ├── layout/         # Layout components (Header, etc.)
│   │   │   ├── ui/             # UI components (PhotoCarousel, etc.)
│   │   │   └── SignatureModal.tsx  # Digital signature pad component
│   │   ├── services/           # API service layer
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils/              # Helper functions
│   │   ├── types/              # TypeScript definitions
│   │   └── locales/            # i18n translation files
│   └── public/                 # Static assets
└── backend/                    # Express.js API server
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   ├── index.ts            # Server entry point
    │   ├── routes/             # API route handlers
    │   │   ├── auth.ts         # Authentication endpoints
    │   │   ├── bookings.ts     # Booking management
    │   │   ├── checkin.ts      # Online check-in process
    │   │   ├── payments.ts     # Payment processing
    │   │   ├── inspections.ts  # Inspection reports
    │   │   └── health.ts       # Health check endpoints
    │   ├── services/           # Business logic layer
    │   │   ├── authService.ts      # JWT + magic link auth
    │   │   ├── booqableService.ts  # Booqable API integration
    │   │   ├── stripeService.ts    # Stripe payment processing
    │   │   ├── whipAroundService.ts # Whip Around inspections
    │   │   └── emailService.ts     # Email notifications
    │   ├── middleware/         # Express middleware
    │   │   ├── errorHandler.ts     # Global error handling
    │   │   └── requestLogger.ts    # Request/response logging
    │   └── utils/              # Utility functions
    │       └── logger.ts           # Winston logging configuration
    ├── uploads/                # Temporary file storage
    └── logs/                   # Application logs
```

## Key Features

### 1. Authentication & Security
- **Passwordless Login**: Booking number + email verification
- **Magic Link**: Email-based secure access
- **JWT Tokens**: Secure session management with refresh tokens
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Secure cross-origin requests

### 2. Booking Management
- **View Bookings**: Current and historical rentals
- **Booking Details**: Comprehensive rental information
- **Status Tracking**: Real-time booking status updates
- **Date Filtering**: Current vs. historical bookings

### 3. Online Check-in Process
- **Document Upload**: Driver's license and additional documents
- **Form Completion**: Emergency contacts, experience level, medical conditions
- **Digital Signature**: Interactive signature pad for contract signing
  - **Mouse/Finger Drawing**: Support for both desktop and mobile devices
  - **Canvas-based Signature**: Smooth drawing experience with react-signature-canvas
  - **Base64 PNG Export**: Signatures saved as PNG images
  - **Clear Function**: Allow users to reset and redraw signatures
  - **Visual Feedback**: Real-time signature status indication
- **Progress Tracking**: Step-by-step completion status
- **File Validation**: Secure document processing

### 4. Payment Processing (Stripe Integration)
- **Deposit Payments**: Secure deposit processing
- **Balance Payments**: Remaining amount handling
- **Payment Methods**: Credit/debit card management
- **Pre-authorization**: Hold funds without immediate charge
- **Payment History**: Complete transaction records
- **Refund Processing**: Automated refund handling

### 5. Inspection Reports (Whip Around Integration)
- **Handover Inspections**: Pre-rental vehicle condition
- **Return Inspections**: Post-rental condition checks
- **Photo Gallery**: High-resolution inspection images
- **Damage Reports**: Detailed damage documentation
- **Mileage Tracking**: Odometer readings and usage
- **Inspection Summary**: Comprehensive condition overview

### 6. Email Notifications
- **Magic Link Delivery**: Secure login links
- **Check-in Reminders**: Pre-arrival notifications
- **Payment Reminders**: Outstanding balance alerts
- **Custom Templates**: Branded email communications

## API Endpoints

### Authentication (`/api/auth/`)
- `POST /login` - Login with booking number + email
- `POST /magic-link` - Send magic link to email
- `GET /magic-link/verify` - Verify magic link token
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout and invalidate token
- `GET /me` - Get current user info

### Bookings (`/api/bookings/`)
- `GET /` - Get all customer bookings
- `GET /:id` - Get specific booking details
- `GET /current` - Get current/active bookings
- `GET /history` - Get past bookings
- `PUT /:id/update` - Update booking information

### Check-in (`/api/checkin/`)
- `GET /:bookingId/status` - Get check-in completion status
- `POST /:bookingId/documents` - Upload check-in documents
- `POST /:bookingId/forms` - Submit check-in forms
- `POST /:bookingId/terms` - Accept terms and conditions
- `POST /:bookingId/complete` - Complete check-in process

### Payments (`/api/payments/`)
- `GET /:bookingId/status` - Get payment status
- `POST /:bookingId/setup-intent` - Create Stripe setup intent
- `POST /:bookingId/pay-deposit` - Process deposit payment
- `POST /:bookingId/pay-balance` - Process balance payment
- `POST /:bookingId/authorize-deposit` - Pre-authorize deposit
- `GET /:bookingId/history` - Get payment history

### Inspections (`/api/inspections/`)
- `GET /:bookingId` - Get all inspections
- `GET /:bookingId/handover` - Get handover inspection
- `GET /:bookingId/return` - Get return inspection
- `GET /:bookingId/photos` - Get inspection photos
- `GET /:bookingId/damages` - Get damage reports
- `GET /:bookingId/summary` - Get inspection summary

### Health (`/api/health/`)
- `GET /` - Basic health check
- `GET /detailed` - Detailed system status

## Environment Configuration

### Backend Environment Variables

Create `/backend/.env` file with:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@canaryride.com
FROM_NAME=Canary Ride

# Booqable API Configuration
BOOQABLE_API_URL=https://canaryride.booqable.com/api/4/
BOOQABLE_API_KEY=2071e2b620ed3f68870c9a70ad90dc22fbd1e2c68e90bf679c0049dd5161ff11

# Whip Around API Configuration
WHIP_AROUND_API_URL=https://api.whiparound.com/v1
WHIP_AROUND_API_KEY=7NOZCOiN4VzHaOi8gQPlxub8dQX0u87sP6uv0kzx9onks5A4tNrOQ20507tX7dqeyk5BhzjnPJfyl2sDoqtuj6BPOZZRur1kVTkuCtjHyf1E6kKozGxfrimS9l5ckcj2

# Stripe Configuration (Sandbox)
STRIPE_SECRET_KEY=sk_test_51RfGM32fFS1IN43jjKlB6qSpMqfIvcTwrUtUbcKfl6I3HXlT1q323VEya99tFPLf7WLGLEGH1lFDhOAnFkwmy3ug00yFiROBXq
STRIPE_PUBLISHABLE_KEY=pk_test_51RfGM32fFS1IN43jhwdlvJ8uFEPN6ifNltpvNnRymLyPCLTV5fl5dVxJvkWlYHgA6MVvNbvWLfTe6gG6sU6LtUq800Tc01TKtt
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp,application/pdf

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
```

## Installation & Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0

### Quick Start

1. **Clone and Install Dependencies**
   ```bash
   cd CR-Client-Portal-V2
   npm run install:all
   ```

2. **Configure Environment**
   ```bash
   # Create backend environment file
   cp backend/.env.example backend/.env
   # Edit backend/.env with your API keys
   ```

3. **Start Development**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:backend  # Backend on http://localhost:5000
   npm run dev:frontend # Frontend on http://localhost:3000
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm run start
   ```

### Available Scripts

- `npm run dev` - Start both frontend and backend in development
- `npm run build` - Build both applications for production
- `npm run start` - Start both applications in production mode
- `npm run test` - Run all tests
- `npm run lint` - Run linting on all code

## Security Features

### Data Protection
- **GDPR Compliance**: User data handling follows GDPR guidelines
- **API Key Security**: All secrets stored in backend environment only
- **Input Sanitization**: All user inputs are validated and sanitized
- **File Upload Security**: File type validation and size limits
- **Audit Logging**: Comprehensive activity logging

### Authentication Security
- **No Password Storage**: Passwordless authentication system
- **Token Blacklisting**: Secure logout with token invalidation
- **Magic Link Expiry**: Time-limited authentication links
- **Rate Limiting**: Protection against brute force attacks

## Logging & Monitoring

### Log Levels
- **ERROR**: System errors and exceptions
- **WARN**: Warning conditions and recoverable errors
- **INFO**: General application flow and user actions
- **DEBUG**: Detailed debugging information (development only)

### Log Storage
- **File Logs**: Rotating log files in `/backend/logs/`
- **Console Logs**: Development environment console output
- **Structured Logging**: JSON format for easy parsing

## Internationalization (i18n)

The application is built with internationalization support:
- **Translation Files**: JSON-based translation system
- **Language Support**: Ready for Spanish, German, Czech, Italian, French
- **Dynamic Loading**: Language switching without page reload
- **Fallback System**: Default to English if translation missing

## Testing Strategy

### Backend Testing
- **Unit Tests**: Service layer and utility function tests
- **Integration Tests**: API endpoint testing
- **Security Tests**: Authentication and authorization validation

### Frontend Testing
- **Component Tests**: React component unit tests
- **Integration Tests**: User flow testing
- **E2E Tests**: Full application workflow testing

## Deployment Considerations

### Production Checklist
- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] API keys rotated from sandbox to production
- [ ] Email SMTP configured
- [ ] Error monitoring setup
- [ ] Backup strategy implemented
- [ ] SSL certificates installed

### Scalability Features
- **Modular Architecture**: Easy to extend with new features
- **Service Separation**: Clean API boundaries
- **Caching Strategy**: Ready for Redis implementation
- **Database Ready**: Prepared for database integration if needed

## Support & Maintenance

### Contact Information
- **Email**: info@canaryride.com
- **Phone**: +34 828 685 006 (Gran Canaria)
- **Phone**: +34 822 680 805 (Tenerife)

### Development Team
- Modular codebase allows for easy handoff to development teams
- Comprehensive documentation for maintenance
- Clear separation of concerns for feature additions

---

*Last Updated: July 2025*
*Version: 1.1.0*

### Recent Updates

#### WhipAround API Integration (v1.0.0-whiparound) - July 2025
- **Full WhipAround API Integration**: Real-time vehicle inspection data
  - Integrated WhipAround API v4 for vehicle inspection retrieval
  - Automatic inspection search by booking number
  - Support for inspection photos, signatures, and PDF reports
  - Caching mechanism for improved performance (5-minute cache)
  - Endpoints: `/api/inspections/:bookingId` and `/api/inspections/:bookingId/status`
  - Successfully tested with real inspection data (booking #6004)
  - Inspector and rider signatures displayed in the UI
  - Vehicle condition photos (motorcycle, helmet, fuel tank)
  - Kilometer readings and fuel level tracking
  
- **Signature Modal Implementation**: Added interactive signature pad for digital contract signing
  - Replaced text-based signature with canvas-based drawing
  - Support for mouse and touch input
  - Integrated with contracts page for seamless signing experience 