/**
 * Student Repository
 * Data access layer for students table
 */

import { getSupabaseAdmin } from '../config/database.ts';
import type { Student, CreateStudentData, UpdateStudentData } from '../types/database.types.ts';

class StudentRepository {
  private supabase = getSupabaseAdmin();

  /**
   * Find student by ID
   */
  async findById(id: string): Promise<Student | null> {
    const { data, error } = await this.supabase
      .from('students')
      .select('*, user:users!user_id(*), school:schools(*)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch student: ${error.message}`);
    }

    return data;
  }

  /**
   * Find student by user ID
   */
  async findByUserId(userId: string): Promise<Student | null> {
    const { data, error } = await this.supabase
      .from('students')
      .select('*, user:users!user_id(*), school:schools(*)')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch student by user ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Find students by school
   */
  async findBySchool(schoolId: string): Promise<Student[]> {
    const { data, error } = await this.supabase
      .from('students')
      .select('*, user:users!user_id(*)')
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch students by school: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create new student profile
   */
  async create(data: CreateStudentData): Promise<Student> {
    const studentData = {
      ...data,
      visa_status: data.visa_status || 'pending',
      compliance_status: data.compliance_status || 'N/A'
    };

    const { data: student, error } = await this.supabase
      .from('students')
      .insert(studentData)
      .select('*, user:users!user_id(*)')
      .single();

    if (error) {
      throw new Error(`Failed to create student: ${error.message}`);
    }

    return student;
  }

  /**
   * Update student profile
   */
  async update(id: string, data: UpdateStudentData): Promise<Student> {
    const { data: student, error } = await this.supabase
      .from('students')
      .update(data)
      .eq('id', id)
      .select('*, user:users!user_id(*)')
      .single();

    if (error) {
      throw new Error(`Failed to update student: ${error.message}`);
    }

    return student;
  }

  /**
   * Soft delete student
   */
  async softDelete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('students')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete student: ${error.message}`);
    }
  }

  /**
   * Find students by visa status
   */
  async findByVisaStatus(schoolId: string, status: string): Promise<Student[]> {
    const { data, error } = await this.supabase
      .from('students')
      .select('*, user:users!user_id(*)')
      .eq('school_id', schoolId)
      .eq('visa_status', status)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch students by visa status: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find students by SEVIS status
   */
  async findBySEVISStatus(schoolId: string, status: string): Promise<Student[]> {
    const { data, error } = await this.supabase
      .from('students')
      .select('*, user:users!user_id(*)')
      .eq('school_id', schoolId)
      .eq('sevis_status', status)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch students by SEVIS status: ${error.message}`);
    }

    return data || [];
  }
}

export const studentRepository = new StudentRepository();
