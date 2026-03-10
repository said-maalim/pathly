/**
 * School Repository
 * Data access layer for schools table
 */

import { getSupabaseAdmin } from '../config/database.ts';
import type { School } from '../types/database.types.ts';

class SchoolRepository {
  private supabase = getSupabaseAdmin();
  
  /**
   * Find school by ID
   */
  async findById(id: string): Promise<School | null> {
    const { data, error } = await this.supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch school: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Find school by code
   */
  async findByCode(code: string): Promise<School | null> {
    const { data, error } = await this.supabase
      .from('schools')
      .select('*')
      .eq('code', code)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch school by code: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Get all schools
   */
  async findAll(): Promise<School[]> {
    const { data, error } = await this.supabase
      .from('schools')
      .select('*')
      .is('deleted_at', null)
      .eq('subscription_status', 'active')
      .order('name');
    
    if (error) {
      throw new Error(`Failed to fetch schools: ${error.message}`);
    }
    
    return data || [];
  }
  
  /**
   * Create new school
   */
  async create(data: {
    name: string;
    code: string;
    sevis_school_code?: string;
    contact_email?: string;
  }): Promise<School> {
    const { data: school, error } = await this.supabase
      .from('schools')
      .insert({
        ...data,
        subscription_status: 'active',
        subscription_plan: 'standard',
        student_limit: 2000
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create school: ${error.message}`);
    }
    
    return school;
  }
  
  /**
   * Update school
   */
  async update(id: string, data: Partial<School>): Promise<School> {
    const { data: school, error } = await this.supabase
      .from('schools')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update school: ${error.message}`);
    }
    
    return school;
  }
}

export const schoolRepository = new SchoolRepository();
