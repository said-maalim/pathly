import { useState } from 'react';
import {
  Mail,
  Send,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  User,
  Calendar,
  FileText,
  Plus,
  Copy,
  Edit,
  Trash2,
  Home,
  Globe,
  Bell,
  MessageSquare,
  Users,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface DSOCommunicationCenterProps {
  onBack: () => void;
  onLogout?: () => void;
  userName?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  lastUsed?: string;
  usageCount: number;
}

interface Message {
  id: string;
  recipient: string;
  recipientEmail: string;
  subject: string;
  body: string;
  sentDate: string;
  sentBy: string;
  status: 'Sent' | 'Delivered' | 'Read';
  template?: string;
}

export function DSOCommunicationCenter({ onBack, onLogout, userName = 'DSO Admin' }: DSOCommunicationCenterProps) {
  const [selectedTab, setSelectedTab] = useState<'compose' | 'templates' | 'history'>('compose');
  const [composeMode, setComposeMode] = useState<'individual' | 'bulk'>('individual');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [recipient, setRecipient] = useState('');
  const [bulkRecipientGroup, setBulkRecipientGroup] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [newTemplateOpen, setNewTemplateOpen] = useState(false);
  const [editTemplateOpen, setEditTemplateOpen] = useState(false);
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState<EmailTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('');
  const [newTemplateSubject, setNewTemplateSubject] = useState('');
  const [newTemplateBody, setNewTemplateBody] = useState('');

  // Email templates with placeholders
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: 'TMPL-001',
      name: 'Visa Renewal Reminder',
      category: 'Compliance',
      subject: 'Important: Your F-1 Visa is Expiring Soon',
      body: `Dear [Student Name],

This is a friendly reminder that your F-1 visa will expire on [Expiration Date], which is approximately [Days Remaining] days from now.

To maintain your legal status in the United States, please take the following actions:

1. Schedule an appointment with the DSO office
2. Prepare required documentation for visa renewal
3. Submit your renewal application well in advance

If you have any questions or need assistance, please don't hesitate to contact our office at dso@university.edu or visit us during office hours.

Best regards,
[DSO Name]
International Student Services`,
      lastUsed: '2024-11-20',
      usageCount: 45
    },
    {
      id: 'TMPL-002',
      name: 'Document Upload Request',
      category: 'Documents',
      subject: 'Action Required: Please Upload [Document Type]',
      body: `Dear [Student Name],

We need you to upload the following document to complete your request:

Document Type: [Document Type]
Due Date: [Due Date]
Request ID: [Request ID]

To upload your document:
1. Log in to your Pathly account
2. Navigate to Documents section
3. Click "Upload Document"
4. Select the document type and upload your file

If you have any questions about this request or need assistance with the upload process, please contact us at dso@university.edu.

Best regards,
[DSO Name]
International Student Services`,
      lastUsed: '2024-11-21',
      usageCount: 78
    },
    {
      id: 'TMPL-003',
      name: 'Request Approved',
      category: 'Requests',
      subject: 'Good News: Your [Request Type] Has Been Approved',
      body: `Dear [Student Name],

Congratulations! Your [Request Type] submitted on [Submission Date] has been approved.

Request ID: [Request ID]
Approval Date: [Approval Date]

Next Steps:
[Next Steps Details]

You can download any related documents from your Pathly account under the Documents section.

If you have any questions, please feel free to contact our office.

Best regards,
[DSO Name]
International Student Services`,
      lastUsed: '2024-11-22',
      usageCount: 156
    },
    {
      id: 'TMPL-004',
      name: 'Request Needs More Information',
      category: 'Requests',
      subject: 'Additional Information Required: [Request Type]',
      body: `Dear [Student Name],

Thank you for submitting your [Request Type] (Request ID: [Request ID]).

We need additional information to process your request:

[Required Information]

Please provide this information by [Due Date] to avoid delays in processing.

You can reply to this email or log in to your Pathly account to update your request.

Best regards,
[DSO Name]
International Student Services`,
      usageCount: 92
    },
    {
      id: 'TMPL-005',
      name: 'Compliance Check Reminder',
      category: 'Compliance',
      subject: 'Reminder: Upcoming Compliance Check',
      body: `Dear [Student Name],

This is a reminder that your next compliance check is scheduled for [Check Date].

During this check, we will verify:
- Current enrollment status
- Full-time course load (minimum 12 credits for undergraduate)
- Current address in SEVIS
- Valid passport and visa documentation

Please ensure all your information is up to date in the SEVIS system. If you have any compliance concerns or questions, please schedule an appointment with our office.

Best regards,
[DSO Name]
International Student Services`,
      usageCount: 34
    },
    {
      id: 'TMPL-006',
      name: 'Document Rejected',
      category: 'Documents',
      subject: 'Document Resubmission Required: [Document Type]',
      body: `Dear [Student Name],

We have reviewed the [Document Type] you submitted on [Submission Date] and unfortunately cannot accept it for the following reason:

[Rejection Reason]

Please resubmit a corrected version of this document by [Due Date].

Requirements:
[Document Requirements]

If you have questions about the rejection or need clarification on the requirements, please contact us at dso@university.edu.

Best regards,
[DSO Name]
International Student Services`,
      usageCount: 23
    },
    {
      id: 'TMPL-007',
      name: 'Welcome New International Student',
      category: 'General',
      subject: 'Welcome to [University Name] - Important Information for International Students',
      body: `Dear [Student Name],

Welcome to [University Name]! We are excited to have you join our international student community.

As a new F-1 student, here are some important things you should know:

1. Check-in Requirement: All new international students must check in with the DSO office within 30 days of arrival
2. Maintain Full-Time Enrollment: You must be enrolled full-time (minimum 12 credits for undergrad, 9 for grad)
3. Address Updates: Report any address changes within 10 days
4. Employment: F-1 students can only work on-campus during the first year

Important Resources:
- Pathly Portal: [Portal URL]
- DSO Office Hours: Monday-Friday, 9 AM - 5 PM
- Email: dso@university.edu
- Phone: (555) 123-4567

Please schedule an orientation appointment with our office at your earliest convenience.

Welcome again, and we look forward to supporting you throughout your academic journey!

Best regards,
[DSO Name]
International Student Services`,
      usageCount: 67
    },
    {
      id: 'TMPL-008',
      name: 'CPT Approved',
      category: 'Employment',
      subject: 'CPT Authorization Approved - Action Required',
      body: `Dear [Student Name],

Great news! Your Curricular Practical Training (CPT) application has been approved.

Employment Details:
- Employer: [Employer Name]
- Position: [Position Title]
- Start Date: [Start Date]
- End Date: [End Date]
- Hours per Week: [Hours]

Your updated I-20 with CPT authorization is now available in your Pathly account under Documents.

Important Reminders:
- You may only begin work on or after the authorized start date
- You must work only for the employer listed on your I-20
- If your employment ends early, notify the DSO office immediately
- CPT must be directly related to your major

Congratulations and good luck with your internship!

Best regards,
[DSO Name]
International Student Services`,
      usageCount: 89
    },
    {
      id: 'TMPL-009',
      name: 'Travel Signature Completed',
      category: 'Travel',
      subject: 'Your I-20 Travel Signature is Ready',
      body: `Dear [Student Name],

Your I-20 has been signed for travel purposes.

Travel Details:
- Departure Date: [Departure Date]
- Return Date: [Return Date]
- Destination: [Destination]

Your signed I-20 is available for download in your Pathly account.

Important Travel Reminders:
- Carry your signed I-20, valid passport, and valid F-1 visa
- If your visa has expired, you will need to apply for a new visa at a U.S. embassy/consulate
- Travel signatures are valid for 1 year (or until your program end date, whichever comes first)
- Contact us if your travel plans change

Have a safe trip!

Best regards,
[DSO Name]
International Student Services`,
      usageCount: 112
    },
    {
      id: 'TMPL-010',
      name: 'Address Change Confirmation',
      category: 'Compliance',
      subject: 'Address Update Confirmed in SEVIS',
      body: `Dear [Student Name],

Your address change has been successfully updated in the SEVIS system.

New Address on Record:
[New Address]

Update Date: [Update Date]

If this information is incorrect, please contact our office immediately at dso@university.edu.

Reminder: You must report any future address changes within 10 days of moving to remain in compliance with F-1 regulations.

Best regards,
[DSO Name]
International Student Services`,
      usageCount: 56
    }
  ]);

  // Message history
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'MSG-001',
      recipient: 'Sarah Rodriguez',
      recipientEmail: 'sarah.r@university.edu',
      subject: 'Good News: Your CPT Application Has Been Approved',
      body: 'Dear Sarah Rodriguez, Congratulations! Your CPT Application submitted on 2024-11-22 has been approved...',
      sentDate: '2024-11-22',
      sentBy: 'Dr. Johnson',
      status: 'Read',
      template: 'Request Approved'
    },
    {
      id: 'MSG-002',
      recipient: 'Michael Chen',
      recipientEmail: 'michael.c@university.edu',
      subject: 'Additional Information Required: OPT Application',
      body: 'Dear Michael Chen, Thank you for submitting your OPT Application (Request ID: REQ-2024-002)...',
      sentDate: '2024-11-21',
      sentBy: 'Dr. Johnson',
      status: 'Read',
      template: 'Request Needs More Information'
    },
    {
      id: 'MSG-003',
      recipient: 'Priya Patel',
      recipientEmail: 'priya.p@university.edu',
      subject: 'Your I-20 Travel Signature is Ready',
      body: 'Dear Priya Patel, Your I-20 has been signed for travel purposes...',
      sentDate: '2024-11-20',
      sentBy: 'Dr. Smith',
      status: 'Delivered',
      template: 'Travel Signature Completed'
    }
  ]);

  // Statistics
  const stats = [
    {
      label: 'Templates Available',
      value: templates.length,
      icon: FileText,
      color: 'bg-blue-500',
      subtext: `${templates.filter(t => t.lastUsed).length} used recently`
    },
    {
      label: 'Messages Sent',
      value: messages.length,
      icon: Send,
      color: 'bg-green-500',
      subtext: 'This month'
    },
    {
      label: 'Read Rate',
      value: '94%',
      icon: CheckCircle2,
      color: 'bg-purple-500',
      subtext: 'Avg response time: 6h'
    },
    {
      label: 'Active Conversations',
      value: messages.filter(m => m.status !== 'Read').length,
      icon: MessageSquare,
      color: 'bg-yellow-500',
      subtext: 'Pending responses'
    }
  ];

  const filteredTemplates = templates.filter(template => {
    const categoryMatch = filterCategory === 'all' || template.category === filterCategory;
    const searchMatch = searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.body.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const handleUseTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template.id);
    setEmailSubject(template.subject);
    setEmailBody(template.body);
    setSelectedTab('compose');
  };

  const handleSendEmail = () => {
    if (composeMode === 'individual') {
      if (!recipient || !emailSubject || !emailBody) {
        alert('Please fill in all fields');
        return;
      }
      const newMessage: Message = {
        id: `MSG-${String(messages.length + 1).padStart(3, '0')}`,
        recipient: recipient.split('@')[0],
        recipientEmail: recipient,
        subject: emailSubject,
        body: emailBody,
        sentDate: new Date().toISOString().split('T')[0],
        sentBy: userName || 'DSO Admin',
        status: 'Sent',
        template: templates.find(t => t.id === selectedTemplate)?.name
      };
      setMessages([newMessage, ...messages]);
      alert(`Email sent successfully to ${recipient}!`);
    } else {
      if (!bulkRecipientGroup || !emailSubject || !emailBody) {
        alert('Please fill in all fields');
        return;
      }
      const recipientCount = bulkRecipientGroup === 'all' ? 1247 : 
                            bulkRecipientGroup === 'expiring' ? 23 :
                            bulkRecipientGroup === 'pending' ? 12 : 25;
      alert(`Bulk email sent successfully to ${recipientCount} students!`);
    }
    
    // Reset form
    setRecipient('');
    setBulkRecipientGroup('');
    setEmailSubject('');
    setEmailBody('');
    setSelectedTemplate('');
  };

  const handleCreateTemplate = () => {
    if (!newTemplateName || !newTemplateCategory || !newTemplateSubject || !newTemplateBody) {
      alert('Please fill in all fields');
      return;
    }
    const newTemplate: EmailTemplate = {
      id: `TMPL-${String(templates.length + 1).padStart(3, '0')}`,
      name: newTemplateName,
      category: newTemplateCategory,
      subject: newTemplateSubject,
      body: newTemplateBody,
      usageCount: 0
    };
    setTemplates([...templates, newTemplate]);
    setNewTemplateName('');
    setNewTemplateCategory('');
    setNewTemplateSubject('');
    setNewTemplateBody('');
    setNewTemplateOpen(false);
    alert('Template created successfully!');
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== templateId));
      alert('Template deleted successfully');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 mb-6">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#2A73E8] rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl text-gray-900">Pathly</span>
                <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100">DSO Admin</Badge>
              </div>
              <span className="text-gray-300 hidden sm:block">|</span>
              <div className="hidden sm:flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#2A73E8]" />
                <span className="text-gray-700">Communication Center</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onBack}
                className="border-[#2A73E8] text-[#2A73E8] hover:bg-[#2A73E8] hover:text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              {userName && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[#2A73E8] rounded-full flex items-center justify-center text-white">
                    {userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  {onLogout && (
                    <Button variant="ghost" size="sm" onClick={onLogout}>
                      Log Out
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-8 h-8 text-[#2A73E8]" />
              <h1 className="text-gray-900">Communication Center</h1>
            </div>
            <p className="text-gray-600">Send emails, manage templates, and track communication with students.</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, idx) => (
              <Card key={idx} className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 mb-1">{stat.value}</p>
                      <p className="text-gray-500">{stat.subtext}</p>
                    </div>
                  </div>
                  <p className="text-gray-700">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={(v: any) => setSelectedTab(v)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
              <TabsTrigger value="compose">
                <Send className="w-4 h-4 mr-2" />
                Compose
              </TabsTrigger>
              <TabsTrigger value="templates">
                <FileText className="w-4 h-4 mr-2" />
                Templates ({templates.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="w-4 h-4 mr-2" />
                History ({messages.length})
              </TabsTrigger>
            </TabsList>

            {/* Compose Tab */}
            <TabsContent value="compose">
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Compose Email</span>
                    <div className="flex gap-2">
                      <Button
                        variant={composeMode === 'individual' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setComposeMode('individual')}
                        className={composeMode === 'individual' ? 'bg-[#2A73E8]' : ''}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Individual
                      </Button>
                      <Button
                        variant={composeMode === 'bulk' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setComposeMode('bulk')}
                        className={composeMode === 'bulk' ? 'bg-[#2A73E8]' : ''}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Bulk
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Template Selection */}
                  <div>
                    <label className="block text-gray-700 mb-2">Use Template (Optional)</label>
                    <Select value={selectedTemplate} onValueChange={(value) => {
                      const template = templates.find(t => t.id === value);
                      if (template) handleUseTemplate(template);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} ({template.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Recipient */}
                  {composeMode === 'individual' ? (
                    <div>
                      <label className="block text-gray-700 mb-2">Recipient Email *</label>
                      <input
                        type="email"
                        placeholder="student@university.edu"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-gray-700 mb-2">Recipient Group *</label>
                      <Select value={bulkRecipientGroup} onValueChange={setBulkRecipientGroup}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recipient group..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Students (1,247)</SelectItem>
                          <SelectItem value="expiring">Students with Expiring Visas (23)</SelectItem>
                          <SelectItem value="pending">Students with Pending Actions (12)</SelectItem>
                          <SelectItem value="noncompliant">Non-Compliant Students (25)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Subject */}
                  <div>
                    <label className="block text-gray-700 mb-2">Subject *</label>
                    <input
                      type="text"
                      placeholder="Enter email subject..."
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-gray-700 mb-2">Message *</label>
                    <Textarea
                      placeholder="Type your message here... Use [placeholders] like [Student Name], [Request ID], etc."
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="min-h-64"
                    />
                    <p className="text-gray-500 mt-2">
                      Available placeholders: [Student Name], [Request ID], [Due Date], [Document Type], [DSO Name]
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSendEmail}
                      className="bg-[#2A73E8] hover:bg-[#1557b0]"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Email
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setRecipient('');
                      setBulkRecipientGroup('');
                      setEmailSubject('');
                      setEmailBody('');
                      setSelectedTemplate('');
                    }}>
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates">
              <Card className="shadow-sm border-0 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                      />
                    </div>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-48">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setNewTemplateOpen(true)} className="bg-[#2A73E8] hover:bg-[#1557b0]">
                      <Plus className="w-4 h-4 mr-2" />
                      New Template
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTemplates.map(template => (
                  <Card key={template.id} className="shadow-sm border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-900 mb-1">{template.name}</p>
                          <Badge variant="outline" className="text-[#2A73E8] border-[#2A73E8]">
                            {template.category}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleUseTemplate(template)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-gray-700 mb-1">Subject:</p>
                          <p className="text-gray-900">{template.subject}</p>
                        </div>
                        <div>
                          <p className="text-gray-700 mb-1">Preview:</p>
                          <p className="text-gray-600 line-clamp-3">{template.body}</p>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t">
                          <p className="text-gray-500">Used {template.usageCount} times</p>
                          {template.lastUsed && (
                            <p className="text-gray-500">Last: {template.lastUsed}</p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleUseTemplate(template)}
                          className="w-full bg-[#2A73E8] hover:bg-[#1557b0]"
                        >
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle>Message History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {messages.map(message => (
                      <div key={message.id} className="p-4 border border-gray-200 rounded-lg hover:border-[#2A73E8] transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <User className="w-5 h-5 text-gray-400" />
                              <p className="text-gray-900">{message.recipient}</p>
                              <Badge variant="outline" className="text-xs">{message.id}</Badge>
                              <Badge className={
                                message.status === 'Read' ? 'bg-green-100 text-green-800' :
                                message.status === 'Delivered' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {message.status}
                              </Badge>
                            </div>
                            <p className="text-gray-700 mb-2">{message.subject}</p>
                            <div className="flex items-center gap-4 text-gray-500">
                              <span>To: {message.recipientEmail}</span>
                              <span>•</span>
                              <span>Sent: {message.sentDate}</span>
                              <span>•</span>
                              <span>By: {message.sentBy}</span>
                              {message.template && (
                                <>
                                  <span>•</span>
                                  <span>Template: {message.template}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* New Template Dialog */}
      <Dialog open={newTemplateOpen} onOpenChange={setNewTemplateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Email Template</DialogTitle>
            <DialogDescription>
              Create a reusable email template with placeholders for personalization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Template Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Visa Renewal Reminder"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Category *</label>
                <Select value={newTemplateCategory} onValueChange={setNewTemplateCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                    <SelectItem value="Documents">Documents</SelectItem>
                    <SelectItem value="Requests">Requests</SelectItem>
                    <SelectItem value="Employment">Employment</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Subject Line *</label>
              <input
                type="text"
                placeholder="Enter email subject..."
                value={newTemplateSubject}
                onChange={(e) => setNewTemplateSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Email Body *</label>
              <Textarea
                placeholder="Type your template here... Use [placeholders] like [Student Name], [Request ID], etc."
                value={newTemplateBody}
                onChange={(e) => setNewTemplateBody(e.target.value)}
                className="min-h-48"
              />
              <p className="text-gray-500 mt-2">
                Available placeholders: [Student Name], [Request ID], [Due Date], [Document Type], [DSO Name], [Expiration Date], [Days Remaining]
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCreateTemplate}
                className="bg-[#2A73E8] hover:bg-[#1557b0]"
                disabled={!newTemplateName || !newTemplateCategory || !newTemplateSubject || !newTemplateBody}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
              <Button variant="outline" onClick={() => setNewTemplateOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}