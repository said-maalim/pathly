/**
 * Requests Service
 * Business logic for student requests (I-20, OPT, CPT, etc.)
 */

import { requestRepository } from '../../repositories/request.repository.ts';
import { studentRepository } from '../../repositories/student.repository.ts';
import type { CreateRequestData, UpdateRequestData } from '../../types/database.types.ts';

export class RequestsService {
  /**
   * Submit a new student request
   */
  async submitRequest(userId: string, data: {
    requestType: string;
    requestName: string;
    reason?: string;
    formData?: Record<string, any>;
    priority?: string;
  }) {
    // Get student profile
    const student = await studentRepository.findByUserId(userId);
    
    if (!student) {
      throw new Error('Student profile not found. Please ensure you signed up as a student.');
    }
    
    // Calculate due date (14 days default)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    
    const requestData: CreateRequestData = {
      student_id: student.id,
      school_id: student.school_id,
      request_type: data.requestType,
      request_name: data.requestName,
      reason: data.reason,
      form_data: data.formData,
      priority: (data.priority as any) || 'Normal',
      due_date: dueDate.toISOString()
    };
    
    return await requestRepository.create(requestData);
  }
  
  /**
   * Get all requests for a student
   */
  async getStudentRequests(userId: string) {
    const student = await studentRepository.findByUserId(userId);
    
    if (!student) {
      throw new Error('Student profile not found');
    }
    
    return await requestRepository.findByStudent(student.id);
  }
  
  /**
   * Get all requests for a school (DSO view)
   */
  async getSchoolRequests(schoolId: string, filters?: {
    status?: string;
    requestType?: string;
    priority?: string;
  }) {
    return await requestRepository.findBySchool(schoolId, filters);
  }
  
  /**
   * Get request by ID
   */
  async getRequestById(requestId: string) {
    const request = await requestRepository.findById(requestId);
    
    if (!request) {
      throw new Error('Request not found');
    }
    
    return request;
  }
  
  /**
   * Update request status (DSO only)
   */
  async updateRequestStatus(
    requestId: string,
    data: {
      status: string;
      notes?: string;
      internalNotes?: string;
    },
    processedBy: string
  ) {
    const request = await requestRepository.findById(requestId);
    
    if (!request) {
      throw new Error('Request not found');
    }
    
    const updateData: UpdateRequestData = {
      status: data.status as any,
      dso_notes: data.notes,
      internal_notes: data.internalNotes,
      processed_by: processedBy
    };
    
    if (data.status === 'completed' || data.status === 'approved' || data.status === 'denied') {
      updateData.completed_at = new Date().toISOString();
    }
    
    return await requestRepository.update(requestId, updateData);
  }
  
  /**
   * Get request statistics for school
   */
  async getSchoolStats(schoolId: string) {
    return await requestRepository.getSchoolStats(schoolId);
  }
}

export const requestsService = new RequestsService();
