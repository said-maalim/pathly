import { projectId, publicAnonKey } from './supabase/info';
import { getAccessToken, signIn as supabaseSignIn, signOut as supabaseSignOut } from './supabase/client';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-268175b3`;

// Helper function to make API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const accessToken = await getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': accessToken ? `Bearer ${accessToken}` : `Bearer ${publicAnonKey}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API call failed: ${response.statusText}`);
  }

  return response.json();
}

// ============== AUTH API ==============

export async function signIn(email: string, password: string) {
  return supabaseSignIn(email, password);
}

export async function signOut() {
  return supabaseSignOut();
}

export async function signUp(email: string, password: string, name: string, userType: string = 'regular', universityEmail?: string) {
  return apiCall('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, userType, universityEmail }),
  });
}

export async function signUpDSO(email: string, password: string, name: string, universityName: string, universityId: string) {
  return apiCall('/auth/signup-dso', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, universityName, universityId }),
  });
}

// ============== USER PROFILE API ==============

export async function getUserProfile() {
  return apiCall('/user/profile');
}

export async function updateUserProfile(updates: any) {
  return apiCall('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// ============== VISA PROFILE API ==============

export async function saveVisaProfile(visaData: any) {
  return apiCall('/visa/profile', {
    method: 'POST',
    body: JSON.stringify(visaData),
  });
}

export async function getVisaProfile() {
  return apiCall('/visa/profile');
}

// ============== DOCUMENTS API ==============

export async function saveDocumentMetadata(fileName: string, fileType: string, fileUrl: string, documentType: string) {
  return apiCall('/documents', {
    method: 'POST',
    body: JSON.stringify({ fileName, fileType, fileUrl, documentType }),
  });
}

export async function getDocuments() {
  return apiCall('/documents');
}

// ============== STUDENT REQUESTS API ==============

export async function submitRequest(requestType: 'i20' | 'opt', reason: string, details?: any) {
  return apiCall('/requests/submit', {
    method: 'POST',
    body: JSON.stringify({ requestType, reason, details }),
  });
}

export async function getMyRequests() {
  return apiCall('/requests/my-requests');
}

// ============== DSO API ==============

export async function getDSOStudents() {
  return apiCall('/dso/students');
}

export async function getDSOPendingRequests() {
  return apiCall('/dso/pending-requests');
}

export async function updateSEVISStatus(studentId: string, sevisStatus: string, compliance: string, nextCheckDate?: string, notes?: string) {
  return apiCall('/dso/update-sevis', {
    method: 'POST',
    body: JSON.stringify({ studentId, sevisStatus, compliance, nextCheckDate, notes }),
  });
}

export async function requestDocument(studentId: string, documentType: string, dueDate: string, notes?: string) {
  return apiCall('/dso/request-document', {
    method: 'POST',
    body: JSON.stringify({ studentId, documentType, dueDate, notes }),
  });
}

export async function getDocumentRequests() {
  return apiCall('/student/document-requests');
}

export async function getSEVISStatus() {
  return apiCall('/student/sevis-status');
}

// ============== HEALTH CHECK ==============

export async function healthCheck() {
  return apiCall('/health');
}