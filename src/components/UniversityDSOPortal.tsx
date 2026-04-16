/**
 * UniversityDSOPortal — Root DSO portal component.
 *
 * Architecture: uses the new DSOShell (sidebar + top bar) to wrap all views.
 * The shell is persistent across all child views so navigation always shows.
 *
 * Sub-views are lazy-switched with the `currentView` state variable.
 * No existing sub-component APIs were changed.
 */
import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

// ─── Shell + Dashboard ────────────────────────────────────────────────────────
import { DSOShell } from './dso/DSOShell';
import { DSODashboard } from './dso/DSODashboard';
import type { DSOView } from './dso/types';

// ─── Existing sub-views (APIs unchanged) ─────────────────────────────────────
import { DSORequestCenter } from './DSORequestCenter';
import { DSOCommunicationCenter } from './DSOCommunicationCenter';
import { DSOStudentCenter } from './DSOStudentCenter';
import { DSOCreateRequestAction } from './DSOCreateRequestAction';
import { DSORequestActionsDashboard } from './DSORequestActionsDashboard';
import { DSORequestActionDetail } from './DSORequestActionDetail';
import { DSONRosterImport } from './DSONRosterImport';

// ─── New architecture imports ─────────────────────────────────────────────────
import { useDSOStudents } from '../hooks/useDSOStudents';
import { updateStudentSevis, updateStudentVisa, updateStudentPassport } from '../services/student.service';
import { getInitials } from '../lib/utils';
import type { UserData } from '../types';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import {
  Shield, FileCheck, CreditCard, Mail, Send, FileText, Loader2 as Loader2Icon
} from 'lucide-react';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface UniversityDSOPortalProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userData?: UserData;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UniversityDSOPortal({ onNavigate, onLogout, userData }: UniversityDSOPortalProps) {
  const [currentView, setCurrentView] = useState<DSOView>('dashboard');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [targetStudentForRequest, setTargetStudentForRequest] = useState<{ id: string; name: string } | null>(null);

  // Modal states (kept from original — used by some sub-views)
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [sevisUpdateOpen, setSevisUpdateOpen] = useState(false);
  const [visaUpdateOpen, setVisaUpdateOpen] = useState(false);
  const [passportUpdateOpen, setPassportUpdateOpen] = useState(false);

  // Form state
  const [sevisFormData, setSevisFormData] = useState({ studentId: '', sevisStatus: 'Active', compliance: 'In Compliance', nextCheckDate: '', notes: '' });
  const [visaFormData, setVisaFormData] = useState({ studentId: '', visaType: 'F-1', status: 'active', expirationDate: '' });
  const [passportFormData, setPassportFormData] = useState({ studentId: '', passportStatus: 'Valid', passportExpirationDate: '' });
  const [updating, setUpdating] = useState(false);

  // ─── User Info ───────────────────────────────────────────────────────────────
  const userEmail = userData?.data?.user?.email ?? 'admin@university.edu';
  const userName = userData?.data?.user?.user_metadata?.name ?? 'DSO Admin';
  const schoolId = userData?.data?.user?.user_metadata?.schoolId
    ?? userData?.data?.user?.user_metadata?.universityId ?? '';
  const accessToken = userData?.data?.session?.access_token ?? '';
  const userInitials = getInitials(userName);

  // ─── Data ────────────────────────────────────────────────────────────────────
  const { students, loading, error, refresh: refreshStudents } = useDSOStudents(schoolId);

  const mappedStudents = students.map((s) => ({
    ...s,
    name: (s.user as { full_name?: string })?.full_name ?? (s.user as { email?: string })?.email ?? 'Unknown Student',
    email: (s.user as { email?: string })?.email ?? '',
  }));

  // ─── Update Handlers ─────────────────────────────────────────────────────────
  const handleSevisUpdate = useCallback(async () => {
    if (!sevisFormData.studentId) { alert('Please select a student'); return; }
    try {
      setUpdating(true);
      await updateStudentSevis(sevisFormData.studentId, { sevisStatus: sevisFormData.sevisStatus, compliance: sevisFormData.compliance, nextCheckDate: sevisFormData.nextCheckDate || undefined, notes: sevisFormData.notes || undefined });
      alert('SEVIS status updated successfully!');
      setSevisUpdateOpen(false);
      setSevisFormData({ studentId: '', sevisStatus: 'Active', compliance: 'In Compliance', nextCheckDate: '', notes: '' });
      await refreshStudents();
    } catch (err) { alert(`Failed to update SEVIS status: ${err instanceof Error ? err.message : 'Unknown error'}`); }
    finally { setUpdating(false); }
  }, [sevisFormData, refreshStudents]);

  const handleVisaUpdate = useCallback(async () => {
    if (!visaFormData.studentId) { alert('Please select a student'); return; }
    try {
      setUpdating(true);
      await updateStudentVisa(visaFormData.studentId, { visaType: visaFormData.visaType, visaStatus: visaFormData.status, visaExpirationDate: visaFormData.expirationDate || undefined });
      alert('Visa status updated successfully!');
      setVisaUpdateOpen(false);
      setVisaFormData({ studentId: '', visaType: 'F-1', status: 'active', expirationDate: '' });
      await refreshStudents();
    } catch (err) { alert(`Failed to update visa status: ${err instanceof Error ? err.message : 'Unknown error'}`); }
    finally { setUpdating(false); }
  }, [visaFormData, refreshStudents]);

  const handlePassportUpdate = useCallback(async () => {
    if (!passportFormData.studentId) { alert('Please select a student'); return; }
    try {
      setUpdating(true);
      await updateStudentPassport(passportFormData.studentId, { passportExpirationDate: passportFormData.passportExpirationDate });
      alert('Passport status updated successfully!');
      setPassportUpdateOpen(false);
      setPassportFormData({ studentId: '', passportStatus: 'Valid', passportExpirationDate: '' });
      await refreshStudents();
    } catch (err) { alert(`Failed to update passport status: ${err instanceof Error ? err.message : 'Unknown error'}`); }
    finally { setUpdating(false); }
  }, [passportFormData, refreshStudents]);

  // ─── Navigation ──────────────────────────────────────────────────────────────
  const navigateTo = (view: DSOView) => setCurrentView(view);

  // ─── Child View Selector ─────────────────────────────────────────────────────
  const renderContent = () => {
    switch (currentView) {
      case 'request-center':
        return <DSORequestCenter onBack={() => navigateTo('dashboard')} onLogout={onLogout} userName={userName} userData={userData} />;

      case 'communication-center':
        return (
          <DSOCommunicationCenter
            onBack={() => navigateTo('dashboard')}
            onLogout={onLogout}
            userName={userName}
            schoolId={schoolId}
            students={mappedStudents.map(s => ({
              id: s.id,
              user_id: (s as any).user_id ?? s.id,
              name: s.name,
              email: s.email,
            }))}
          />
        );

      case 'student-center':
        return (
          <DSOStudentCenter
            onBack={() => navigateTo('dashboard')}
            onLogout={onLogout}
            userName={userName}
            userData={userData}
            onCreateRequestAction={(studentId, studentName) => {
              setTargetStudentForRequest({ id: studentId, name: studentName });
              navigateTo('create-request-action');
            }}
          />
        );

      case 'request-actions-dashboard':
      case 'compliance':
        return (
          <DSORequestActionsDashboard
            onBack={() => navigateTo('dashboard')}
            onCreateNew={() => navigateTo('create-request-action')}
            onViewDetail={(requestId) => { setSelectedRequestId(requestId); navigateTo('request-action-detail'); }}
            userData={userData}
          />
        );

      case 'create-request-action':
        return <DSOCreateRequestAction onBack={() => navigateTo('request-actions-dashboard')} userData={userData} targetStudent={targetStudentForRequest} />;

      case 'request-action-detail':
        if (!selectedRequestId) { navigateTo('dashboard'); return null; }
        return (
          <DSORequestActionDetail
            requestId={selectedRequestId}
            onBack={() => { setSelectedRequestId(null); navigateTo('request-actions-dashboard'); }}
            userData={userData}
          />
        );

      case 'roster-import':
        return <DSONRosterImport />;

      case 'admin-settings':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Settings</h1>
            <p className="text-gray-500">Settings panel coming soon.</p>
          </div>
        );

      case 'dashboard':
      default:
        return (
          <DSODashboard
            schoolId={schoolId}
            accessToken={accessToken}
            studentCount={students.length}
            onNavigate={navigateTo}
          />
        );
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <DSOShell
      currentView={currentView}
      onNavigate={navigateTo}
      userName={userName}
      userInitials={userInitials}
      notificationCount={0}
      onLogout={onLogout}
    >
      {/* Loading / error banners */}
      {loading && currentView === 'dashboard' && (
        <div className="flex items-center gap-2 text-gray-500 text-sm px-6 pt-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading student data…
        </div>
      )}
      {error && currentView === 'dashboard' && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {renderContent()}

      {/* ── Global Dialogs (SEVIS / Visa / Passport / Bulk Email) ─────────────── */}
      {/* These are opened programmatically from the sidebar or elsewhere */}

      {/* Bulk Email Dialog */}
      <Dialog open={bulkEmailOpen} onOpenChange={setBulkEmailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Bulk Email Reminder</DialogTitle>
            <DialogDescription>Send a reminder email to a group of students.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Recipient Group</label>
              <Select defaultValue="expiring">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="expiring">Students with Expiring Visas</SelectItem>
                  <SelectItem value="pending">Students with Pending Actions</SelectItem>
                  <SelectItem value="noncompliant">Non-Compliant Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email Template</label>
              <Select defaultValue="renewal">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="renewal">Visa Renewal Reminder</SelectItem>
                  <SelectItem value="documents">Document Upload Request</SelectItem>
                  <SelectItem value="compliance">Compliance Check</SelectItem>
                  <SelectItem value="custom">Custom Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Message</label>
              <Textarea placeholder="Enter your message here…" className="min-h-28" defaultValue="This is a reminder to renew your visa status. Please contact the DSO office if you need assistance." />
            </div>
            <div className="flex gap-2">
              <Button className="bg-[#2A73E8] hover:bg-[#1557b0]" onClick={() => { alert('Bulk email sent successfully!'); setBulkEmailOpen(false); }}>
                <Send className="w-4 h-4 mr-2" />Send Email
              </Button>
              <Button variant="outline" onClick={() => setBulkEmailOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SEVIS Update Dialog */}
      <Dialog open={sevisUpdateOpen} onOpenChange={setSevisUpdateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Student SEVIS Status</DialogTitle>
            <DialogDescription>Update the SEVIS status and compliance of a student.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Select Student</label>
              <Select value={sevisFormData.studentId} onValueChange={(v) => setSevisFormData(p => ({ ...p, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Choose a student…" /></SelectTrigger>
                <SelectContent>
                  {mappedStudents.map((s, i) => <SelectItem key={i} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">SEVIS Status</label>
              <Select value={sevisFormData.sevisStatus} onValueChange={(v) => setSevisFormData(p => ({ ...p, sevisStatus: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Initial">Initial</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Compliance Status</label>
              <Select value={sevisFormData.compliance} onValueChange={(v) => setSevisFormData(p => ({ ...p, compliance: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Compliance">In Compliance</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Out of Compliance">Out of Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Next Check Date</label>
              <input type="date" value={sevisFormData.nextCheckDate} onChange={(e) => setSevisFormData(p => ({ ...p, nextCheckDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Notes</label>
              <Textarea value={sevisFormData.notes} onChange={(e) => setSevisFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Add any relevant notes…" className="min-h-20" />
            </div>
            <div className="flex gap-2">
              <Button className="bg-[#2A73E8] hover:bg-[#1557b0]" onClick={handleSevisUpdate} disabled={updating}>
                {updating ? <><Loader2Icon className="w-4 h-4 mr-2 animate-spin" />Updating…</> : 'Update SEVIS Status'}
              </Button>
              <Button variant="outline" onClick={() => setSevisUpdateOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visa Update Dialog */}
      <Dialog open={visaUpdateOpen} onOpenChange={setVisaUpdateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Student Visa Status</DialogTitle>
            <DialogDescription>Update the visa type and status of a student.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Select Student</label>
              <Select value={visaFormData.studentId} onValueChange={(v) => setVisaFormData(p => ({ ...p, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Choose a student…" /></SelectTrigger>
                <SelectContent>
                  {mappedStudents.map((s, i) => <SelectItem key={i} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Visa Type</label>
              <Select value={visaFormData.visaType} onValueChange={(v) => setVisaFormData(p => ({ ...p, visaType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="F-1">F-1 (Academic Student)</SelectItem>
                  <SelectItem value="J-1">J-1 (Exchange Visitor)</SelectItem>
                  <SelectItem value="M-1">M-1 (Vocational Student)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Visa Status</label>
              <Select value={visaFormData.status} onValueChange={(v) => setVisaFormData(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Expiration Date</label>
              <input type="date" value={visaFormData.expirationDate} onChange={(e) => setVisaFormData(p => ({ ...p, expirationDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]" />
            </div>
            <div className="flex gap-2">
              <Button className="bg-[#2A73E8] hover:bg-[#1557b0]" onClick={handleVisaUpdate} disabled={updating}>
                {updating ? <><Loader2Icon className="w-4 h-4 mr-2 animate-spin" />Updating…</> : 'Update Visa Status'}
              </Button>
              <Button variant="outline" onClick={() => setVisaUpdateOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Passport Update Dialog */}
      <Dialog open={passportUpdateOpen} onOpenChange={setPassportUpdateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Student Passport Status</DialogTitle>
            <DialogDescription>Update the passport status and expiration date of a student.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Select Student</label>
              <Select value={passportFormData.studentId} onValueChange={(v) => setPassportFormData(p => ({ ...p, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Choose a student…" /></SelectTrigger>
                <SelectContent>
                  {mappedStudents.map((s, i) => <SelectItem key={i} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Passport Status</label>
              <Select value={passportFormData.passportStatus} onValueChange={(v) => setPassportFormData(p => ({ ...p, passportStatus: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Valid">Valid</SelectItem>
                  <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Expiration Date</label>
              <input type="date" value={passportFormData.passportExpirationDate} onChange={(e) => setPassportFormData(p => ({ ...p, passportExpirationDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]" />
            </div>
            <div className="flex gap-2">
              <Button className="bg-[#2A73E8] hover:bg-[#1557b0]" onClick={handlePassportUpdate} disabled={updating}>
                {updating ? <><Loader2Icon className="w-4 h-4 mr-2 animate-spin" />Updating…</> : 'Update Passport Status'}
              </Button>
              <Button variant="outline" onClick={() => setPassportUpdateOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DSOShell>
  );
}