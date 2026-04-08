/**
 * SecuritySection — Password, 2FA, active sessions, danger zone
 */
import { useState } from 'react';
import { Monitor, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const INPUT_CLS = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]';

const ACTIVE_SESSIONS = [
    { id: 1, device: 'Chrome on MacBook Pro', location: 'Boston, MA', lastActive: '5 minutes ago', current: true },
    { id: 2, device: 'Safari on iPhone', location: 'Boston, MA', lastActive: '2 hours ago', current: false },
];

export function SecuritySection() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-gray-900 mb-2">Security Settings</h2>
                <p className="text-gray-600">Manage your account security and authentication.</p>
            </div>

            {/* Change Password */}
            <Card className="shadow-sm border-0">
                <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-gray-700 mb-2">Current Password</label>
                        <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} className={INPUT_CLS} placeholder="Enter current password" />
                            <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2">New Password</label>
                        <input type="password" className={INPUT_CLS} placeholder="Enter new password" />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2">Confirm New Password</label>
                        <input type="password" className={INPUT_CLS} placeholder="Confirm new password" />
                    </div>
                    <Button className="bg-[#2A73E8] hover:bg-[#1557b0]">Update Password</Button>
                </CardContent>
            </Card>

            {/* 2FA */}
            <Card className="shadow-sm border-0">
                <CardHeader><CardTitle>Two-Factor Authentication</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="text-gray-900 mb-1">Enable 2FA</p>
                            <p className="text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <Button variant="outline">Enable 2FA</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card className="shadow-sm border-0">
                <CardHeader><CardTitle>Active Sessions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {ACTIVE_SESSIONS.map(session => (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Monitor className="w-5 h-5 text-gray-600" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-gray-900">{session.device}</p>
                                        {session.current && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Current</Badge>}
                                    </div>
                                    <p className="text-gray-600">{session.location} • {session.lastActive}</p>
                                </div>
                            </div>
                            {!session.current && (
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">Revoke</Button>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="shadow-sm border-0 border-red-200">
                <CardHeader><CardTitle className="text-red-600">Danger Zone</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                        <div>
                            <p className="text-gray-900 mb-1">Delete Account</p>
                            <p className="text-gray-600">Permanently delete your account and all data</p>
                        </div>
                        <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">Delete Account</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
