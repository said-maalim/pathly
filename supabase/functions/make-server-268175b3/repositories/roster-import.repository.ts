/**
 * Roster Import Repository
 * Data access layer for the roster_imports table.
 * Follows the same pattern as student.repository.ts and user.repository.ts.
 */

import { getSupabaseAdmin } from '../config/database.ts';
import type {
  RosterImport,
  CreateRosterImportData,
  UpdateRosterImportData,
} from '../types/database.types.ts';

class RosterImportRepository {
  private get supabase() {
    return getSupabaseAdmin();
  }

  /**
   * Create a new roster import record (status: 'pending').
   */
  async create(data: CreateRosterImportData): Promise<RosterImport> {
    const { data: record, error } = await this.supabase
      .from('roster_imports')
      .insert({
        ...data,
        status: data.status ?? 'pending',
        total_rows: data.total_rows ?? 0,
        processed_rows: 0,
        successful_rows: 0,
        failed_rows: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create roster import: ${error.message}`);
    }

    return record;
  }

  /**
   * Find a roster import by ID.
   */
  async findById(id: string): Promise<RosterImport | null> {
    const { data, error } = await this.supabase
      .from('roster_imports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      throw new Error(`Failed to fetch roster import: ${error.message}`);
    }

    return data;
  }

  /**
   * List all imports for a school, most-recent first.
   */
  async findBySchool(schoolId: string): Promise<RosterImport[]> {
    const { data, error } = await this.supabase
      .from('roster_imports')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch roster imports: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Check if there is already a 'processing' import for a school.
   * Used to prevent concurrent imports.
   */
  async findProcessingBySchool(schoolId: string): Promise<RosterImport | null> {
    const { data, error } = await this.supabase
      .from('roster_imports')
      .select('*')
      .eq('school_id', schoolId)
      .eq('status', 'processing')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to check processing imports: ${error.message}`);
    }

    return data ?? null;
  }

  /**
   * Update an existing roster import record.
   */
  async update(id: string, data: UpdateRosterImportData): Promise<RosterImport> {
    const { data: record, error } = await this.supabase
      .from('roster_imports')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update roster import: ${error.message}`);
    }

    return record;
  }
}

export const rosterImportRepository = new RosterImportRepository();
