/**
 * DSONRosterImport — Data Imports Page
 * Refactored to match the Pathly design system (inline styles, #f4f5f7 bg, white cards)
 */
import { useState, useCallback, useRef } from 'react';
import { uploadRoster, confirmImport, getRosterHistory, downloadErrorCsv } from '../services/roster.service';
import type { UploadPreviewResponse, ConfirmImportResponse, RosterImport, RosterError, PreviewRow } from '../types';

type Step = 'upload' | 'preview' | 'confirming' | 'result';

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function generateCsvTemplate() {
  const header = ['Student ID', 'First Name', 'Last Name', 'Preferred Name', 'University Email', 'Visa Type', 'SEVIS Status', 'SEVIS ID', 'Degree Level', 'Major', 'Program of Study', 'Program Start Date', 'Expected Graduation Date', 'I-20 Expiration Date'].join(',');
  const example = ['U1234567', 'Priya', 'Patel', '', 'ppatel@university.edu', 'F-1', 'Active', 'N0012345678', 'Graduate', 'Computer Science', 'MS in Computer Science', '2024-08-20', '2026-05-15', '2026-08-20'].join(',');
  const blob = new Blob([`${header}\n${example}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'pathly-roster-template.csv'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const statusCfg = (s: string) => {
  if (s === 'completed') return { label: 'Completed', bg: '#dcfce7', color: '#166534' };
  if (s === 'failed') return { label: 'Failed', bg: '#fee2e2', color: '#991b1b' };
  if (s === 'processing') return { label: 'Processing', bg: '#dbeafe', color: '#1d4ed8' };
  if (s === 'partially_completed') return { label: 'Partial', bg: '#fef3c7', color: '#92400e' };
  return { label: 'Pending', bg: '#f3f4f6', color: '#374151' };
};

export function DSONRosterImport() {
  const [step, setStep] = useState<Step>('upload');
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<UploadPreviewResponse | null>(null);
  const [errorsOpen, setErrorsOpen] = useState(false);
  const [result, setResult] = useState<ConfirmImportResponse | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [history, setHistory] = useState<RosterImport[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFile = async (file: File) => {
    setUploadError(null);
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!['.csv', '.xlsx', '.xls'].includes(ext)) return setUploadError(`Invalid type: ${ext}. Upload CSV or Excel.`);
    if (file.size > 26_214_400) return setUploadError('File is too large. Max 25 MB.');
    setSelectedFile(file); setUploading(true); setStep('upload');
    try {
      setPreview(await uploadRoster(file));
      setStep('preview');
    } catch (e: any) { setUploadError(e.message); setSelectedFile(null); } finally { setUploading(false); }
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); };
  const loadHistory = async () => { setHistoryLoading(true); try { setHistory(await getRosterHistory()); setHistoryLoaded(true); } catch { setHistoryLoaded(true); } finally { setHistoryLoading(false); } };
  const reset = () => { setStep('upload'); setSelectedFile(null); setPreview(null); setResult(null); setUploadError(null); setConfirmError(null); setErrorsOpen(false); };
  
  const handleConfirm = async () => {
    if (!preview) return;
    setStep('confirming'); setConfirmError(null);
    try { setResult(await confirmImport(preview.importId)); setStep('result'); loadHistory(); }
    catch (e: any) { setConfirmError(e.message); setStep('preview'); }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '24px 28px', marginBottom: '20px' };
  const cardTitle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '20px' };
  const btnPrimary: React.CSSProperties = { padding: '9px 18px', borderRadius: '6px', background: '#2563eb', color: '#fff', border: 'none', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' };
  const btnOutline: React.CSSProperties = { padding: '9px 18px', borderRadius: '6px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' };
  const thStyle: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: '#6b7280', fontSize: '12px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' };
  const tdStyle: React.CSSProperties = { padding: '12px 16px', color: '#111827', fontSize: '13px', borderBottom: '1px solid #e5e7eb' };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', background: '#f4f5f7', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.3px', margin: '0 0 4px', color: '#111827' }}>Data Imports</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Upload a CSV or Excel file to onboard or update students in bulk.</p>
      </div>

      <div style={{ maxWidth: '960px' }}>
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div style={card}>
            <div style={cardTitle}>
              <svg viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.6" width="18" height="18"><path d="M3 14h10M8 2v9M4 6l4-4 4 4"/></svg>
              Upload Roster File
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#eff6ff', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', color: '#1d4ed8', marginBottom: '20px' }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M7 2v10M2 7l5 5 5-5"/></svg>
              <span>Download the official template so your file is formatted correctly.</span>
              <button onClick={generateCsvTemplate} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>Download Template</button>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => fileInputRef.current?.click()}
              style={{ padding: '60px 20px', border: `2px dashed ${dragging ? '#2563eb' : '#d1d5db'}`, borderRadius: '12px', background: dragging ? '#eff6ff' : '#f9fafb', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" width="40" height="40" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#111827', margin: '0 0 4px' }}>Parsing {selectedFile?.name}…</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Validating rows, detecting duplicates…</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" width="48" height="48"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#111827', margin: '0 0 2px' }}>Drop your CSV or Excel file here</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>or click to browse — max 25 MB</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Accepted: .csv · .xlsx · .xls</div>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
            
            {uploadError && (
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '13px' }}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="7" cy="7" r="5.5"/><path d="M5 5l4 4M9 5l-4 4"/></svg>
                {uploadError}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && preview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Total Rows', val: preview.totalRows, c: '#111827', ic: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M2 3h10v8H2zM2 6h10M2 9h10M5 3v8M9 3v8"/></svg> },
                { label: 'New Students', val: preview.newStudents, c: '#15803d', ic: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="7" cy="4" r="2.5"/><path d="M2.5 13c0-3 9-3 9 0"/><path d="M12 4h-2M13 3v2"/></svg> },
                { label: 'Updates', val: preview.updatedStudents, c: '#1d4ed8', ic: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M1 4v4h4M13 10V6H9"/><path d="M3.5 9A5 5 0 0012 6M10.5 5A5 5 0 002 8"/></svg> },
                { label: 'Errors', val: preview.errorRows.length, c: '#b91c1c', ic: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M7 1L1 13h12L7 1zM7 6v3M7 11h.01"/></svg> }
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.c, width: '28px', height: '28px', background: s.c === '#111827' ? '#f3f4f6' : `${s.c}1A`, borderRadius: '6px' }}>{s.ic}</div>
                  <div>
                    <div style={{ fontSize: '11.5px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: s.c }}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              <span style={{ fontWeight: 600, color: '#111827' }}>{preview.fileName}</span> {selectedFile && `(${formatBytes(selectedFile.size)})`} • {preview.validRows} out of {preview.totalRows} rows are valid.
            </div>

            {preview.errorRows.length > 0 && (
              <div style={{ border: '1px solid #fca5a5', borderRadius: '8px', background: '#fff', overflow: 'hidden' }}>
                <div onClick={() => setErrorsOpen(!errorsOpen)} style={{ padding: '12px 16px', background: '#fef2f2', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#991b1b', fontWeight: 500 }}>
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M7 1L1 13h12L7 1zM7 6v3M7 11h.01"/></svg>
                  {preview.errorRows.length} rows with errors (will be skipped)
                  <div style={{ marginLeft: 'auto' }}>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14" style={{ transform: errorsOpen ? 'rotate(180deg)' : 'none', transition: '0.15s' }}><path d="M3 5l4 4 4-4"/></svg>
                  </div>
                </div>
                {errorsOpen && (
                  <div style={{ borderTop: '1px solid #fca5a5', maxHeight: '200px', overflowY: 'auto' }}>
                    {preview.errorRows.map((e, i) => (
                      <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 16px', borderBottom: '1px solid #fee2e2', fontSize: '13px', color: '#374151' }}>
                        <span style={{ color: '#9ca3af', width: '45px' }}>Row {e.row}</span>
                        <span style={{ fontWeight: 500, width: '100px' }}>{e.field}</span>
                        <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>{e.code}</span>
                        <span style={{ flex: 1 }}>{e.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {preview.preview.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#111827', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>Preview ({preview.preview.length} valid rows shown)</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead><tr><th style={thStyle}>Action</th><th style={thStyle}>Name</th><th style={thStyle}>Email</th><th style={thStyle}>Student ID</th><th style={thStyle}>Visa</th><th style={thStyle}>Level</th></tr></thead>
                    <tbody>
                      {preview.preview.map(r => (
                        <tr key={r.row}>
                          <td style={tdStyle}><span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: r.action === 'create' ? '#dcfce7' : '#dbeafe', color: r.action === 'create' ? '#166534' : '#1d4ed8' }}>{r.action === 'create' ? 'New' : 'Update'}</span></td>
                          <td style={tdStyle}>{r.full_name}</td>
                          <td style={tdStyle}>{r.email}</td>
                          <td style={tdStyle}>{r.student_id_number}</td>
                          <td style={tdStyle}>{r.visa_type}</td>
                          <td style={tdStyle}>{r.degree_level}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {confirmError && (
              <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '13px', display: 'flex', gap: '8px' }}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="7" cy="7" r="5.5"/><path d="M5 5l4 4M9 5l-4 4"/></svg>
                {confirmError}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={handleConfirm} disabled={preview.validRows === 0} style={{ ...btnPrimary, background: preview.validRows === 0 ? '#93c5fd' : '#2563eb', cursor: preview.validRows === 0 ? 'not-allowed' : 'pointer' }}>
                Confirm Import
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5"/></svg>
              </button>
              <button onClick={reset} style={btnOutline}>Cancel</button>
            </div>
          </div>
        )}

        {/* Step 3: Confirming */}
        {step === 'confirming' && (
          <div style={{ ...card, padding: '60px 20px', textAlign: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" width="48" height="48" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>Processing {preview?.newStudents! + preview?.updatedStudents!} students…</div>
            <div style={{ fontSize: '13.5px', color: '#6b7280' }}>Creating accounts, updating existing records, and sending invitations. Please wait.</div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 'result' && result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ ...card, borderLeft: '4px solid #16a34a', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" width="40" height="40"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>Import Complete</div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><svg viewBox="0 0 14 14" fill="none" stroke="#16a34a" strokeWidth="1.5" width="14" height="14"><path d="M2.5 13c0-3 9-3 9 0"/><circle cx="7" cy="4" r="2.5"/><path d="M11.5 5h3M13 3.5v3"/></svg> <strong style={{ color: '#166534' }}>{result.created}</strong> added</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><svg viewBox="0 0 14 14" fill="none" stroke="#2563eb" strokeWidth="1.5" width="14" height="14"><path d="M1 4v4h4M13 10V6H9"/><path d="M3.5 9A5 5 0 0012 6M10.5 5A5 5 0 002 8"/></svg> <strong style={{ color: '#1d4ed8' }}>{result.updated}</strong> updated</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><svg viewBox="0 0 14 14" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="14" height="14"><path d="M2 3h10v8H2zM2 6h10M2 9h10M5 3v8M9 3v8"/></svg> <strong style={{ color: '#6d28d9' }}>{result.invitationsSent}</strong> invites sent</span>
                  {result.invitationErrors > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309' }}><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M7 1L1 13h12L7 1zM7 6v3M7 11h.01"/></svg> {result.invitationErrors} failed</span>}
                </div>
              </div>
            </div>
            
            <p style={{ fontSize: '13.5px', color: '#6b7280', margin: 0 }}>New students will receive an email invitation to activate their Pathly account within a few minutes.</p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => downloadErrorCsv(result.importId)} style={btnOutline}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M7 2v7M4 6l3 3 3-3M2 12h10"/></svg>
                Download Error Report
              </button>
              <button onClick={reset} style={btnPrimary}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M7 12V5M4 8l3-3 3 3M2 2h10"/></svg>
                Import Another File
              </button>
            </div>
          </div>
        )}

        {/* History */}
        <div style={{ ...card, marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ ...cardTitle, marginBottom: 0 }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="#6b7280" strokeWidth="1.6" width="18" height="18"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l2 2"/></svg>
              Import History
            </div>
            <button onClick={loadHistory} disabled={historyLoading} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex' }}>
              {historyLoading ? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16" style={{ animation: 'spin 1s linear infinite' }}><circle cx="8" cy="8" r="6" strokeOpacity="0.25"/><path d="M8 2a6 6 0 016 6"/></svg> : <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16"><path d="M2.5 5A6 6 0 112 8M2 2v3h3M10 8l-2 2-2-2"/></svg>}
            </button>
          </div>
          
          {!historyLoaded ? (
            <button onClick={loadHistory} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: 500, cursor: 'pointer', padding: 0 }}>Load import history</button>
          ) : history.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#6b7280', padding: '16px 0', textAlign: 'center' }}>No previous imports found.</div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead><tr><th style={thStyle}>Date</th><th style={thStyle}>File</th><th style={thStyle}>Status</th><th style={{ ...thStyle, textAlign: 'right' }}>New</th><th style={{ ...thStyle, textAlign: 'right' }}>Updated</th><th style={{ ...thStyle, textAlign: 'right' }}>Errors</th><th style={thStyle}>Actions</th></tr></thead>
                <tbody>
                  {history.map(h => {
                    const cfg = statusCfg(h.status);
                    return (
                      <tr key={h.id}>
                        <td style={{ ...tdStyle, color: '#6b7280' }}>{formatDate(h.created_at)}</td>
                        <td style={{ ...tdStyle, fontWeight: 500, maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.file_name}</td>
                        <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: cfg.bg, color: cfg.color }}>{cfg.label}</span></td>
                        <td style={{ ...tdStyle, color: '#166534', textAlign: 'right' }}>{h.created_student_ids?.length || 0}</td>
                        <td style={{ ...tdStyle, color: '#1d4ed8', textAlign: 'right' }}>{h.updated_student_ids?.length || 0}</td>
                        <td style={{ ...tdStyle, color: '#991b1b', textAlign: 'right' }}>{h.failed_rows}</td>
                        <td style={tdStyle}>
                          {h.failed_rows > 0 && <button onClick={() => downloadErrorCsv(h.id)} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M7 2v7M4 6l3 3 3-3M2 12h10"/></svg> Errors</button>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
