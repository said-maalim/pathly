/**
 * Users Service
 * Business logic for user profile management
 */

import { userRepository } from '../../repositories/user.repository.ts';

export class UsersService {
  /**
   * Get current user's profile
   */
  async getMyProfile(userId: string) {
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
  
  /**
   * Update current user's profile
   */
  async updateMyProfile(userId: string, data: {
    fullName?: string;
    preferredName?: string;
    phone?: string;
    avatarUrl?: string;
  }) {
    const updates: any = {};
    
    if (data.fullName) updates.full_name = data.fullName;
    if (data.preferredName) updates.preferred_name = data.preferredName;
    if (data.phone) updates.phone = data.phone;
    if (data.avatarUrl) updates.avatar_url = data.avatarUrl;
    
    return await userRepository.update(userId, updates);
  }
  
  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    const user = await userRepository.findById(id);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
}

export const usersService = new UsersService();
