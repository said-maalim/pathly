/**
 * DSOCreateRequestAction — refactored to match Pathly inline style design.
 */
import { useState, useEffect } from 'react';
import { projectId } from '../utils/supabase/info';

interface DSOCreateRequestActionProps {
  onBack: () => void;
  userData?: any;
  targetStudent?: { id: string; name: string } | null;
}

type RequestType = 'document' | 'form' | 'confirmation' | '';
type TargetType = 'single' | 'bulk';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'dropdown' | 'checkbox';
  options?: string[];
  required: boolean;
}

interface Student {
  id: string;
  name: string;
  email: string;
  visaProfile?: any;
}

const FORM_TEMPLATES = {
  enrollment: {
    name: 'Enrollment Verification',
    fields: [
      { id: '1', label: 'Full Name', type: 'text' as const, required: true },
      { id: '2', label: 'Student ID', type: 'text' as const, required: true },
      { id: '3', label: 'Program of Study', type: 'text' as const, required: true },
      { id: '4', label: 'Expected Graduation Date', type: 'date' as const, required: true },
      { id: '5', label: 'Full-time Status', type: 'dropdown' as const, options: ['Full-time', 'Part-time'], required: true }
    ]
  },
  employment: {
    name: 'Employment Information',
    fields: [
      { id: '1', label: 'Employer Name', type: 'text' as const, required: true },
      { id: '2', label: 'Job Title', type: 'text' as const, required: true },
      { id: '3', label: 'Start Date', type: 'date' as const, required: true },
      { id: '4', label: 'Employment Type', type: 'dropdown' as const, options: ['CPT', 'OPT', 'STEM OPT'], required: true },
      { id: '5', label: 'Working Hours per Week', type: 'text' as const, required: true }
    ]
  },
  address: {
    name: 'Address Update',
    fields: [
      { id: '1', label: 'Street Address', type: 'text' as const, required: true },
      { id: '2', label: 'City', type: 'text' as const, required: true },
      { id: '3', label: 'State', type: 'text' as const, required: true },
      { id: '4', label: 'ZIP Code', type: 'text' as const, required: true },
      { id: '5', label: 'Effective Date', type: 'date' as const, required: true }
    ]
  }
};

export function DSOCreateRequestAction({ onBack, userData, targetStudent }: DSOCreateRequestActionProps) {
  const [requestType, setRequestType] = useState<RequestType>('');
  const [targetType, setTargetType] = useState<TargetType>(targetStudent ? 'single' : 'single');
  const [selectedStudent, setSelectedStudent] = useState(targetStudent ? targetStudent.id : '');
  const [bulkFilter, setBulkFilter] = useState('all');
  const [deadline, setDeadline] = useState('');
  const [sending, setSending] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Document
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentInstructions, setDocumentInstructions] = useState('');

  // Form
  const [formTemplate, setFormTemplate] = useState<'enrollment' | 'employment' | 'address' | 'custom'>('enrollment');
  const [customFields, setCustomFields] = useState<FormField[]>([]);

  // Confirmation
  const [confirmationStatement, setConfirmationStatement] = useState('I acknowledge that my SEVIS status is active and I understand my responsibilities.');

  const universityId = userData?.data?.user?.user_metadata?.schoolId || userData?.data?.user?.user_metadata?.universityId || 'stanford';

  useEffect(() => {
    // If targetStudent was passed and we don't have it in our list yet, fake it until load
    if (targetStudent && !students.find(s => s.id === targetStudent.id)) {
      setStudents([{ id: targetStudent.id, name: targetStudent.name, email: '', visaProfile: { visaType: 'F-1' } }]);
    }
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const token = userData?.data?.session?.access_token;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-268175b3/students/school/${universityId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const list = data.students || data.data || (Array.isArray(data) ? data : []);
      const mapped = list.map((s: any) => ({
        ...s,
        name: s.user?.full_name || s.user?.raw_user_meta_data?.name || s.user?.email || s.email || 'Unknown Student',
        email: s.user?.email || s.email,
        visaProfile: s.visaProfile || { visaType: s.visa_type || 'F-1' }
      }));
      setStudents(mapped);
    } catch {
      console.error('Failed to fetch students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const fileTypes = ['PDF', 'JPG', 'PNG', 'DOC', 'DOCX'];

  const addCustomField = () => {
    setCustomFields([...customFields, { id: Date.now().toString(), label: 'New Field', type: 'text', required: false }]);
  };
  const removeCustomField = (id: string) => setCustomFields(customFields.filter(f => f.id !== id));
  const updateCustomField = (id: string, updates: Partial<FormField>) => setCustomFields(customFields.map(f => f.id === id ? { ...f, ...updates } : f));

  const handleSendRequest = async () => {
    if (!requestType) return alert('Select a request type');
    if (requestType === 'document' && !documentTitle) return alert('Enter document title');
    if (targetType === 'single' && !selectedStudent) return alert('Select a student');
    
    setSending(true);
    try {
      await new Promise(r => setTimeout(r, 800)); // Simulate API
      alert('Request Action sent successfully!');
      onBack();
    } catch (e: any) {
      alert(`Failed to send: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '24px 28px', marginBottom: '20px' };
  const cardTitle: React.CSSProperties = { fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '4px' };
  const cardDesc: React.CSSProperties = { fontSize: '13px', color: '#6b7280', marginBottom: '20px' };
  const label: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' };
  const input: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13.5px', fontFamily: 'inherit', color: '#111827', background: '#fff' };
  const select: React.CSSProperties = { ...input, cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '14px' };

  const TypeBox = ({ id, icon, title, desc }: { id: RequestType; icon: React.ReactNode; title: string; desc: string }) => {
    const active = requestType === id;
    return (
      <button onClick={() => setRequestType(id)} style={{ flex: 1, padding: '20px', border: `2px solid ${active ? '#2563eb' : '#e5e7eb'}`, borderRadius: '10px', background: active ? '#eff6ff' : '#fff', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}>
        <div style={{ color: active ? '#2563eb' : '#9ca3af', marginBottom: '12px' }}>{icon}</div>
        <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '12.5px', color: '#6b7280', lineHeight: 1.4 }}>{desc}</div>
      </button>
    );
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#f4f5f7', fontFamily: "'DM Sans', 'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '28px 32px 0' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 500, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: '16px' }}
          onMouseEnter={e => e.currentTarget.style.color = '#111827'} onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15"><path d="M10 3L5 8l5 5"/></svg>
          Back to Dashboard
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.3px', margin: '0 0 4px', color: '#111827' }}>Create Request Action</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px' }}>Request information, documents, or confirmation from students</p>
      </div>

      <div style={{ padding: '0 32px 32px', maxWidth: '800px', flex: 1 }}>
        
        {/* Request Type */}
        <div style={card}>
          <div style={cardTitle}>Request Type</div>
          <div style={cardDesc}>Select the type of action you want to request</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <TypeBox id="document" title="Document Upload" desc="Request specific documents from students" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>} />
            <TypeBox id="form" title="Form Submission" desc="Request students to complete a form" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>} />
            <TypeBox id="confirmation" title="Confirmation" desc="Request acknowledgement or confirmation" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>} />
          </div>
        </div>

        {/* Request Details */}
        {requestType && (
          <div style={card}>
            <div style={cardTitle}>Request Details</div>
            <div style={cardDesc}>Configure the specific requirements for this request</div>

            {requestType === 'document' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={label}>Document Name / Title *</label>
                  <input type="text" placeholder="e.g., Passport Copy or Signed I-20" value={documentTitle} onChange={e => setDocumentTitle(e.target.value)} style={input} />
                </div>
                <div>
                  <label style={label}>Optional Instructions</label>
                  <textarea placeholder="Please upload a clear, readable copy." value={documentInstructions} onChange={e => setDocumentInstructions(e.target.value)} rows={3} style={{ ...input, resize: 'vertical' }} />
                </div>
              </div>
            )}

            {requestType === 'form' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={label}>Form Template</label>
                  <select value={formTemplate} onChange={e => setFormTemplate(e.target.value as any)} style={select}>
                    <option value="enrollment">Enrollment Verification</option>
                    <option value="employment">Employment Information</option>
                    <option value="address">Address Update</option>
                    <option value="custom">Custom Template</option>
                  </select>
                </div>
                {formTemplate !== 'custom' ? (
                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827' }}>Form Preview: {FORM_TEMPLATES[formTemplate].name}</div>
                      <span style={{ fontSize: '11px', fontWeight: 600, background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '10px' }}>{FORM_TEMPLATES[formTemplate].fields.length} fields</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {FORM_TEMPLATES[formTemplate].fields.map(f => (
                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                          <svg viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" width="14" height="14"><circle cx="7" cy="7" r="5.5"/><path d="M7 5v3M7 9.5v.5"/></svg>
                          <span style={{ color: '#374151' }}>{f.label}</span>
                          <span style={{ border: '1px solid #e5e7eb', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#6b7280', textTransform: 'capitalize' }}>{f.type}</span>
                          {f.required && <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Required</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <label style={{ ...label, marginBottom: 0 }}>Custom Fields</label>
                      <button onClick={addCustomField} style={{ padding: '6px 12px', borderRadius: '6px', background: 'none', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M7 1v12M1 7h12"/></svg>
                        Add Field
                      </button>
                    </div>
                    {customFields.length === 0 ? (
                      <div style={{ background: '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: '8px', padding: '32px 20px', textAlign: 'center' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" width="40" height="40" style={{ margin: '0 auto 12px' }}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>No fields added yet. Click "Add Field" to create your custom form.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {customFields.map(f => (
                          <div key={f.id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <input type="text" placeholder="Field Label" value={f.label} onChange={e => updateCustomField(f.id, { label: e.target.value })} style={{ ...input, padding: '8px 12px' }} />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <select value={f.type} onChange={e => updateCustomField(f.id, { type: e.target.value as any })} style={{ ...select, padding: '8px 30px 8px 12px', width: '120px' }}>
                                  <option value="text">Text</option>
                                  <option value="date">Date</option>
                                  <option value="dropdown">Dropdown</option>
                                  <option value="checkbox">Checkbox</option>
                                </select>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
                                  <input type="checkbox" checked={f.required} onChange={e => updateCustomField(f.id, { required: e.target.checked })} /> Required
                                </label>
                              </div>
                            </div>
                            <button onClick={() => removeCustomField(f.id)} style={{ padding: '6px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M1 1l12 12M13 1L1 13"/></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {requestType === 'confirmation' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={label}>Confirmation Statement</label>
                  <textarea placeholder="I acknowledge that..." value={confirmationStatement} onChange={e => setConfirmationStatement(e.target.value)} rows={4} style={{ ...input, resize: 'vertical' }} />
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>Students will see this statement and must check a box to confirm acknowledgement.</p>
                </div>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>Student View Preview</div>
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '16px' }}>
                    <p style={{ fontSize: '13.5px', color: '#374151', margin: '0 0 12px' }}>{confirmationStatement}</p>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13.5px', color: '#374151', cursor: 'pointer' }}>
                      <input type="checkbox" disabled style={{ marginTop: '2px' }} />
                      I acknowledge and confirm
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Deadline */}
        {requestType && (
          <div style={card}>
            <div style={cardTitle}>Deadline (Optional)</div>
            <div style={cardDesc}>Students will receive reminders before the deadline</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg viewBox="0 0 20 20" fill="none" stroke="#9ca3af" strokeWidth="1.5" width="20" height="20"><rect x="3" y="4" width="14" height="14" rx="2"/><path d="M16 8H4M6 2v4M14 2v4"/></svg>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ ...input, maxWidth: '240px' }} />
            </div>
          </div>
        )}

        {/* Send To */}
        {requestType && (
          <div style={card}>
            <div style={cardTitle}>Send To</div>
            <div style={cardDesc}>Choose who should receive this request</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => setTargetType('single')} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', background: targetType === 'single' ? '#eff6ff' : '#fff', border: `2px solid ${targetType === 'single' ? '#2563eb' : '#e5e7eb'}`, borderRadius: '8px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}>
                <input type="radio" checked={targetType === 'single'} readOnly style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>Single Student</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>Send this request to one specific student</div>
                </div>
              </button>
              {targetType === 'single' && (
                <div style={{ padding: '0 0 0 34px', marginLeft: '16px', borderLeft: '2px solid #e5e7eb', marginBottom: '8px' }}>
                  <label style={label}>Select Student</label>
                  <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} style={select}>
                    <option value="" disabled>Search and select a student...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.visaProfile?.visaType || 'F-1 Visa'}</option>)}
                  </select>
                </div>
              )}

              <button onClick={() => setTargetType('bulk')} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', background: targetType === 'bulk' ? '#eff6ff' : '#fff', border: `2px solid ${targetType === 'bulk' ? '#2563eb' : '#e5e7eb'}`, borderRadius: '8px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}>
                <input type="radio" checked={targetType === 'bulk'} readOnly style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>Bulk Students</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>Send to all students or a filtered group</div>
                </div>
              </button>
              {targetType === 'bulk' && (
                <div style={{ padding: '0 0 0 34px', marginLeft: '16px', borderLeft: '2px solid #e5e7eb' }}>
                  <label style={label}>Student Group</label>
                  <select value={bulkFilter} onChange={e => setBulkFilter(e.target.value)} style={select}>
                    <option value="all">All Students</option>
                    <option value="opt">OPT Students</option>
                    <option value="graduating">Graduating This Term</option>
                    <option value="f1">F-1 Visa Holders</option>
                    <option value="expiring">Expiring Visas (Next 60 Days)</option>
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v3.5M7 9.5v.5"/></svg>
                    Estimated recipients: {bulkFilter === 'all' ? '1,247' : bulkFilter === 'opt' ? '156' : bulkFilter === 'graduating' ? '89' : '1,189'} students
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      
      {/* Sticky footer */}
      <div style={{ position: 'sticky', bottom: 0, padding: '16px 32px', background: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <button onClick={onBack} disabled={sending} style={{ padding: '9px 18px', borderRadius: '6px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', fontSize: '13.5px', fontWeight: 500, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          onMouseEnter={e => !sending && (e.currentTarget.style.background = '#f9fafb')} onMouseLeave={e => !sending && (e.currentTarget.style.background = '#fff')}>
          Cancel
        </button>
        <button onClick={handleSendRequest} disabled={!requestType || sending} style={{ padding: '9px 18px', borderRadius: '6px', background: (!requestType || sending) ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', fontSize: '13.5px', fontWeight: 500, cursor: (!requestType || sending) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}
          onMouseEnter={e => (!requestType || sending ? null : e.currentTarget.style.background = '#1d4ed8')} onMouseLeave={e => (!requestType || sending ? null : e.currentTarget.style.background = '#2563eb')}>
          {sending ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          ) : (
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M1 7l12-5-4 12-3-5-5-2z"/></svg>
          )}
          {sending ? 'Sending...' : 'Send Request'}
        </button>
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}