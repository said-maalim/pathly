import { ArrowLeft, BookOpen, Search, FileText, Video, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface ResourcesPageProps {
  onBack: () => void;
}

export function ResourcesPage({ onBack }: ResourcesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'All Resources', count: 24 },
    { name: 'Visa Guides', count: 8 },
    { name: 'SEVIS Information', count: 6 },
    { name: 'Work Authorization', count: 5 },
    { name: 'Travel Guidelines', count: 5 }
  ];

  const resources = [
    {
      id: 1,
      title: 'Understanding F-1 Visa Status',
      category: 'Visa Guides',
      type: 'Article',
      description: 'Comprehensive guide to maintaining your F-1 visa status while studying in the United States.',
      readTime: '10 min read',
      icon: FileText
    },
    {
      id: 2,
      title: 'SEVIS Compliance Checklist',
      category: 'SEVIS Information',
      type: 'Article',
      description: 'Everything you need to know about staying SEVIS compliant throughout your studies.',
      readTime: '8 min read',
      icon: FileText
    },
    {
      id: 3,
      title: 'CPT vs OPT: What\'s the Difference?',
      category: 'Work Authorization',
      type: 'Video',
      description: 'Learn about Curricular Practical Training and Optional Practical Training options.',
      readTime: '15 min watch',
      icon: Video
    },
    {
      id: 4,
      title: 'International Travel on F-1 Visa',
      category: 'Travel Guidelines',
      type: 'Article',
      description: 'Guidelines for traveling outside the US and re-entering on your F-1 visa.',
      readTime: '12 min read',
      icon: FileText
    },
    {
      id: 5,
      title: 'How to Request a New I-20',
      category: 'SEVIS Information',
      type: 'Article',
      description: 'Step-by-step guide to requesting a new I-20 for various situations.',
      readTime: '6 min read',
      icon: FileText
    },
    {
      id: 6,
      title: 'OPT Application Process',
      category: 'Work Authorization',
      type: 'Video',
      description: 'Complete walkthrough of the Optional Practical Training application process.',
      readTime: '20 min watch',
      icon: Video
    },
    {
      id: 7,
      title: 'Maintaining Your Immigration Status',
      category: 'Visa Guides',
      type: 'Article',
      description: 'Best practices for maintaining valid immigration status throughout your program.',
      readTime: '9 min read',
      icon: FileText
    },
    {
      id: 8,
      title: 'Grace Period Explained',
      category: 'Visa Guides',
      type: 'Article',
      description: 'Understanding your grace period options after graduation or program completion.',
      readTime: '7 min read',
      icon: FileText
    }
  ];

  const filteredResources = searchQuery
    ? resources.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : resources;

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-gray-900">Resources</h1>
              <p className="text-gray-600">Immigration guides and helpful articles</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A73E8] focus:border-transparent"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8 flex flex-wrap gap-3">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded-lg transition-colors ${
                index === 0
                  ? 'bg-[#2A73E8] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => {
            const Icon = resource.icon;
            return (
              <div
                key={resource.id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      resource.type === 'Video' ? 'bg-purple-100' : 'bg-[#2A73E8]/10'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        resource.type === 'Video' ? 'text-purple-600' : 'text-[#2A73E8]'
                      }`} />
                    </div>
                    <span className="text-gray-500 px-3 py-1 rounded-full bg-gray-100">
                      {resource.type}
                    </span>
                  </div>
                  
                  <h3 className="text-gray-900 mb-2 group-hover:text-[#2A73E8] transition-colors">
                    {resource.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {resource.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[#2A73E8]">{resource.category}</span>
                    <span className="text-gray-500">{resource.readTime}</span>
                  </div>
                </div>
                
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between group-hover:bg-[#2A73E8]/5 transition-colors">
                  <span className="text-gray-700 group-hover:text-[#2A73E8]">Read More</span>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#2A73E8]" />
                </div>
              </div>
            );
          })}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600">Try adjusting your search query</p>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-white rounded-lg border border-gray-200 p-8 text-center">
          <BookOpen className="w-12 h-12 text-[#2A73E8] mx-auto mb-4" />
          <h3 className="text-gray-900 mb-2">Can't find what you're looking for?</h3>
          <p className="text-gray-600 mb-6">
            Our DSO team is here to help answer any questions you may have.
          </p>
          <button className="px-6 py-3 bg-[#2A73E8] text-white rounded-lg hover:bg-[#1557b0] transition-colors">
            Contact DSO Office
          </button>
        </div>
      </main>
    </div>
  );
}
