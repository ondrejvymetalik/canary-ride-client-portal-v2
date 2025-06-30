'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { Providers } from '../providers';

function LoginPageContent() {
  const { login, sendMagicLink, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [loginMethod, setLoginMethod] = useState<'booking' | 'magic'>('booking');
  const [formData, setFormData] = useState({
    bookingNumber: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (loginMethod === 'booking' && !formData.bookingNumber.trim()) {
      newErrors.bookingNumber = 'Booking number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🎯 LoginPage: Form submitted with method:', loginMethod, 'data:', formData);
    
    if (!validateForm()) {
      console.log('❌ LoginPage: Form validation failed');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (loginMethod === 'booking') {
        console.log('🔑 LoginPage: Attempting booking login');
        const result = await login({
          bookingNumber: formData.bookingNumber,
          email: formData.email,
        });
        console.log('🔑 LoginPage: Login result:', result);
        console.log('🔑 LoginPage: result.success is:', result.success, typeof result.success);
        console.log('🔑 LoginPage: Full result object:', JSON.stringify(result, null, 2));

        if (result.success) {
          console.log('✅ LoginPage: Login successful, redirecting to dashboard');
          console.log('🚀 LoginPage: Executing router.push to /dashboard');
          router.push('/dashboard');
        } else {
          console.log('❌ LoginPage: Login failed:', result.error);
          console.log('❌ LoginPage: Full error result:', JSON.stringify(result, null, 2));
          setErrors({ general: result.error || 'Login failed' });
        }
      } else {
        console.log('📧 LoginPage: Attempting magic link');
        const result = await sendMagicLink({
          email: formData.email,
          bookingNumber: formData.bookingNumber || undefined,
        });

        if (result.success) {
          setMagicLinkSent(true);
        } else {
          setErrors({ general: result.error || 'Failed to send magic link' });
        }
      }
    } catch (error) {
      console.log('💥 LoginPage: Exception during login:', error);
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      console.log('🏁 LoginPage: Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner w-8 h-8 text-primary-600"></div>
      </div>
    );
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a secure login link to <strong>{formData.email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-8">
              The link will expire in 15 minutes for security reasons.
            </p>
            <button
              onClick={() => {
                setMagicLinkSent(false);
                setFormData({ bookingNumber: '', email: '' });
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">CR</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Canary Ride</h2>
          <p className="text-gray-600">Access your motorcycle rental booking</p>
        </div>

        {/* Login Method Toggle */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setLoginMethod('booking')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginMethod === 'booking'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            Booking Login
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('magic')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginMethod === 'magic'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Magic Link
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            </div>
          )}

          {loginMethod === 'booking' && (
            <div>
              <label htmlFor="bookingNumber" className="label">
                Booking Number
              </label>
              <input
                id="bookingNumber"
                name="bookingNumber"
                type="text"
                placeholder="Enter your booking number"
                value={formData.bookingNumber}
                onChange={handleInputChange}
                className={`input mt-1 ${errors.bookingNumber ? 'border-red-300' : ''}`}
              />
              {errors.bookingNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.bookingNumber}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="email" className="label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleInputChange}
              className={`input mt-1 ${errors.email ? 'border-red-300' : ''}`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary btn-lg w-full flex items-center justify-center"
          >
            {isSubmitting ? (
              <div className="spinner w-4 h-4 mr-2"></div>
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            {loginMethod === 'booking' ? 'Sign In' : 'Send Magic Link'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          <p>
            Need help? Contact us at{' '}
            <a
              href="mailto:hello@canaryride.com"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              hello@canaryride.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Providers>
      <LoginPageContent />
    </Providers>
  );
} 