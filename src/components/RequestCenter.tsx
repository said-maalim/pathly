import { useState } from 'react';
import {
  Briefcase,
  FileText,
  Plane,
  FileX,
  Clock,
  DollarSign,
  User,
  BookOpen,
  FileCheck,
  CreditCard,
  ArrowLeftRight,
  RefreshCw,
  PauseCircle,
  ArrowRight,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { I20RequestFlow } from './I20RequestFlow';

interface RequestCenterProps {
  onBack: () => void;
  onSubmit: (requestData: any) => void;
}

type RequestCategory = 'work-auth' | 'i20-updates' | 'other-dso' | null;

const mainCategories = [
  {
    id: 'work-auth',
    title: 'Work Authorization Requests',
    description: 'CPT, OPT, and STEM OPT applications',
    icon: Briefcase,
    color: 'bg-blue-500',
    requests: [
      {
        id: 'cpt',
        name: 'CPT Request',
        description: 'Curricular Practical Training for students',
        icon: Briefcase,
        note: 'Produces new I-20'
      },
      {
        id: 'opt',
        name: 'OPT Request',
        description: 'Optional Practical Training after graduation',
        icon: Briefcase,
        note: 'Produces new I-20'
      },
      {
        id: 'stem-opt',
        name: 'STEM OPT Extension',
        description: 'Extend your OPT for STEM degree holders',
        icon: Briefcase,
        note: 'Produces new I-20'
      }
    ]
  },
  {
    id: 'i20-updates',
    title: 'I-20 Update Requests',
    description: 'Travel signatures, program changes, and I-20 replacements',
    icon: FileText,
    color: 'bg-purple-500',
    requests: [
      {
        id: 'travel',
        name: 'Travel Signature',
        description: 'Get your I-20 signed for international travel',
        icon: Plane
      },
      {
        id: 'lost',
        name: 'Lost/Damaged I-20',
        description: 'Request replacement for lost or damaged I-20',
        icon: FileX
      },
      {
        id: 'extension',
        name: 'Program Extension',
        description: 'Extend your program completion date',
        icon: Clock
      },
      {
        id: 'financial',
        name: 'Financial Update',
        description: 'Update funding information (new funding, TA/RA)',
        icon: DollarSign
      },
      {
        id: 'personal-info',
        name: 'Personal Information Change',
        description: 'Update name, address, or contact information',
        icon: User
      },
      {
        id: 'change',
        name: 'Change of Major / Level',
        description: 'Update your major or degree level',
        icon: BookOpen
      }
    ]
  },
  {
    id: 'other-dso',
    title: 'Other DSO Requests',
    description: 'Verification letters, transfers, and special assistance',
    icon: FileCheck,
    color: 'bg-green-500',
    requests: [
      {
        id: 'enrollment',
        name: 'Enrollment Verification',
        description: 'Request official enrollment verification letter',
        icon: FileCheck
      },
      {
        id: 'ssn-letter',
        name: 'Social Security Letter',
        description: 'Get SSN application support letter from DSO',
        icon: CreditCard
      },
      {
        id: 'transfer',
        name: 'Transfer Out',
        description: 'Transfer your SEVIS record to another school',
        icon: ArrowLeftRight
      },
      {
        id: 'reinstatement',
        name: 'Reinstatement Guidance',
        description: 'Request guidance for F-1 status reinstatement',
        icon: RefreshCw
      },
      {
        id: 'leave',
        name: 'Leave of Absence / Return from Leave',
        description: 'Request leave or return to active status',
        icon: PauseCircle
      }
    ]
  }
];

export function RequestCenter({ onBack, onSubmit }: RequestCenterProps) {
  const [selectedCategory, setSelectedCategory] = useState<RequestCategory>(null);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  // If a specific request is selected, show the request flow
  if (selectedRequest) {
    const allRequests = mainCategories.flatMap(cat => cat.requests);
    const request = allRequests.find(r => r.id === selectedRequest);
    
    return (
      <I20RequestFlow
        requestId={selectedRequest}
        requestName={request?.name || ''}
        onClose={() => setSelectedRequest(null)}
        onSubmit={onSubmit}
      />
    );
  }

  // If a category is selected, show its requests
  if (selectedCategory) {
    const category = mainCategories.find(c => c.id === selectedCategory);
    const CategoryIcon = category?.icon || FileText;

    return (
      <div className="min-h-screen bg-[#F5F6FA] p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" onClick={() => setSelectedCategory(null)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Request Center
          </Button>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 ${category?.color} rounded-lg flex items-center justify-center`}>
                <CategoryIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900">{category?.title}</h1>
                <p className="text-gray-600">{category?.description}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category?.requests.map((request) => {
              const RequestIcon = request.icon;
              return (
                <Card
                  key={request.id}
                  className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-[#2A73E8] group"
                  onClick={() => setSelectedRequest(request.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 bg-[#2A73E8]/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#2A73E8]/20 transition-colors">
                          <RequestIcon className="w-6 h-6 text-[#2A73E8]" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#2A73E8] transition-colors" />
                      </div>
                      <div>
                        <h3 className="text-gray-900 mb-2">{request.name}</h3>
                        <p className="text-gray-600 mb-2">{request.description}</p>
                        {request.note && (
                          <p className="text-[#2A73E8] text-sm italic">{request.note}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Main category selection screen
  return (
    <div className="min-h-screen bg-[#F5F6FA] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Request Center</h1>
          <p className="text-gray-600">Choose the type of request you need help with from your DSO</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mainCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.id}
                className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-[#2A73E8] group"
                onClick={() => setSelectedCategory(category.id as RequestCategory)}
              >
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className={`w-16 h-16 ${category.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-gray-900 mb-2">{category.title}</h2>
                      <p className="text-gray-600 mb-4">{category.description}</p>
                      <div className="flex items-center justify-center gap-2 text-[#2A73E8] group-hover:gap-3 transition-all">
                        <span>View Options</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Info Section */}
        <Card className="mt-8 shadow-sm border-0 bg-blue-50 border-l-4 border-l-[#2A73E8]">
          <CardContent className="p-6">
            <h3 className="text-gray-900 mb-2">Need Help Choosing?</h3>
            <p className="text-gray-700">
              Not sure which request to submit? Use the chat with Lexi (your AI assistant) on your dashboard, 
              or contact your Designated School Official (DSO) directly for guidance.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}