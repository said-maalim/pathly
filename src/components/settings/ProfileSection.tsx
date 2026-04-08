/**
 * ProfileSection — Personal information form
 */
import { useState } from 'react';
import { Save } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface ProfileData {
    fullName: string;
    preferredName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    countryCitizenship: string;
    countryBirth: string;
}

const DEFAULT: ProfileData = {
    fullName: 'Sarah Chen',
    preferredName: 'Sarah',
    email: 'sarah.chen@university.edu',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1998-05-15',
    countryCitizenship: 'China',
    countryBirth: 'China',
};

const INPUT_CLS = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]';

export function ProfileSection() {
    const [data, setData] = useState<ProfileData>(DEFAULT);
    const set = (key: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setData(prev => ({ ...prev, [key]: e.target.value }));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-gray-900 mb-2">Profile Information</h2>
                <p className="text-gray-600">Update your personal information and contact details.</p>
            </div>
            <Card className="shadow-sm border-0">
                <CardContent className="pt-6">
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
                                <input type="email" value={data.email} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                                <Badge className="absolute right-2 top-2 bg-gray-200 text-gray-700 hover:bg-gray-200">Locked</Badge>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Phone Number *</label>
                            <input type="tel" value={data.phone} onChange={set('phone')} className={INPUT_CLS} />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Date of Birth *</label>
                            <input type="date" value={data.dateOfBirth} onChange={set('dateOfBirth')} className={INPUT_CLS} />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Country of Citizenship *</label>
                            <input type="text" value={data.countryCitizenship} onChange={set('countryCitizenship')} className={INPUT_CLS} />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Country of Birth *</label>
                            <input type="text" value={data.countryBirth} onChange={set('countryBirth')} className={INPUT_CLS} />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                        <Button className="bg-[#2A73E8] hover:bg-[#1557b0]">
                            <Save className="w-4 h-4 mr-2" />Save Changes
                        </Button>
                        <Button variant="outline">Request Email Change</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
