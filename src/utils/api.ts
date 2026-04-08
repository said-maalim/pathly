import { projectId, publicAnonKey } from './supabase/info';
import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-268175b3`;

// Create Supabase client for authentication
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// Helper function to get auth headers
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': session ? `Bearer ${session.access_token}` : `Bearer ${publicAnonKey}`,
  };
}

// ==================== AUTHENTICATION ====================

export async function signUp(email: string, password: string, name: string, userType: 'regular' | 'student' | 'dso' = 'regular') {
  const endpoint = userType === 'student'
    ? '/auth/signup/student'
    : userType === 'dso'
      ? '/auth/signup/dso'
      : '/auth/signup';

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}` // Add auth header with anon key
    },
    body: JSON.stringify({ email, password, name, userType }),
  });

  return response.json();
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { data, session: data.session };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

// ==================== USER PROFILE ====================

export async function getUserProfile() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/user/profile`, {
    method: 'GET',
    headers,
  });

  return response.json();
}

export async function updateUserProfile(updates: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/user/profile`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates),
  });

  return response.json();
}

// ==================== VISA PROFILE ====================

export async function getVisaProfile() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/visa/profile`, {
    method: 'GET',
    headers,
  });

  return response.json();
}

export async function updateVisaProfile(updates: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/visa/profile`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates),
  });

  return response.json();
}

// ==================== DOCUMENTS ====================

export async function uploadDocument(file: File, documentType: string) {
  const { data: { session } } = await supabase.auth.getSession();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);

  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token || publicAnonKey}`,
    },
    body: formData,
  });

  return response.json();
}

export async function getDocuments() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/documents`, {
    method: 'GET',
    headers,
  });

  return response.json();
}

export async function getDocumentDownloadUrl(documentId: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`, {
    method: 'GET',
    headers,
  });

  return response.json();
}

// ==================== STUDENT REQUESTS ====================

export async function submitRequest(requestType: 'i20' | 'opt', reason: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/requests/submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ requestType, reason }),
  });

  return response.json();
}

export async function getUniversityRequests(universityId: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/requests/university/${universityId}`, {
    method: 'GET',
    headers,
  });

  return response.json();
}

export async function updateRequestStatus(requestId: string, status: string, notes?: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/requests/${requestId}/status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status, notes }),
  });

  return response.json();
}

// ==================== DOCUMENT REQUESTS ====================

export async function createDocumentRequest(studentId: string, documentType: string, dueDate: string, notes?: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/dso/document-request`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ studentId, documentType, dueDate, notes }),
  });

  return response.json();
}

export async function getDocumentRequests() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/document-requests`, {
    method: 'GET',
    headers,
  });

  return response.json();
}

// ==================== SEVIS STATUS ====================

export async function updateSevisStatus(
  studentId: string,
  sevisStatus: string,
  compliance: string,
  nextCheckDate: string,
  notes?: string
) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/students/${studentId}/sevis`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ sevisStatus, compliance, nextCheckDate, notes }),
  });

  return response.json();
}

// ==================== BULK EMAIL ====================

export async function sendBulkEmail(recipientGroup: string, subject: string, message: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/dso/bulk-email`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ recipientGroup, subject, message }),
  });

  return response.json();
}