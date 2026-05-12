/**
 * ImmigrationSection, UniversitySection, PreferencesSection, DataSection
 *
 * Remaining four SettingsPage sections bundled in one file to avoid
 * creating many tiny files for purely static or near-static content.
 */
import { useEffect, useState } from 'react';
import { Globe, Calendar, Download, Trash2, Building2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useStudentProfile } from '../../hooks/useStudentProfile';

const INPUT_CLS = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]';
const SELECT_CLS = `${INPUT_CLS} appearance-none`;
const LOCKED_CLS = 'w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed';
const TOGGLE_CLS = 'w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2A73E8]';

// ─── Immigration & Student Info ───────────────────────────────────────────────

/**
 * Locked fields (visa type, SEVIS ID, status enums) come from the
 * student row and are set by the DSO via roster import or manual
 * edit. The student can request review but can't edit directly.
 *
 * year_of_study / academic_status / expected_graduation_date /
 * campus have no public.students columns yet — left as form-only
 * placeholders with a note.
 */
export function ImmigrationSection() {
    const { student, loading } = useStudentProfile();

    const visaType = student?.visa_type ?? '';
    const sevisId = student?.sevis_id ?? '';
    const degreeLevel = student?.degree_level ?? '';
    const major = student?.major ?? '';

    const [yearOfStudy, setYearOfStudy] = useState('');
    const [academicStatus, setAcademicStatus] = useState('');
    const [expectedGraduation, setExpectedGraduation] = useState('');
    const [campus, setCampus] = useState('');

    useEffect(() => {
        // Reset transient form fields when the student record loads.
        // Currently nothing to prefill (no DB columns yet).
        if (student) {
            setYearOfStudy('');
            setAcademicStatus('');
            setExpectedGraduation('');
            setCampus(student.program_of_study ?? '');
        }
    }, [student]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-gray-900 mb-2">Immigration &amp; Student Information</h2>
                <p className="text-gray-600">Visa and academic status details.</p>
            </div>
            <Alert className="border-blue-200 bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                    Locked fields (visa type, SEVIS ID, degree level, major) are managed by your DSO. Submit a review request below to ask for changes.
                </AlertDescription>
            </Alert>
            <Card className="shadow-sm border-0">
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading immigration record…</div>
                    ) : (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 mb-2">Visa Type</label>
                            <div className="relative">
                                <input type="text" value={visaType} disabled className={LOCKED_CLS} placeholder="Not set" />
                                <Badge className="absolute right-2 top-2 bg-gray-200 text-gray-700 hover:bg-gray-200">Locked</Badge>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">SEVIS ID</label>
                            <div className="relative">
                                <input type="text" value={sevisId} disabled className={LOCKED_CLS} placeholder="Not set" />
                                <Badge className="absolute right-2 top-2 bg-gray-200 text-gray-700 hover:bg-gray-200">Locked</Badge>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Degree Level</label>
                            <div className="relative">
                                <input type="text" value={degreeLevel} disabled className={LOCKED_CLS} placeholder="Not set" />
                                <Badge className="absolute right-2 top-2 bg-gray-200 text-gray-700 hover:bg-gray-200">Locked</Badge>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Major</label>
                            <div className="relative">
                                <input type="text" value={major} disabled className={LOCKED_CLS} placeholder="Not set" />
                                <Badge className="absolute right-2 top-2 bg-gray-200 text-gray-700 hover:bg-gray-200">Locked</Badge>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Year of Study</label>
                            <select value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)} className={SELECT_CLS}>
                                <option value="">Not set</option>
                                <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>5th Year+</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Academic Status</label>
                            <select value={academicStatus} onChange={e => setAcademicStatus(e.target.value)} className={SELECT_CLS}>
                                <option value="">Not set</option>
                                <option>Active</option><option>OPT</option><option>STEM OPT</option><option>Completed</option><option>Transferred</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Expected Graduation Date</label>
                            <input type="date" value={expectedGraduation} onChange={e => setExpectedGraduation(e.target.value)} className={INPUT_CLS} />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Program of Study</label>
                            <input type="text" value={campus} onChange={e => setCampus(e.target.value)} className={INPUT_CLS} placeholder="Not set" />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                        <Button className="bg-[#2A73E8] hover:bg-[#1557b0]" disabled>Request Profile Update Review</Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        Year of Study, Academic Status, and Expected Graduation Date have no DB columns yet — they'll be wired when those columns are added to public.students. The review-request workflow isn't wired either.
                    </p>
                    </>
                    )}
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
