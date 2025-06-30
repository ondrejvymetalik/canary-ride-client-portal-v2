# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-whiparound] - 2025-07-01

### Added
- **WhipAround API Integration** - Full integration with WhipAround API v4 for vehicle inspection management
  - Real-time inspection data retrieval by booking number
  - Automatic inspection matching with Booqable bookings
  - Support for all inspection data including:
    - Vehicle condition photos (motorcycle, helmet, fuel tank)
    - Digital signatures (inspector and rider)
    - Kilometer/mileage readings
    - Fuel level with visual indicators
    - PDF inspection report links
  - Intelligent caching system (5-minute cache duration)
  - New API endpoints:
    - `GET /api/inspections/:bookingId` - Full inspection details
    - `GET /api/inspections/:bookingId/status` - Quick inspection status check
  - Error handling with fallback data for demo purposes
  - Successfully tested with real inspection data (booking #6004)

### Changed
- Updated `simple-index.ts` to use WhipAround API environment variables
- Enhanced inspection data processing to handle WhipAround's card-based structure
- Improved error handling and logging for inspection-related endpoints

### Fixed
- TypeScript compilation errors in `simple-index.ts`
- WhipAround API data structure parsing issues
- Inspection search functionality now properly matches booking numbers

### Technical Details
- WhipAround API Base URL: `https://api.whip-around.com/api/public/v4`
- Authentication: X-API-Key header
- Inspection data includes comprehensive vehicle handover information
- Integration tested with live data from WhipAround platform

## [1.0.0] - 2025-06-30

### Added
- Initial release of Canary Ride Client Portal V2
- Complete booking management system
- Online check-in process with document upload
- Digital signature implementation for contracts
- Payment processing with Stripe integration
- Multi-language support (i18n ready)
- JWT-based authentication with magic links
- Integration with Booqable API for booking data
- Responsive design for mobile and desktop

### Security
- Passwordless authentication system
- API key protection (backend only)
- Input validation and sanitization
- Rate limiting for API endpoints
- CORS protection

### Infrastructure
- Next.js 14 frontend with TypeScript
- Express.js backend with TypeScript
- Modular architecture for easy maintenance
- Comprehensive logging with Winston
- Environment-based configuration 