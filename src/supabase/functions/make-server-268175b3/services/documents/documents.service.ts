/**
 * Documents Service
 * Business logic for document management
 */

import { documentRepository } from '../../repositories/document.repository.ts';
import { studentRepository } from '../../repositories/student.repository.ts';
import { getSupabaseAdmin } from '../../config/database.ts';
import type { CreateDocumentData } from '../../types/database.types.ts';

export class DocumentsService {
  private supabase = getSupabaseAdmin();
  
  /**
   * Upload a document (file already uploaded to storage)
   */
  async createDocument(data: {
    studentId: string;
    title: string;
    documentType: string;
    category?: string;
    fileName: string;
    fileSizeBytes?: number;
    fileType?: string;
    storagePath: string;
    notes?: string;
  }, uploadedBy: string, uploadedByRole: string) {
    const student = await studentRepository.findById(data.studentId);
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    const documentData: CreateDocumentData = {
      student_id: data.studentId,
      school_id: student.school_id,
      title: data.title,
      document_type: data.documentType,
      category: data.category,
      file_name: data.fileName,
      file_size_bytes: data.fileSizeBytes,
      file_type: data.fileType,
      storage_path: data.storagePath,
      uploaded_by: uploadedBy,
      uploaded_by_role: uploadedByRole,
      notes: data.notes
    };
    
    return await documentRepository.create(documentData);
  }
  
  /**
   * Get documents for a student
   */
  async getStudentDocuments(studentId: string) {
    return await documentRepository.findByStudent(studentId);
  }
  
  /**
   * Get documents for current user (student)
   */
  async getMyDocuments(userId: string) {
    const student = await studentRepository.findByUserId(userId);
    
    if (!student) {
      throw new Error('Student profile not found');
    }
    
    return await documentRepository.findByStudent(student.id);
  }
  
  /**
   * Get all documents for a school (DSO view)
   */
  async getSchoolDocuments(schoolId: string) {
    return await documentRepository.findBySchool(schoolId);
  }
  
  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string) {
    const document = await documentRepository.findById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    return document;
  }
  
  /**
   * Get download URL for document
   */
  async getDownloadUrl(documentId: string): Promise<string> {
    const document = await documentRepository.findById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Generate signed URL (1 hour expiry)
    const { data, error } = await this.supabase.storage
      .from(document.storage_bucket)
      .createSignedUrl(document.storage_path, 3600);
    
    if (error) {
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
    
    return data.signedUrl;
  }
  
  /**
   * Delete document
   */
  async deleteDocument(documentId: string) {
    const document = await documentRepository.findById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Soft delete in database
    await documentRepository.softDelete(documentId);
    
    // Optionally delete from storage (commented out to preserve for audit)
    // await this.supabase.storage
    //   .from(document.storage_bucket)
    //   .remove([document.storage_path]);
    
    return { success: true };
  }
}

export const documentsService = new DocumentsService();
