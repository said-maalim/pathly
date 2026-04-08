/**
 * EmailTemplatesPanel
 *
 * Searchable, filterable grid of email templates with CRUD actions.
 * Pure UI — state is owned by the parent and passed via props.
 */
import { useState } from 'react';
import { Search, Filter, Plus, Copy, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

export interface EmailTemplate {
    id: string;
    name: string;
    category: string;
    subject: string;
    body: string;
    lastUsed?: string;
    usageCount: number;
}

interface EmailTemplatesPanelProps {
    templates: EmailTemplate[];
    onUseTemplate: (template: EmailTemplate) => void;
    onCreateTemplate: (template: Omit<EmailTemplate, 'id' | 'usageCount'>) => void;
    onDeleteTemplate: (templateId: string) => void;
}

export function EmailTemplatesPanel({
    templates,
    onUseTemplate,
    onCreateTemplate,
    onDeleteTemplate,
}: EmailTemplatesPanelProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [newTemplateOpen, setNewTemplateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newSubject, setNewSubject] = useState('');
    const [newBody, setNewBody] = useState('');

    const categories = Array.from(new Set(templates.map(t => t.category)));

    const filtered = templates.filter(template => {
        const categoryMatch = filterCategory === 'all' || template.category === filterCategory;
        const searchMatch =
            searchQuery === '' ||
            template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.subject.toLowerCase().includes(searchQuery.toLowerCase());
        return categoryMatch && searchMatch;
    });

    const handleCreate = () => {
        if (!newName || !newCategory || !newSubject || !newBody) { alert('Please fill in all fields'); return; }
        onCreateTemplate({ name: newName, category: newCategory, subject: newSubject, body: newBody });
        setNewName(''); setNewCategory(''); setNewSubject(''); setNewBody('');
        setNewTemplateOpen(false);
        alert('Template created successfully!');
    };

    return (
        <>
            {/* Search / Filter Bar */}
            <Card className="shadow-sm border-0 mb-6">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                            />
                        </div>
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="w-48">
                                <Filter className="w-4 h-4 mr-2" /><SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={() => setNewTemplateOpen(true)} className="bg-[#2A73E8] hover:bg-[#1557b0]">
                            <Plus className="w-4 h-4 mr-2" />New Template
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Template Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filtered.map(template => (
                    <Card key={template.id} className="shadow-sm border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-900 mb-1">{template.name}</p>
                                    <Badge variant="outline" className="text-[#2A73E8] border-[#2A73E8]">{template.category}</Badge>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => onUseTemplate(template)}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        if (confirm('Are you sure you want to delete this template?')) onDeleteTemplate(template.id);
                                    }}>
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
                                    {template.lastUsed && <p className="text-gray-500">Last: {template.lastUsed}</p>}
                                </div>
                                <Button onClick={() => onUseTemplate(template)} className="w-full bg-[#2A73E8] hover:bg-[#1557b0]">
                                    Use Template
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* New Template Dialog */}
            <Dialog open={newTemplateOpen} onOpenChange={setNewTemplateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create New Template</DialogTitle>
                        <DialogDescription>Create a reusable email template for common communication.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div>
                            <label className="block text-gray-700 mb-2">Template Name</label>
                            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Compliance Reminder" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]" />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Category</label>
                            <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="e.g., Compliance" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]" />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Subject Line</label>
                            <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Email subject..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]" />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Body</label>
                            <Textarea value={newBody} onChange={e => setNewBody(e.target.value)} placeholder="Template body..." className="min-h-32" />
                        </div>
                        <div className="flex gap-3">
                            <Button className="bg-[#2A73E8] hover:bg-[#1557b0]" onClick={handleCreate}>Create Template</Button>
                            <Button variant="outline" onClick={() => setNewTemplateOpen(false)}>Cancel</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
