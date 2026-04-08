/**
 * Authentication Service
 * Business logic for user authentication and registration
 */

import { getSupabaseAdmin } from '../../config/database.ts';
import { userRepository } from '../../repositories/user.repository.ts';
import { studentRepository } from '../../repositories/student.repository.ts';
import type { CreateUserData, CreateStudentData } from '../../types/database.types.ts';

export class AuthService {
  private supabase = getSupabaseAdmin();

  /**
   * Register a new student account
   */
  async signupStudent(data: {
    email: string;
    password: string;
    name: string;
    studentIdNumber: string;
    schoolId: string;
  }) {
    // Validate university email
    if (!data.email.includes('.edu')) {
      throw new Error('Please use your university email address');
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      user_metadata: {
        name: data.name,
        userType: 'student',
        schoolId: data.schoolId
      },
      email_confirm: true // Auto-confirm since email server not configured
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    // Create user profile
    const userData: CreateUserData = {
      id: authData.user.id,
      school_id: data.schoolId,
      email: data.email,
      full_name: data.name,
      role: 'student',
      status: 'active'
    };

    await userRepository.create(userData);

    // Create student profile
    const studentData: CreateStudentData = {
      user_id: authData.user.id,
      school_id: data.schoolId,
      student_id_number: data.studentIdNumber,
      visa_status: 'pending',
      compliance_status: 'N/A'
    };

    await studentRepository.create(studentData);

    return {
      success: true,
      userId: authData.user.id,
      message: 'Student account created successfully'
    };
  }

  /**
   * Register a new DSO account
   */
  async signupDSO(data: {
    email: string;
    password: string;
    name: string;
    schoolId: string;
  }) {
    // Create Supabase Auth user
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      user_metadata: {
        name: data.name,
        userType: 'dso',
        schoolId: data.schoolId
      },
      email_confirm: true
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    // Create user profile
    const userData: CreateUserData = {
      id: authData.user.id,
      school_id: data.schoolId,
      email: data.email,
      full_name: data.name,
      role: 'dso',
      status: 'active'
    };

    await userRepository.create(userData);

    return {
      success: true,
      userId: authData.user.id,
      message: 'DSO account created successfully'
    };
  }

  /**
   * Verify authentication token
   */
  async verifyToken(token: string) {
    const { data: { user }, error } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('Invalid or expired token');
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    return user;
  }
}

export const authService = new AuthService();
