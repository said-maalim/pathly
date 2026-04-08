/**
 * ImmigrationSection, UniversitySection, PreferencesSection, DataSection
 *
 * Remaining four SettingsPage sections bundled in one file to avoid
 * creating many tiny files for purely static or near-static content.
 */
import { useState } from 'react';
import { Globe, Calendar, Download, Trash2, Building2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';

const INPUT_CLS = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]';
const SELECT_CLS = `${INPUT_CLS} appearance-none`;
const LOCKED_CLS = 'w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed';
const TOGGLE_CLS = 'w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2A73E8]';

// ─── Immigration & Student Info ───────────────────────────────────────────────

interface ImmigrationData {
    visaType: string; sevisId: string; degreeLevel: string; major: string;
    yearOfStudy: string; academicStatus: string; expectedGraduation: string; campus: string;
}
const IMMI_DEFAULT: ImmigrationData = {
    visaType: 'F-1', sevisId: 'N0012345678', degreeLevel: 'Masters', major: 'Computer Science',
    yearOfStudy: '2nd Year', academicStatus: 'Active', expectedGraduation: '2026-05-15', campus: 'Main Campus',
};

export function ImmigrationSection() {
    const [data, setData] = useState<ImmigrationData>(IMMI_DEFAULT);
    const set =
        (key: keyof ImmigrationData) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
                setData(p => ({ ...p, [key]: e.target.value }));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-gray-900 mb-2">Immigration &amp; Student Information</h2>
                <p className="text-gray-600">Manage your visa and academic status details.</p>
            </div>
            <Alert className="border-blue-200 bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                    Some fields require DSO approval. You may submit a review request for changes.
                </AlertDescription>
            </Alert>
            <Card className="shadow-sm border-0">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 mb-2">Visa Type</label>
                            <div className="relative">
                                <select value={data.visaType} disabled className={`${LOCKED_CLS} appearance-none`}>
                                    <option>F-1</option><option>J-1</option><option>M-1</option>
                                </select>
                                <Badge className="absolute right-2 top-2 bg-gray-200 text-gray-700 hover:bg-gray-200">Locked</Badge>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">SEVIS ID</label>
                            <div className="relative">
                                <input type="text" value={data.sevisId} disabled className={LOCKED_CLS} />
                                <Badge className="absolute right-2 top-2 bg-gray-200 text-gray-700 hover:bg-gray-200">Locked</Badge>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Degree Level</label>
                            <select value={data.degreeLevel} onChange={set('degreeLevel')} className={SELECT_CLS}>
                                <option>Bachelors</option><option>Masters</option><option>PhD</option><option>Certificate</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Major</label>
                            <input type="text" value={data.major} onChange={set('major')} className={INPUT_CLS} />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Year of Study</label>
                            <select value={data.yearOfStudy} onChange={set('yearOfStudy')} className={SELECT_CLS}>
                                <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>5th Year+</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Academic Status</label>
                            <select value={data.academicStatus} onChange={set('academicStatus')} className={SELECT_CLS}>
                                <option>Active</option><option>OPT</option><option>STEM OPT</option><option>Completed</option><option>Transferred</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Expected Graduation Date</label>
                            <input type="date" value={data.expectedGraduation} onChange={set('expectedGraduation')} className={INPUT_CLS} />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Campus / School</label>
                            <input type="text" value={data.campus} onChange={set('campus')} className={INPUT_CLS} />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                        <Button className="bg-[#2A73E8] hover:bg-[#1557b0]">Request Profile Update Review</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── University Info ──────────────────────────────────────────────────────────

export function UniversitySection() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-gray-900 mb-2">University Information</h2>
                <p className="text-gray-600">View your university and DSO office details.</p>
            </div>
            <Card className="shadow-sm border-0">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />University Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg"><p className="text-gray-600 mb-1">University Name</p><p className="text-gray-900">Boston University</p></div>
                        <div className="p-4 bg-gray-50 rounded-lg"><p className="text-gray-600 mb-1">Campus / School Code</p><p className="text-gray-900">BOS-001</p></div>
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-sm border-0">
                <CardHeader><CardTitle>DSO Office Information</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            ['DSO Office Name', 'International Students & Scholars Office'],
                            ['Office Hours', 'Mon-Fri, 9:00 AM - 5:00 PM'],
                            ['DSO Contact', 'Dr. Michael Johnson'],
                            ['Email', 'isso@university.edu'],
                            ['Phone', '+1 (617) 555-0100'],
                        ].map(([label, value]) => (
                            <div key={label} className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-gray-600 mb-1">{label}</p>
                                <p className="text-gray-900">{value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 border-t border-gray-200 mt-4">
                        <Button variant="outline">Re-Verify University Email</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Preferences ──────────────────────────────────────────────────────────────

interface Preferences { timeZone: string; language: string; dateFormat: string }
const PREF_DEFAULT: Preferences = { timeZone: 'America/New_York', language: 'English', dateFormat: 'MM/DD/YYYY' };

export function PreferencesSection() {
    const [prefs, setPrefs] = useState<Preferences>(PREF_DEFAULT);
    const set = (key: keyof Preferences) => (e: React.ChangeEvent<HTMLSelectElement>) =>
        setPrefs(p => ({ ...p, [key]: e.target.value }));
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-gray-900 mb-2">Preferences</h2>
                <p className="text-gray-600">Customize your application experience.</p>
            </div>
            <Card className="shadow-sm border-0">
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-gray-700 mb-2"><Globe className="w-4 h-4 inline mr-2" />Time Zone</label>
                            <select value={prefs.timeZone} onChange={set('timeZone')} className={SELECT_CLS}>
                                <option value="America/New_York">Eastern Time (ET)</option>
                                <option value="America/Chicago">Central Time (CT)</option>
                                <option value="America/Denver">Mountain Time (MT)</option>
                                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2"><Globe className="w-4 h-4 inline mr-2" />Language</label>
                            <select value={prefs.language} onChange={set('language')} className={SELECT_CLS}>
                                <option>English</option><option>中文 (Chinese)</option><option>हिन्दी (Hindi)</option><option>العربية (Arabic)</option><option>Español (Spanish)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2"><Calendar className="w-4 h-4 inline mr-2" />Date Format</label>
                            <select value={prefs.dateFormat} onChange={set('dateFormat')} className={SELECT_CLS}>
                                <option>MM/DD/YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                        <Button className="bg-[#2A73E8] hover:bg-[#1557b0]">
                            <Save className="w-4 h-4 mr-2" />Save Preferences
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Data & Documents ─────────────────────────────────────────────────────────

export function DataSection() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-gray-900 mb-2">Data &amp; Document Controls</h2>
                <p className="text-gray-600">Manage your data, documents, and privacy settings.</p>
            </div>
            <Card className="shadow-sm border-0">
                <CardHeader><CardTitle>Document Management</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Download className="w-5 h-5 text-gray-600" />
                            <div>
                                <p className="text-gray-900">Download All Documents</p>
                                <p className="text-gray-600">Export all your documents as a ZIP file</p>
                            </div>
                        </div>
                        <Button variant="outline"><Download className="w-4 h-4 mr-2" />Download ZIP</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                            <p className="text-gray-900 mb-1">Share Documents with DSO</p>
                            <p className="text-gray-600">Automatically share uploaded documents with your DSO office</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-4">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className={TOGGLE_CLS} />
                        </label>
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-sm border-0">
                <CardHeader><CardTitle>System &amp; Cache</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Trash2 className="w-5 h-5 text-gray-600" />
                            <div>
                                <p className="text-gray-900">Clear Local Cache</p>
                                <p className="text-gray-600">Remove temporary files and cached data</p>
                            </div>
                        </div>
                        <Button variant="outline">Clear Cache</Button>
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-sm border-0">
                <CardHeader><CardTitle>Privacy</CardTitle></CardHeader>
                <CardContent>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-900 mb-2">Privacy Policy</p>
                        <p className="text-gray-600 mb-3">Learn about how we collect, use, and protect your data.</p>
                        <a href="#" className="text-[#2A73E8] hover:underline">View Privacy Policy →</a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
