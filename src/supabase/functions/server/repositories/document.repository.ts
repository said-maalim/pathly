/**
 * Document Repository
 * Data access layer for documents table
 */

import { getSupabaseAdmin } from '../config/database.ts';
import type { Document, CreateDocumentData } from '../types/database.types.ts';

class DocumentRepository {
  private supabase = getSupabaseAdmin();
  
  /**
   * Find document by ID
   */
  async findById(id: string): Promise<Document | null> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*, student:students(*, user:users(*)), school:schools(*)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch document: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Find documents by student
   */
  async findByStudent(studentId: string): Promise<Document[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch student documents: ${error.message}`);
    }
    
    return data || [];
  }
  
  /**
   * Find documents by school
   */
  async findBySchool(schoolId: string): Promise<Document[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*, student:students(*, user:users(*))')
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch school documents: ${error.message}`);
    }
    
    return data || [];
  }
  
  /**
   * Create new document
   */
  async create(data: CreateDocumentData): Promise<Document> {
    const documentData = {
      ...data,
      storage_bucket: data.storage_bucket || 'documents',
      status: 'active',
      uploaded_at: new Date().toISOString()
    };
    
    const { data: document, error } = await this.supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create document: ${error.message}`);
    }
    
    return document;
  }
  
  /**
   * Update document
   */
  async update(id: string, data: Partial<Document>): Promise<Document> {
    const { data: document, error } = await this.supabase
      .from('documents')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
    
    return document;
  }
  
  /**
   * Soft delete document
   */
  async softDelete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('documents')
      .update({ 
        deleted_at: new Date().toISOString(),
        status: 'deleted'
      })
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }
  
  /**
   * Find documents by type
   */
  async findByType(studentId: string, documentType: string): Promise<Document[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('student_id', studentId)
      .eq('document_type', documentType)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch documents by type: ${error.message}`);
    }
    
    return data || [];
  }
}

export const documentRepository = new DocumentRepository();
