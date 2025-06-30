# Canary Ride Customer Portal - Frontend

A modern, responsive Next.js customer portal for Canary Ride motorcycle rentals.

## Features

- **Authentication**: Passwordless login with booking number/email or magic links
- **Dashboard**: Overview of current bookings, payments, and check-in status
- **Booking Management**: View current and historical bookings
- **Online Check-in**: Document upload, forms, and digital signature
- **Payment Processing**: Stripe integration for deposits and balance payments
- **Inspection Reports**: View handover and return inspection reports
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Internationalization**: Ready for multiple languages (i18n)

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Payments**: Stripe Elements
- **File Uploads**: React Dropzone
- **Digital Signatures**: React Signature Canvas
- **State Management**: React Context API
- **HTTP Client**: Axios

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Running backend server (see backend README)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the frontend directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME="Canary Ride"

# Stripe Configuration (Public Key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# App Configuration
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_SUPPORTED_FILE_TYPES=image/jpeg,image/png,application/pdf
NEXT_PUBLIC_DEFAULT_LOCALE=en

# Feature Flags
NEXT_PUBLIC_ENABLE_MAGIC_LINK=true
NEXT_PUBLIC_ENABLE_DIGITAL_SIGNATURE=true
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                     # Next.js App Router pages
│   ├── (dashboard)/         # Dashboard layout group
│   │   ├── dashboard/       # Main dashboard page
│   │   ├── bookings/        # Bookings management
│   │   ├── checkin/         # Online check-in process
│   │   ├── payments/        # Payment management
│   │   ├── inspections/     # Inspection reports
│   │   └── layout.tsx       # Dashboard layout
│   ├── login/               # Login page
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx            # Home page (redirects)
│   └── providers.tsx        # Context providers
├── components/              # Reusable UI components
│   ├── layout/             # Layout components
│   ├── forms/              # Form components
│   ├── ui/                 # Basic UI components
│   └── common/             # Common components
├── contexts/               # React contexts
│   └── AuthContext.tsx     # Authentication context
├── services/               # API service layer
│   ├── api.ts              # Base API client
│   ├── auth.ts             # Authentication service
│   ├── bookings.ts         # Bookings service
│   ├── payments.ts         # Payments service
│   ├── checkin.ts          # Check-in service
│   └── inspections.ts      # Inspections service
├── hooks/                  # Custom React hooks
├── utils/                  # Utility functions
├── types/                  # TypeScript type definitions
└── locales/               # i18n translation files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Key Components

### Authentication
- Booking number + email login
- Magic link authentication
- JWT token management with refresh
- Automatic token refresh on API calls

### Dashboard
- Current booking overview
- Payment status indicators
- Check-in progress tracking
- Quick action links

### Online Check-in
- Multi-step process with progress tracking
- Document upload with validation
- Form completion with validation
- Digital signature for terms acceptance

### Payment Management
- Stripe Elements integration
- Deposit and balance payments
- Payment history
- Multiple payment methods

### Inspection Reports
- Handover and return inspections
- Photo galleries
- Damage reports with severity indicators
- Condition comparison tools

## API Integration

The frontend communicates with the backend API through service layers:

- **Base URL**: Configured via `NEXT_PUBLIC_API_URL`
- **Authentication**: Bearer token in Authorization header
- **Error Handling**: Centralized error handling with user-friendly messages
- **Loading States**: Global loading indicators
- **Retry Logic**: Automatic token refresh on 401 errors

## Styling Guidelines

### Tailwind CSS Classes
- Use the predefined component classes in `globals.css`
- Follow the established color palette (primary, secondary)
- Maintain consistent spacing using Tailwind's spacing scale

### Component Structure
- Use semantic HTML elements
- Implement proper ARIA attributes for accessibility
- Follow responsive design patterns (mobile-first)

### Custom Classes
- `.btn-*` for buttons
- `.card-*` for cards
- `.badge-*` for status indicators
- `.input` for form inputs

## Development Guidelines

### Code Style
- Use TypeScript for all components
- Follow the established file naming conventions
- Use functional components with hooks
- Implement proper error boundaries

### State Management
- Use React Context for global state (auth, theme)
- Use local state for component-specific data
- Implement proper loading and error states

### Performance
- Use Next.js Image component for optimized images
- Implement lazy loading for heavy components
- Use React.memo for expensive components
- Optimize bundle size with proper imports

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker
```bash
# Build Docker image
docker build -t canary-ride-frontend .

# Run container
docker run -p 3000:3000 canary-ride-frontend
```

### Environment Variables for Production
Ensure all environment variables are properly configured in your deployment platform:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- Additional configuration variables as needed

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured for your frontend domain
2. **API Connection**: Verify `NEXT_PUBLIC_API_URL` is correct
3. **Stripe Issues**: Check Stripe publishable key configuration
4. **Build Errors**: Run `npm run type-check` to identify TypeScript issues

### Debug Mode
Enable debug logging by setting:
```env
NEXT_PUBLIC_DEBUG=true
```

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for all new interfaces
3. Include proper error handling
4. Test your changes thoroughly
5. Update documentation as needed

## License

Private - Canary Ride Internal Use Only 