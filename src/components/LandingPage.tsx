import { Globe, Shield, Users, ArrowRight, CheckCircle2, MessageSquare, Building2, GraduationCap } from 'lucide-react';
import { Button } from './ui/button';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2A73E8] rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl text-gray-900">Pathly</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-gray-700 hover:text-[#2A73E8] transition-colors">Home</a>
              <a href="#features" className="text-gray-700 hover:text-[#2A73E8] transition-colors">Features</a>
              <a href="#benefits" className="text-gray-700 hover:text-[#2A73E8] transition-colors">Benefits</a>
              <Button variant="outline" className="text-[#2A73E8] border-[#2A73E8]" onClick={() => onNavigate('quick-test')}>
                🧪 Quick Test
              </Button>
              <Button className="bg-[#2A73E8] hover:bg-[#1557b0] text-white" onClick={() => onNavigate('university-choice')}>
                Access Portal
              </Button>
            </nav>
            
            <button className="md:hidden p-2">
              <div className="w-6 h-0.5 bg-gray-700 mb-1.5"></div>
              <div className="w-6 h-0.5 bg-gray-700 mb-1.5"></div>
              <div className="w-6 h-0.5 bg-gray-700"></div>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-24 px-4 sm:px-6 lg:px-8" id="home">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-gray-900 mb-6">
              International Student Immigration Management for Universities
            </h1>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Pathly streamlines visa and immigration processes for international offices. 
              Empower DSOs and students with seamless document management, request tracking, 
              and AI-powered support—all in one secure platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-[#2A73E8] hover:bg-[#1557b0] text-white px-8 py-6 rounded-lg" onClick={() => onNavigate('university-choice')}>
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" className="border-[#2A73E8] text-[#2A73E8] hover:bg-[#F5F6FA] px-8 py-6 rounded-lg">
                Request Demo
              </Button>
            </div>
          </div>

          {/* Illustrations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-[#F5F6FA] rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Building2 className="w-8 h-8 text-[#2A73E8]" />
              </div>
              <h3 className="text-gray-900 mb-2">For Universities</h3>
              <p className="text-gray-600">
                Built specifically for international student offices and DSOs
              </p>
            </div>

            <div className="bg-[#F5F6FA] rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Shield className="w-8 h-8 text-[#2A73E8]" />
              </div>
              <h3 className="text-gray-900 mb-2">Secure & Compliant</h3>
              <p className="text-gray-600">
                FERPA-compliant with bank-level encryption for sensitive data
              </p>
            </div>

            <div className="bg-[#F5F6FA] rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <GraduationCap className="w-8 h-8 text-[#2A73E8]" />
              </div>
              <h3 className="text-gray-900 mb-2">Student Success</h3>
              <p className="text-gray-600">
                Help students navigate their immigration journey with confidence
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#F5F6FA] px-4 sm:px-6 lg:px-8" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-gray-900 mb-4">Powerful Features for Your International Office</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything your DSO team and international students need to manage visa processes efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Users, title: 'DSO Request Center', desc: 'Centralized hub for managing all student visa requests and applications' },
              { icon: Globe, title: 'Document Verification', desc: 'Streamlined document review and approval workflows for DSOs' },
              { icon: MessageSquare, title: 'Communication Hub', desc: 'Built-in messaging system with email templates and history' },
              { icon: CheckCircle2, title: 'Student Portal', desc: 'Self-service portal for students to submit requests and track status' },
              { icon: Shield, title: 'Secure Storage', desc: 'Encrypted document storage with role-based access control' }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#2A73E8]/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[#2A73E8]" />
                </div>
                <h3 className="text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8" id="benefits">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-gray-900 mb-4">Why Universities Choose Pathly</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-[#2A73E8]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-[#2A73E8]" />
              </div>
              <div>
                <h3 className="text-gray-900 mb-2">Reduce Administrative Burden</h3>
                <p className="text-gray-600">
                  Automate request tracking, document management, and communication workflows. 
                  Save your DSO team hours every week.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-[#2A73E8]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-[#2A73E8]" />
              </div>
              <div>
                <h3 className="text-gray-900 mb-2">Improve Student Experience</h3>
                <p className="text-gray-600">
                  Give students 24/7 access to their requests, documents, and AI-powered answers. 
                  Reduce email volume and phone calls.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-[#2A73E8]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-[#2A73E8]" />
              </div>
              <div>
                <h3 className="text-gray-900 mb-2">Stay Compliant</h3>
                <p className="text-gray-600">
                  Built-in compliance checks, audit trails, and deadline reminders ensure 
                  your office meets all immigration regulations.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-[#2A73E8]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-[#2A73E8]" />
              </div>
              <div>
                <h3 className="text-gray-900 mb-2">Scalable Solution</h3>
                <p className="text-gray-600">
                  Whether you have 100 or 10,000 international students, Pathly scales 
                  with your institution's needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F5F6FA]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-gray-900 mb-6">Ready to Transform Your International Office?</h2>
          <p className="text-gray-600 mb-8">
            Join leading universities using Pathly to streamline international student services.
          </p>
          <Button className="bg-[#2A73E8] hover:bg-[#1557b0] text-white px-8 py-6 rounded-lg" onClick={() => onNavigate('university-choice')}>
            Access Your Portal
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <p>© 2025 Pathly. Trusted by international offices nationwide.</p>
          <button 
            onClick={() => onNavigate('cleanup-utility')}
            className="mt-4 text-sm text-gray-400 hover:text-[#2A73E8] underline"
          >
            🔧 Cleanup Utility (Dev)
          </button>
        </div>
      </footer>
    </div>
  );
}