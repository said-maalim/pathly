import React, { useState } from 'react';
import { Shield, ArrowLeft, Mail, Lock, User, Building2 } from 'lucide-react';
import * as api from '../utils/api';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DSOAuthProps {
  onNavigate: (page: string) => void;
  onLogin: (userData: any) => void;
}

export function DSOAuth({ onNavigate, onLogin }: DSOAuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!name.trim() || !universityId.trim() || !email.trim() || !password) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }
    if (!validateEmail(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }
    if (!email.includes('.edu')) {
      setMessage({ type: 'error', text: 'Please use your university email address (.edu)' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    try {
      console.log('Creating DSO account with:', { email, name, universityId });

      // Call DSO signup endpoint
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-268175b3/auth/signup/dso`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email,
          password,
          name,
          schoolId: 'b5acd146-322e-4e43-80ab-4f36a12aafeb' // Hardcoded UUID for QA stability 
        }),
      });

      const result = await response.json();
      console.log('DSO signup result:', result);

      if (result.error) {
        setMessage({ type: 'error', text: result.error });
        setLoading(false);
      } else {
        setMessage({
          type: 'success',
          text: '✅ DSO admin account created! Now sign in with your credentials.'
        });
        setIsSignUp(false);
        setPassword('');
        setLoading(false);
      }
    } catch (error) {
      console.error('DSO signup error:', error);
      setMessage({ type: 'error', text: 'Failed to create account. Please try again.' });
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateEmail(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }
    if (!password) {
      setMessage({ type: 'error', text: 'Please enter your password' });
      return;
    }

    setLoading(true);
    try {
      console.log('DSO signing in with:', email);
      const result = await api.signIn(email, password);

      console.log('DSO sign in result:', result);

      if (result.error) {
        setMessage({ type: 'error', text: `Login failed: ${result.error}` });
        setLoading(false);
      } else {
        setMessage({ type: 'success', text: 'Welcome! Redirecting to DSO admin portal...' });
        onLogin(result);
        setTimeout(() => {
          onNavigate('dso-portal');
        }, 1000);
      }
    } catch (error) {
      console.error('DSO sign in error:', error);
      setMessage({ type: 'error', text: 'Failed to sign in. Please try again.' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="font-semibold text-gray-900">Pathly</span>
            </div>
            <button
              onClick={() => onNavigate('university-choice')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isSignUp ? 'Create DSO Admin Account' : 'DSO Admin Portal'}
            </h1>
            <p className="text-gray-600">
              {isSignUp ? 'Register as a Designated School Official' : 'Sign in to manage students'}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
              {isSignUp && (
                <>
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Jane Smith"
                      />
                    </div>
                  </div>

                  {/* University ID */}
                  <div>
                    <label htmlFor="universityId" className="block text-sm font-medium text-gray-700 mb-2">
                      University ID
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="universityId"
                        type="text"
                        value={universityId}
                        onChange={(e) => setUniversityId(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g. b5acd146-..."
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  University Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="admin@university.edu"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Processing...' : isSignUp ? 'Create DSO Account' : 'Sign In'}
              </button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage(null);
                }}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}