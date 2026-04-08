/**
 * ComposeEmailPanel
 *
 * Individual and bulk email composition form. Receives template population
 * from the parent via `onTemplateUsed` and calls `onSend` when the user submits.
 */
import { useState } from 'react';
import { Send, User, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface EmailTemplate {
    id: string;
    name: string;
    category: string;
    subject: string;
    body: string;
}

interface ComposeEmailPanelProps {
    templates: EmailTemplate[];
    userName: string;
    onMessageSent: (msg: {
        recipientEmail: string;
        subject: string;
        body: string;
        templateName?: string;
    }) => void;
}

export function ComposeEmailPanel({ templates, userName, onMessageSent }: ComposeEmailPanelProps) {
    const [composeMode, setComposeMode] = useState<'individual' | 'bulk'>('individual');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [recipient, setRecipient] = useState('');
    const [bulkRecipientGroup, setBulkRecipientGroup] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');

    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(templateId);
            setEmailSubject(template.subject);
            setEmailBody(template.body);
        }
    };

    const handleSend = () => {
        if (composeMode === 'individual') {
            if (!recipient || !emailSubject || !emailBody) { alert('Please fill in all fields'); return; }
            onMessageSent({
                recipientEmail: recipient,
                subject: emailSubject,
                body: emailBody,
                templateName: templates.find(t => t.id === selectedTemplate)?.name,
            });
            alert(`Email sent successfully to ${recipient}!`);
        } else {
            if (!bulkRecipientGroup || !emailSubject || !emailBody) { alert('Please fill in all fields'); return; }
            const count = bulkRecipientGroup === 'all' ? 1247 : bulkRecipientGroup === 'expiring' ? 23 : bulkRecipientGroup === 'pending' ? 12 : 25;
            alert(`Bulk email sent successfully to ${count} students!`);
        }
        // Reset
        setRecipient('');
        setBulkRecipientGroup('');
        setEmailSubject('');
        setEmailBody('');
        setSelectedTemplate('');
    };

    return (
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
                            <User className="w-4 h-4 mr-2" />Individual
                        </Button>
                        <Button
                            variant={composeMode === 'bulk' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setComposeMode('bulk')}
                            className={composeMode === 'bulk' ? 'bg-[#2A73E8]' : ''}
                        >
                            <Users className="w-4 h-4 mr-2" />Bulk
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Template selector */}
                <div>
                    <label className="block text-gray-700 mb-2">Use Template (Optional)</label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                        <SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger>
                        <SelectContent>
                            {templates.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.name} ({t.category})</SelectItem>
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
                            onChange={e => setRecipient(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                        />
                    </div>
                ) : (
                    <div>
                        <label className="block text-gray-700 mb-2">Recipient Group *</label>
                        <Select value={bulkRecipientGroup} onValueChange={setBulkRecipientGroup}>
                            <SelectTrigger><SelectValue placeholder="Select recipient group..." /></SelectTrigger>
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
                        onChange={e => setEmailSubject(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    />
                </div>

                {/* Body */}
                <div>
                    <label className="block text-gray-700 mb-2">Message *</label>
                    <Textarea
                        placeholder="Type your message here... Use [placeholders] like [Student Name], [Request ID], etc."
                        value={emailBody}
                        onChange={e => setEmailBody(e.target.value)}
                        className="min-h-64"
                    />
                    <p className="text-gray-500 mt-2">
                        Available placeholders: [Student Name], [Request ID], [Due Date], [Document Type], [DSO Name]
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <Button onClick={handleSend} className="bg-[#2A73E8] hover:bg-[#1557b0]">
                        <Send className="w-4 h-4 mr-2" />Send Email
                    </Button>
                    <Button variant="outline" onClick={() => { setRecipient(''); setBulkRecipientGroup(''); setEmailSubject(''); setEmailBody(''); setSelectedTemplate(''); }}>
                        Clear
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
