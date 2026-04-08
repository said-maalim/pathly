/**
 * NotificationsSection — Email + browser notification toggles
 */
import { useState } from 'react';
import { Mail, Monitor, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

const TOGGLE_CLS = 'w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2A73E8]';

interface Toggle { label: string; key: string }

const EMAIL_TOGGLES: Toggle[] = [
    { key: 'complianceDeadlines', label: 'Upcoming compliance deadlines' },
    { key: 'travelSignature', label: 'I-20 travel signature expiring' },
    { key: 'optCptReminders', label: 'OPT/CPT reminders' },
    { key: 'documentExpiring', label: 'Document expiring' },
    { key: 'sevisChanges', label: 'SEVIS status changes' },
    { key: 'dsoMessages', label: 'Messages from DSO office' },
];

const BROWSER_TOGGLES: Toggle[] = [
    { key: 'deadlineReminders', label: 'Deadline reminders' },
    { key: 'documentUploaded', label: 'New document uploaded by DSO' },
    { key: 'requestUpdates', label: 'Request status updates' },
];

function buildDefaults(toggles: Toggle[]): Record<string, boolean> {
    return Object.fromEntries(toggles.map(t => [t.key, true]));
}

function TogglesCard({ title, icon, toggles, state, onChange }: {
    title: string;
    icon: React.ReactNode;
    toggles: Toggle[];
    state: Record<string, boolean>;
    onChange: (key: string, value: boolean) => void;
}) {
    return (
        <Card className="shadow-sm border-0">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {toggles.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">{label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={state[key]} onChange={e => onChange(key, e.target.checked)} className="sr-only peer" />
                            <div className={TOGGLE_CLS} />
                        </label>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export function NotificationsSection() {
    const [email, setEmail] = useState(buildDefaults(EMAIL_TOGGLES));
    const [browser, setBrowser] = useState(buildDefaults(BROWSER_TOGGLES));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-gray-900 mb-2">Notification Preferences</h2>
                <p className="text-gray-600">Manage how you receive updates and alerts.</p>
            </div>
            <TogglesCard title="Email Notifications" icon={<Mail className="w-5 h-5" />} toggles={EMAIL_TOGGLES} state={email} onChange={(k, v) => setEmail(p => ({ ...p, [k]: v }))} />
            <TogglesCard title="Browser Notifications" icon={<Monitor className="w-5 h-5" />} toggles={BROWSER_TOGGLES} state={browser} onChange={(k, v) => setBrowser(p => ({ ...p, [k]: v }))} />
            <div className="flex justify-end">
                <Button className="bg-[#2A73E8] hover:bg-[#1557b0]">
                    <Save className="w-4 h-4 mr-2" />Save Preferences
                </Button>
            </div>
        </div>
    );
}
