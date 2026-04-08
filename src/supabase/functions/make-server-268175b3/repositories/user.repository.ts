/**
 * User Repository
 * Data access layer for users table
 */

import { getSupabaseAdmin } from '../config/database.ts';
import type { User, CreateUserData } from '../types/database.types.ts';

class UserRepository {
  private supabase = getSupabaseAdmin();
  
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch user by email: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Find users by school
   */
  async findBySchool(schoolId: string): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch users by school: ${error.message}`);
    }
    
    return data || [];
  }
  
  /**
   * Create new user
   */
  async create(data: CreateUserData): Promise<User> {
    const { data: user, error } = await this.supabase
      .from('users')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
    
    return user;
  }
  
  /**
   * Update user
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    const { data: user, error } = await this.supabase
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
    
    return user;
  }
  
  /**
   * Soft delete user
   */
  async softDelete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
  
  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      console.error('Failed to update last login:', error);
    }
  }
}

export const userRepository = new UserRepository();
