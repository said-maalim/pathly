/**
 * ComposeEmailPanel
 *
 * Individual and bulk email composition form.
 * Supports both the legacy onMessageSent callback and real API sends via onSendAsync.
 * When a `students` list is provided, individual mode shows a dropdown instead of a free-form email field.
 */
import { useState, useRef } from 'react';
import { Send, User, Users, Paperclip } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { supabase } from '../../lib/supabase';

export interface StudentOption {
    id: string;       // students.id (not used for messaging)
    user_id: string;  // users.id — this is the recipient_id for messages
    name: string;
    email: string;
}

interface EmailTemplate {
    id: string;
    name: string;
    category: string;
    subject: string;
    body: string;
}

interface SendPayload {
    recipientId?: string;
    recipientEmail: string;
    subject: string;
    body: string;
    templateName?: string;
    recipientType?: 'individual' | 'bulk' | 'school';
    bulkFilter?: Record<string, unknown>;
    attachments?: Array<{ name: string; url: string; size: number; type: string }>;
}

interface ReplyPreFill {
    recipientId: string;
    recipientEmail: string;
    subject: string;
    threadId: string;
    parentId: string;
}

interface ComposeEmailPanelProps {
    templates: EmailTemplate[];
    userName: string;
    /** List of students for the individual-send dropdown (DSO context) */
    students?: StudentOption[];
    /** Pre-fills the compose form when replying from the inbox */
    replyPreFill?: ReplyPreFill | null;
    /**
     * Async send handler that calls the real API.
     * When provided, replaces the local-only onMessageSent call.
     * Should throw on error so the component can show an error state.
     */
    onSendAsync?: (payload: SendPayload) => Promise<void>;
    /** Fallback legacy callback — called after successful send for local state updates */
    onMessageSent: (msg: {
        recipientId?: string;
        recipientEmail: string;
        subject: string;
        body: string;
        templateName?: string;
        recipientType?: 'individual' | 'bulk' | 'school';
    }) => void;
}

export function ComposeEmailPanel({ templates, userName, students, replyPreFill, onSendAsync, onMessageSent }: ComposeEmailPanelProps) {
    const [composeMode, setComposeMode] = useState<'individual' | 'bulk'>('individual');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState(() => replyPreFill?.recipientId ?? '');  // student.user_id
    const [recipient, setRecipient] = useState(() => replyPreFill?.recipientEmail ?? '');              // free-form email (no dropdown)
    const [bulkRecipientGroup, setBulkRecipientGroup] = useState('');
    const [emailSubject, setEmailSubject] = useState(() => replyPreFill?.subject ?? '');
    const [emailBody, setEmailBody] = useState('');
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');
    const [attachments, setAttachments] = useState<Array<{ name: string; url: string; size: number; type: string }>>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const useStudentDropdown = (students ?? []).length > 0;
    const selectedStudent = students?.find(s => s.user_id === selectedStudentId);

    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(templateId);
            setEmailSubject(template.subject);
            setEmailBody(template.body);
        }
    };

    const reset = () => {
        setRecipient('');
        setSelectedStudentId('');
        setBulkRecipientGroup('');
        setEmailSubject('');
        setEmailBody('');
        setSelectedTemplate('');
        setSendError('');
        setAttachments([]);
    };

    const handleSend = async () => {
        setSendError('');

        if (composeMode === 'individual') {
            // If replying, use the pre-filled recipient; otherwise use the dropdown/free-form field
            const recipientId    = replyPreFill?.recipientId ?? (useStudentDropdown ? selectedStudentId : undefined);
            const recipientEmail = replyPreFill?.recipientEmail ?? (useStudentDropdown ? (selectedStudent?.email ?? '') : recipient);

            if ((!recipientId && !recipient) || !emailSubject || !emailBody) {
                setSendError('Please fill in all fields.');
                return;
            }

            const payload: SendPayload = {
                recipientId,
                recipientEmail,
                subject: emailSubject,
                body: emailBody,
                templateName: templates.find(t => t.id === selectedTemplate)?.name,
                recipientType: 'individual',
                attachments,
            };

            try {
                setSending(true);
                if (onSendAsync) await onSendAsync(payload);
                onMessageSent({ recipientId, recipientEmail, subject: emailSubject, body: emailBody, templateName: payload.templateName, recipientType: 'individual' });
                reset();
            } catch (err) {
                setSendError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
            } finally {
                setSending(false);
            }

        } else {
            if (!bulkRecipientGroup || !emailSubject || !emailBody) {
                setSendError('Please fill in all fields.');
                return;
            }

            const countMap: Record<string, number> = { all: 1247, expiring: 23, pending: 12, noncompliant: 25 };
            const count = countMap[bulkRecipientGroup] ?? 0;

            const payload: SendPayload = {
                recipientEmail: '',
                subject: emailSubject,
                body: emailBody,
                templateName: templates.find(t => t.id === selectedTemplate)?.name,
                recipientType: 'bulk',
                bulkFilter: { group: bulkRecipientGroup },
                attachments,
            };

            try {
                setSending(true);
                if (onSendAsync) await onSendAsync(payload);
                onMessageSent({ recipientEmail: `bulk:${bulkRecipientGroup}`, subject: emailSubject, body: emailBody, templateName: payload.templateName, recipientType: 'bulk' });
                alert(`Bulk email sent to ${count} students!`);
                reset();
            } catch (err) {
                setSendError(err instanceof Error ? err.message : 'Failed to send bulk email. Please try again.');
            } finally {
                setSending(false);
            }
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `attachments/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: uploadError } = await supabase.storage.from('message-attachments').upload(path, file);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('message-attachments').getPublicUrl(path);
            setAttachments(prev => [...prev, { name: file.name, url: urlData.publicUrl, size: file.size, type: file.type }]);
        } catch {
            setSendError('Failed to upload attachment');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    return (
        <Card className="shadow-sm border-0">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Compose Message</span>
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

                {/* Error banner */}
                {sendError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {sendError}
                    </div>
                )}

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
                        <label className="block text-gray-700 mb-2">Recipient *</label>
                        {useStudentDropdown ? (
                            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a student..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(students ?? []).map(s => (
                                        <SelectItem key={s.user_id} value={s.user_id}>
                                            {s.name} — {s.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <input
                                type="email"
                                placeholder="student@university.edu"
                                value={recipient}
                                onChange={e => setRecipient(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                            />
                        )}
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
                        placeholder="Enter subject..."
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
                    <p className="text-gray-500 mt-2 text-sm">
                        Available placeholders: [Student Name], [Request ID], [Due Date], [Document Type], [DSO Name]
                    </p>
                </div>

                {/* Attachments */}
                <div>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={handleFileSelect} />
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {attachments.map((att, i) => (
                                <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 border border-gray-200 text-sm text-gray-700">
                                    <Paperclip className="w-3 h-3 text-gray-500" />
                                    {att.name}
                                    <button
                                        onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                                        className="ml-1 text-gray-400 hover:text-gray-600 text-base leading-none"
                                    >×</button>
                                </div>
                            ))}
                        </div>
                    )}
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-sm">
                        <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                        {uploading ? 'Uploading…' : 'Attach File'}
                    </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <Button onClick={handleSend} disabled={sending} className="bg-[#2A73E8] hover:bg-[#1557b0]">
                        <Send className="w-4 h-4 mr-2" />
                        {sending ? 'Sending…' : 'Send Message'}
                    </Button>
                    <Button variant="outline" onClick={reset} disabled={sending}>
                        Clear
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
