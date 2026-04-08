/**
 * Request Repository
 * Data access layer for requests table
 */

import { getSupabaseAdmin } from '../config/database.ts';
import type { Request, CreateRequestData, UpdateRequestData } from '../types/database.types.ts';

class RequestRepository {
  private supabase = getSupabaseAdmin();

  /**
   * Find request by ID
   */
  async findById(id: string): Promise<Request | null> {
    const { data, error } = await this.supabase
      .from('requests')
      .select(`
        *,
        student:students(*, user:users!user_id(*)),
        school:schools(*),
        assigned_user:users!assigned_to(*),
        processed_user:users!processed_by(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch request: ${error.message}`);
    }

    return data;
  }

  /**
   * Find requests by student
   */
  async findByStudent(studentId: string): Promise<Request[]> {
    const { data, error } = await this.supabase
      .from('requests')
      .select('*')
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch student requests: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find requests by school
   */
  async findBySchool(schoolId: string, filters?: {
    status?: string;
    requestType?: string;
    priority?: string;
  }): Promise<Request[]> {
    let query = this.supabase
      .from('requests')
      .select(`
        *,
        student:students(*, user:users!user_id(*))
      `)
      .eq('school_id', schoolId)
      .is('deleted_at', null);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.requestType) {
      query = query.eq('request_type', filters.requestType);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    const { data, error } = await query.order('submitted_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch school requests: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create new request
   */
  async create(data: CreateRequestData): Promise<Request> {
    const requestData = {
      ...data,
      status: 'pending',
      submitted_at: new Date().toISOString()
    };

    const { data: request, error } = await this.supabase
      .from('requests')
      .insert(requestData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create request: ${error.message}`);
    }

    return request;
  }

  /**
   * Update request
   */
  async update(id: string, data: UpdateRequestData): Promise<Request> {
    const { data: request, error } = await this.supabase
      .from('requests')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update request: ${error.message}`);
    }

    return request;
  }

  /**
   * Soft delete request
   */
  async softDelete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('requests')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete request: ${error.message}`);
    }
  }

  /**
   * Get request statistics for school
   */
  async getSchoolStats(schoolId: string): Promise<{
    total: number;
    pending: number;
    in_review: number;
    approved: number;
    denied: number;
  }> {
    const { data, error } = await this.supabase
      .from('requests')
      .select('status')
      .eq('school_id', schoolId)
      .is('deleted_at', null);

    if (error) {
      throw new Error(`Failed to fetch request stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      pending: 0,
      in_review: 0,
      approved: 0,
      denied: 0
    };

    data.forEach(req => {
      if (req.status === 'pending') stats.pending++;
      else if (req.status === 'in_review') stats.in_review++;
      else if (req.status === 'approved') stats.approved++;
      else if (req.status === 'denied') stats.denied++;
    });

    return stats;
  }
}

export const requestRepository = new RequestRepository();
