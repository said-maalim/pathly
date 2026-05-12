/**
 * ProfileSection — Personal information form
 *
 * Hydrates from the authenticated student's public.users row via
 * useStudentProfile(). Email is locked (managed by Supabase Auth).
 * Other fields are editable in the form but persisting changes is
 * a follow-up: a PUT /users/me endpoint isn't wired yet.
 */
import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useStudentProfile } from '../../hooks/useStudentProfile';

interface ProfileFormState {
    fullName: string;
    preferredName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    countryCitizenship: string;
    countryBirth: string;
}

const EMPTY: ProfileFormState = {
    fullName: '',
    preferredName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    countryCitizenship: '',
    countryBirth: '',
};

const INPUT_CLS = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]';
const LOCKED_CLS = 'w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed';

export function ProfileSection() {
    const { user, student, loading } = useStudentProfile();
    const [data, setData] = useState<ProfileFormState>(EMPTY);

    useEffect(() => {
        if (!user) return;
        setData({
            fullName: user.full_name ?? '',
            preferredName: user.preferred_name ?? '',
            email: user.email ?? '',
            phone: user.phone ?? '',
            // Not yet stored — `users` has no DOB/country columns. Left
            // editable as form-only state until those columns exist.
            dateOfBirth: '',
            countryCitizenship: student?.passport_country ?? '',
            countryBirth: '',
        });
    }, [user, student]);

    const set = (key: keyof ProfileFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setData(prev => ({ ...prev, [key]: e.target.value }));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-gray-900 mb-2">Profile Information</h2>
                <p className="text-gray-600">Update your personal information and contact details.</p>
            </div>
            <Card className="shadow-sm border-0">
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading profile…</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-700 mb-2">Full Name *</label>
                                    <input type="text" value={data.fullName} onChange={set('fullName')} className={INPUT_CLS} />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-2">Preferred Name</label>
                                    <input type="text" value={data.preferredName} onChange={set('preferredName')} className={INPUT_CLS} />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-2">Email (University)</label>
                                    <div className="relative">
                                        <input type="email" value={data.email} disabled className={LOCKED_CLS} />
                                        <Badge className="absolute right-2 top-2 bg-gray-200 text-gray-700 hover:bg-gray-200">Locked</Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-2">Phone Number</label>
                                    <input type="tel" value={data.phone} onChange={set('phone')} className={INPUT_CLS} placeholder="Not set" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-2">Date of Birth</label>
                                    <input type="date" value={data.dateOfBirth} onChange={set('dateOfBirth')} className={INPUT_CLS} />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-2">Country of Citizenship</label>
                                    <input type="text" value={data.countryCitizenship} onChange={set('countryCitizenship')} className={INPUT_CLS} placeholder="Not set" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-2">Country of Birth</label>
                                    <input type="text" value={data.countryBirth} onChange={set('countryBirth')} className={INPUT_CLS} placeholder="Not set" />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                                <Button className="bg-[#2A73E8] hover:bg-[#1557b0]" disabled>
                                    <Save className="w-4 h-4 mr-2" />Save Changes
                                </Button>
                                <Button variant="outline" disabled>Request Email Change</Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                                Save isn't wired up yet — the PUT /users/me endpoint will land in a follow-up. For now, this form reflects what's stored.
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
