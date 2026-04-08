/**
 * Students Service
 * Business logic for student management
 */

import { studentRepository } from '../../repositories/student.repository.ts';
import { userRepository } from '../../repositories/user.repository.ts';
import type { UpdateStudentData } from '../../types/database.types.ts';

export class StudentsService {
  /**
   * Get all students for a school (DSO view)
   */
  async getStudentsBySchool(schoolId: string) {
    return await studentRepository.findBySchool(schoolId);
  }

  /**
   * Get single student by ID
   */
  async getStudentById(studentId: string) {
    const student = await studentRepository.findById(studentId);

    if (!student) {
      throw new Error('Student not found');
    }

    return student;
  }

  /**
   * Get student by user ID
   */
  async getStudentByUserId(userId: string) {
    const student = await studentRepository.findByUserId(userId);

    if (!student) {
      throw new Error('Student profile not found');
    }

    return student;
  }

  /**
   * Update student visa information
   */
  async updateVisaInfo(studentId: string, data: {
    visaType?: string;
    visaStatus?: string;
    visaExpirationDate?: string;
  }, updatedBy: string) {
    const student = await studentRepository.findById(studentId);

    if (!student) {
      throw new Error('Student not found');
    }

    const updateData: UpdateStudentData = {};

    if (data.visaType !== undefined) updateData.visa_type = data.visaType as any;
    if (data.visaStatus !== undefined && data.visaStatus !== null) updateData.visa_status = data.visaStatus as any;
    if (data.visaExpirationDate !== undefined && data.visaExpirationDate !== '') updateData.visa_expiration_date = data.visaExpirationDate;

    console.log('[VISA SERVICE] updateData being persisted:', JSON.stringify(updateData));

    return await studentRepository.update(studentId, updateData);
  }

  /**
   * Update student SEVIS status
   */
  async updateSEVISStatus(studentId: string, data: {
    sevisStatus: string;
    compliance: string;
    nextCheckDate?: string;
  }, updatedBy: string) {
    const student = await studentRepository.findById(studentId);

    if (!student) {
      throw new Error('Student not found');
    }

    const updateData: UpdateStudentData = {
      sevis_status: data.sevisStatus as any,
      compliance_status: data.compliance as any,
      sevis_last_updated_at: new Date().toISOString(),
      sevis_last_updated_by: updatedBy
    };

    if (data.nextCheckDate) {
      updateData.next_compliance_check_date = data.nextCheckDate;
    }

    return await studentRepository.update(studentId, updateData);
  }

  /**
   * Update student passport information
   */
  async updatePassportInfo(studentId: string, data: {
    passportExpirationDate: string;
  }, updatedBy: string) {
    const student = await studentRepository.findById(studentId);

    if (!student) {
      throw new Error('Student not found');
    }

    const updateData: UpdateStudentData = {
      passport_expiration_date: data.passportExpirationDate
    };

    return await studentRepository.update(studentId, updateData);
  }

  /**
   * Get students by visa status
   */
  async getStudentsByVisaStatus(schoolId: string, status: string) {
    return await studentRepository.findByVisaStatus(schoolId, status);
  }

  /**
   * Get students by SEVIS status
   */
  async getStudentsBySEVISStatus(schoolId: string, status: string) {
    return await studentRepository.findBySEVISStatus(schoolId, status);
  }

  /**
   * Get student profile for current user
   */
  async getMyProfile(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'student') {
      throw new Error('Only students can access this endpoint');
    }

    const student = await studentRepository.findByUserId(userId);

    if (!student) {
      throw new Error('Student profile not found');
    }

    return {
      user,
      student
    };
  }
}

export const studentsService = new StudentsService();
