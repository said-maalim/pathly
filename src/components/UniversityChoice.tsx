import React from 'react';
import { GraduationCap, Shield, ArrowLeft } from 'lucide-react';

interface UniversityChoiceProps {
  onNavigate: (page: string) => void;
}

export function UniversityChoice({ onNavigate }: UniversityChoiceProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
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
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              University Portal
            </h1>
            <p className="text-xl text-gray-600">
              Choose your role to continue
            </p>
          </div>

          {/* Options */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Student Portal */}
            <button
              onClick={() => onNavigate('student-auth')}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-blue-500 transform hover:scale-105"
            >
              <div className="absolute top-8 right-8 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                <GraduationCap className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              
              <div className="pr-20">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Student Portal
                </h2>
                <p className="text-gray-600 mb-6">
                  Access your visa documents, request I-20s, apply for OPT, and manage your immigration status.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Request I-20 documents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Apply for OPT/STEM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Upload required documents</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 text-blue-600 font-medium group-hover:gap-3 transition-all">
                <span>Continue as Student</span>
                <span>→</span>
              </div>
            </button>

            {/* DSO Portal */}
            <button
              onClick={() => onNavigate('dso-auth')}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-indigo-500 transform hover:scale-105"
            >
              <div className="absolute top-8 right-8 w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                <Shield className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              
              <div className="pr-20">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  DSO Admin Portal
                </h2>
                <p className="text-gray-600 mb-6">
                  Manage student records, update SEVIS status, request documents, and maintain compliance.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    <span>Manage SEVIS records</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    <span>Review student requests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    <span>Send compliance reminders</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 text-indigo-600 font-medium group-hover:gap-3 transition-all">
                <span>Continue as DSO Admin</span>
                <span>→</span>
              </div>
            </button>
          </div>

          {/* Info Note */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              First time here? You'll be able to create an account on the next page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
