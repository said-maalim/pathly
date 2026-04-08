/**
 * Roster Import Service
 *
 * Business logic for the student roster import pipeline:
 *   1. uploadAndPreview  — upload file, parse, validate, detect duplicates
 *   2. confirmImport     — execute atomic DB commit, send invitations
 *   3. getHistory        — list past imports for a school
 *   4. getDetail         — get single import + verify tenant ownership
 *   5. buildErrorCsv     — format error rows as downloadable CSV
 *
 * Parsing strategy:
 *   - .csv  → native TextDecoder + simple CSV tokenizer (no heavy dep needed)
 *   - .xlsx → npm:xlsx (SheetJS)
 *
 * Atomicity strategy:
 *   - All DB inserts/updates run inside the roster_import_commit PostgreSQL
 *     stored procedure via supabase.rpc(). On any error the DB rolls back.
 *   - Auth user creation (inviteUserByEmail) runs BEFORE the RPC so that
 *     auth_user_ids are available when the RPC inserts into users.
 *   - If auth user creation succeeds but the RPC fails we soft-compensate by
 *     logging the failure; the orphaned auth user remains inactive and the DSO
 *     can re-run the import to clean it up (idempotent).
 */

import { getSupabaseAdmin } from '../../config/database.ts';
import { rosterImportRepository } from '../../repositories/roster-import.repository.ts';
import type { RosterImport } from '../../types/database.types.ts';
import {
  COLUMN_ALIASES,
  SEVIS_STATUS_NORMALIZER,
  VALID_VISA_TYPES,
  VALID_SEVIS_STATUSES,
} from './roster.types.ts';
import type {
  ParsedRow,
  ValidatedRow,
  RosterError,
  DuplicateIndex,
  UploadPreviewResponse,
  ConfirmImportResponse,
} from './roster.types.ts';

// ─── Date pattern ─────────────────────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ─── CSV tokenizer (handles quoted fields and commas inside quotes) ─────────

function parseCsvText(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const result: string[][] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let inQuote = false;
    let cell = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cell += '"'; i++; } // escaped quote
        else { inQuote = !inQuote; }
      } else if (ch === ',' && !inQuote) {
        row.push(cell.trim()); cell = '';
      } else {
        cell += ch;
      }
    }
    row.push(cell.trim());
    result.push(row);
  }
  return result;
}

// ─── Column mapping ───────────────────────────────────────────────────────────

/**
 * Normalize a header string and resolve it via the alias map.
 * Returns the canonical field name or the original (normalized) string if unknown.
 */
function mapHeader(raw: string): string {
  const normalized = raw.toLowerCase().replace(/[_-]/g, ' ').trim();
  return COLUMN_ALIASES[normalized] ?? COLUMN_ALIASES[raw.toLowerCase().trim()] ?? normalized;
}

// ─── Per-row validation ───────────────────────────────────────────────────────

const REQUIRED_FIELDS: Array<keyof ValidatedRow> = [
  'email',
  'full_name',       // derived from first_name + last_name or a combined column
  'student_id_number',
  'visa_type',
  'sevis_status',
  'degree_level',
  'major',
  'sevis_start_date',
  'expected_graduation_date',
];

function validateRow(
  raw: Record<string, string>,
  rowNumber: number,
): { row: ValidatedRow | null; errors: RosterError[] } {
  const errors: RosterError[] = [];

  // ── Required field checks ─────────────────────────────────────────────────

  const studentId = raw['student_id_number']?.trim() ?? '';
  if (!studentId) {
    errors.push({ row: rowNumber, field: 'student_id_number', code: 'MISSING_REQUIRED', message: 'Student ID is required' });
  }

  // Email
  const email = raw['email']?.trim().toLowerCase() ?? '';
  if (!email) {
    errors.push({ row: rowNumber, field: 'email', code: 'MISSING_REQUIRED', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ row: rowNumber, field: 'email', code: 'INVALID_EMAIL', message: 'Email must be a valid address', value: email });
  }

  // Full name — accept either first+last or a combined "full_name" column
  const firstName = raw['first_name']?.trim() ?? '';
  const lastName = raw['last_name']?.trim() ?? '';
  const combinedName = raw['full_name']?.trim() ?? '';
  const fullName = combinedName || `${firstName} ${lastName}`.trim();
  if (!fullName) {
    errors.push({ row: rowNumber, field: 'full_name', code: 'MISSING_REQUIRED', message: 'First name and last name (or full name) are required' });
  }

  // Visa type
  const rawVisa = raw['visa_type']?.trim() ?? '';
  const visaType = VALID_VISA_TYPES.find(vt => vt.toLowerCase() === rawVisa.toLowerCase());
  if (!rawVisa) {
    errors.push({ row: rowNumber, field: 'visa_type', code: 'MISSING_REQUIRED', message: 'Visa type is required' });
  } else if (!visaType) {
    errors.push({ row: rowNumber, field: 'visa_type', code: 'INVALID_ENUM', message: `Visa type must be one of: ${VALID_VISA_TYPES.join(', ')}`, value: rawVisa });
  }

  // SEVIS status
  const rawSevis = raw['sevis_status']?.trim() ?? '';
  const sevisStatus = SEVIS_STATUS_NORMALIZER[rawSevis];
  if (!rawSevis) {
    errors.push({ row: rowNumber, field: 'sevis_status', code: 'MISSING_REQUIRED', message: 'SEVIS status is required' });
  } else if (!sevisStatus) {
    errors.push({ row: rowNumber, field: 'sevis_status', code: 'INVALID_ENUM', message: `SEVIS status must be one of: ${VALID_SEVIS_STATUSES.join(', ')}`, value: rawSevis });
  }

  // Degree level
  const degreeLevel = raw['degree_level']?.trim() ?? '';
  if (!degreeLevel) {
    errors.push({ row: rowNumber, field: 'degree_level', code: 'MISSING_REQUIRED', message: 'Degree level is required' });
  }

  // Major
  const major = raw['major']?.trim() ?? '';
  if (!major) {
    errors.push({ row: rowNumber, field: 'major', code: 'MISSING_REQUIRED', message: 'Major is required' });
  }

  // Start date
  const startDate = raw['sevis_start_date']?.trim() ?? '';
  if (!startDate) {
    errors.push({ row: rowNumber, field: 'sevis_start_date', code: 'MISSING_REQUIRED', message: 'Program start date is required' });
  } else if (!ISO_DATE_RE.test(startDate)) {
    errors.push({ row: rowNumber, field: 'sevis_start_date', code: 'INVALID_DATE', message: 'Program start date must be YYYY-MM-DD', value: startDate });
  }

  // Graduation date
  const gradDate = raw['expected_graduation_date']?.trim() ?? '';
  if (!gradDate) {
    errors.push({ row: rowNumber, field: 'expected_graduation_date', code: 'MISSING_REQUIRED', message: 'Expected graduation date is required' });
  } else if (!ISO_DATE_RE.test(gradDate)) {
    errors.push({ row: rowNumber, field: 'expected_graduation_date', code: 'INVALID_DATE', message: 'Graduation date must be YYYY-MM-DD', value: gradDate });
  }

  // Optional: I-20 expiration
  const i20Exp = raw['i20_expiration_date']?.trim() ?? '';
  if (i20Exp && !ISO_DATE_RE.test(i20Exp)) {
    errors.push({ row: rowNumber, field: 'i20_expiration_date', code: 'INVALID_DATE', message: 'I-20 expiration date must be YYYY-MM-DD', value: i20Exp });
  }

  if (errors.length > 0) {
    return { row: null, errors };
  }

  return {
    errors: [],
    row: {
      action: 'create',       // overwritten by duplicate detection
      rowNumber,
      email,
      full_name: fullName,
      preferred_name: raw['preferred_name']?.trim() || undefined,
      student_id_number: studentId,
      sevis_id: raw['sevis_id']?.trim() || undefined,
      degree_level: degreeLevel,
      major,
      program_of_study: raw['program_of_study']?.trim() || undefined,
      visa_type: visaType!,
      sevis_status: sevisStatus!,
      sevis_start_date: startDate,
      expected_graduation_date: gradDate,
      i20_expiration_date: i20Exp || undefined,
    },
  };
}

// ─── Duplicate detection ──────────────────────────────────────────────────────

async function buildDuplicateIndex(schoolId: string): Promise<DuplicateIndex> {
  const supabase = getSupabaseAdmin();

  const { data: students, error } = await supabase
    .from('students')
    .select('id, user_id, student_id_number, sevis_id, user:users!user_id(email)')
    .eq('school_id', schoolId)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to build duplicate index: ${error.message}`);
  }

  const byEmail = new Map<string, { userId: string; studentId: string }>();
  const byStudentIdNumber = new Map<string, { userId: string; studentId: string }>();
  const bySevisId = new Map<string, { userId: string; studentId: string }>();

  for (const s of (students ?? [])) {
    const entry = { userId: s.user_id, studentId: s.id };
    const email = (s.user as { email?: string } | null)?.email?.toLowerCase();
    if (email) byEmail.set(email, entry);
    if (s.student_id_number) byStudentIdNumber.set(s.student_id_number, entry);
    if (s.sevis_id) bySevisId.set(s.sevis_id, entry);
  }

  return { byEmail, byStudentIdNumber, bySevisId };
}

// ─── Service Class ────────────────────────────────────────────────────────────

export class RosterService {
  /**
   * Upload a CSV/XLSX file, parse and validate it, and return a preview.
   * DOES NOT write any student/user records — that happens in confirmImport().
   */
  async uploadAndPreview(
    file: File,
    schoolId: string,
    dsoUserId: string,
  ): Promise<UploadPreviewResponse> {
    const supabase = getSupabaseAdmin();

    // 1. Guard against concurrent imports
    const inProgress = await rosterImportRepository.findProcessingBySchool(schoolId);
    if (inProgress) {
      throw new Error(`IMPORT_IN_PROGRESS: An import is already being processed for your school (ID: ${inProgress.id}). Please wait for it to complete.`);
    }

    // 2. Store raw file to Supabase Storage
    const importId = crypto.randomUUID();
    const storagePath = `${schoolId}/${importId}/${file.name}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('roster-imports')
      .upload(storagePath, fileBuffer, {
        contentType: file.type || 'text/csv',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to store roster file: ${uploadError.message}`);
    }

    // 3. Create roster_imports record (status: 'processing')
    const importRecord = await rosterImportRepository.create({
      school_id: schoolId,
      file_name: file.name,
      file_size_bytes: file.size,
      storage_path: storagePath,
      status: 'processing',
      total_rows: 0,
      created_by: dsoUserId,
    });

    try {
      // 4. Parse the file
      let rawRows: ParsedRow[] = [];
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // XLSX parsing via SheetJS
        const xlsx = await import('npm:xlsx');
        const workbook = xlsx.read(new Uint8Array(fileBuffer), { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonRows: string[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (jsonRows.length < 2) {
          throw new Error('FILE_EMPTY: The uploaded file contains no data rows.');
        }

        const headers = (jsonRows[0] as string[]).map(mapHeader);
        for (let i = 1; i < jsonRows.length; i++) {
          const cells = jsonRows[i] as string[];
          if (cells.every((c) => !String(c).trim())) continue; // skip blank rows
          const row: ParsedRow = {};
          headers.forEach((h, idx) => { row[h] = String(cells[idx] ?? '').trim(); });
          rawRows.push(row);
        }
      } else {
        // CSV parsing
        const text = new TextDecoder().decode(fileBuffer);
        const matrix = parseCsvText(text);
        if (matrix.length < 2) {
          throw new Error('FILE_EMPTY: The uploaded CSV contains no data rows.');
        }

        const headers = matrix[0].map(mapHeader);
        for (let i = 1; i < matrix.length; i++) {
          const row: ParsedRow = {};
          headers.forEach((h, idx) => { row[h] = matrix[i][idx] ?? ''; });
          rawRows.push(row);
        }
      }

      // 5. Validate each row
      const validRows: ValidatedRow[] = [];
      const allErrors: RosterError[] = [];

      for (let i = 0; i < rawRows.length; i++) {
        const { row, errors } = validateRow(rawRows[i], i + 2); // +2: header is row 1
        if (row) {
          validRows.push(row);
        } else {
          allErrors.push(...errors);
        }
      }

      // 6. Detect duplicates
      const dupIndex = await buildDuplicateIndex(schoolId);
      let newCount = 0;
      let updateCount = 0;

      for (const row of validRows) {
        const match =
          dupIndex.byEmail.get(row.email) ??
          dupIndex.byStudentIdNumber.get(row.student_id_number) ??
          (row.sevis_id ? dupIndex.bySevisId.get(row.sevis_id) : undefined);

        if (match) {
          row.action = 'update';
          row.existing_user_id = match.userId;
          row.existing_student_id = match.studentId;
          updateCount++;
        } else {
          row.action = 'create';
          newCount++;
        }
      }

      // Detect intra-file duplicate emails (catch duplicates within the same upload)
      const seenEmails = new Set<string>();
      for (const row of validRows) {
        if (seenEmails.has(row.email)) {
          allErrors.push({
            row: row.rowNumber,
            field: 'email',
            code: 'DUPLICATE_IN_FILE',
            message: `Email ${row.email} appears more than once in this import file`,
            value: row.email,
          });
        }
        seenEmails.add(row.email);
      }

      // 7. Store validated rows + preview in the import record
      const preview = validRows.slice(0, 20).map((r) => ({
        row: r.rowNumber,
        action: r.action,
        email: r.email,
        full_name: r.full_name,
        student_id_number: r.student_id_number,
        visa_type: r.visa_type,
        sevis_status: r.sevis_status,
        degree_level: r.degree_level,
      }));

      await rosterImportRepository.update(importRecord.id, {
        total_rows: rawRows.length,
        errors: allErrors as unknown as Record<string, any>[],
        import_settings: { validatedRowsJson: JSON.stringify(validRows) },
        preview_data: { preview } as unknown as Record<string, any>,
      });

      return {
        importId: importRecord.id,
        fileName: file.name,
        totalRows: rawRows.length,
        validRows: validRows.length,
        newStudents: newCount,
        updatedStudents: updateCount,
        errorRows: allErrors,
        preview,
      };
    } catch (err) {
      // Mark import as failed so the DSO can see what happened
      await rosterImportRepository.update(importRecord.id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        errors: [{ message: (err as Error).message }],
      });
      throw err;
    }
  }

  /**
   * Execute the atomic database commit for a previously previewed import.
   * Sends Supabase invitation emails to all newly-created student accounts.
   */
  async confirmImport(
    importId: string,
    schoolId: string,
    dsoUserId: string,
  ): Promise<ConfirmImportResponse> {
    const supabase = getSupabaseAdmin();

    // 1. Fetch and validate the import record
    const importRecord = await rosterImportRepository.findById(importId);
    if (!importRecord) {
      throw new Error(`Roster import not found: ${importId}`);
    }

    // Tenant safety: never commit a different school's import
    if (importRecord.school_id !== schoolId) {
      throw new Error('Forbidden: This import does not belong to your school');
    }

    if (importRecord.status !== 'processing') {
      throw new Error(`IMPORT_NOT_READY: Import status is '${importRecord.status}'. Only imports in 'processing' status can be confirmed.`);
    }

    // 2. Restore validated rows from import_settings
    const settingsJson = (importRecord.import_settings as { validatedRowsJson?: string } | null)?.validatedRowsJson;
    if (!settingsJson) {
      throw new Error('IMPORT_DATA_MISSING: Validated row data not found. Please re-upload the file.');
    }

    const validatedRows: ValidatedRow[] = JSON.parse(settingsJson);

    const createRows = validatedRows.filter((r) => r.action === 'create');
    const updateRows = validatedRows.filter((r) => r.action === 'update');

    // 3. Create Supabase Auth users for new students and invite them.
    //    If the email already exists in Auth (e.g. from a prior import or test account)
    //    inviteUserByEmail fails. In that case we fall back to getUserByEmail so the
    //    row is still included in the RPC commit rather than silently dropped.
    let invitationsSent = 0;
    let invitationErrors = 0;
    const authUserMap = new Map<string, string>(); // email → auth_user_id

    for (const row of createRows) {
      try {
        const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
          row.email,
          {
            data: {
              role: 'student',
              school_id: schoolId,
              full_name: row.full_name,
            },
            redirectTo: `${Deno.env.get('FRONTEND_URL') ?? 'http://localhost:3000'}/student-auth`,
          },
        );

        if (inviteError || !inviteData?.user) {
          // Invitation failed — check if it's because the user already exists
          console.warn(`[RosterService] inviteUserByEmail failed for ${row.email}: ${inviteError?.message}. Attempting lookup of existing auth user.`);
          const { data: existingUser } = await supabase.auth.admin.getUserByEmail(row.email);
          if (existingUser?.user?.id) {
            authUserMap.set(row.email, existingUser.user.id);
            // Don't count as invitation sent — user already has an account
          } else {
            console.error(`[RosterService] Could not find or create auth user for ${row.email}`);
            invitationErrors++;
          }
        } else {
          authUserMap.set(row.email, inviteData.user.id);
          invitationsSent++;
        }
      } catch (err) {
        console.error(`[RosterService] Exception inviting ${row.email}:`, err);
        invitationErrors++;
      }
    }

    // 4. Build the JSONB rows payload for the RPC
    const rpcRows = [
      ...createRows
        .filter((r) => authUserMap.has(r.email))  // only rows we have an auth ID for
        .map((r) => ({
          action: 'create',
          auth_user_id: authUserMap.get(r.email),
          email: r.email,
          full_name: r.full_name,
          preferred_name: r.preferred_name ?? null,
          student_id_number: r.student_id_number,
          sevis_id: r.sevis_id ?? null,
          degree_level: r.degree_level,
          major: r.major,
          program_of_study: r.program_of_study ?? null,
          visa_type: r.visa_type,                    // was missing — caused visa_type to be NULL
          sevis_status: r.sevis_status,
          sevis_start_date: r.sevis_start_date,
          expected_graduation_date: r.expected_graduation_date,
          i20_expiration_date: r.i20_expiration_date ?? null,
        })),
      ...updateRows.map((r) => ({
        action: 'update',
        student_id: r.existing_student_id,
        degree_level: r.degree_level,
        major: r.major,
        program_of_study: r.program_of_study ?? null,
        sevis_status: r.sevis_status,
        sevis_start_date: r.sevis_start_date,
        expected_graduation_date: r.expected_graduation_date,
        i20_expiration_date: r.i20_expiration_date ?? null,
      })),
    ];

    // 5. Execute the atomic stored procedure
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'roster_import_commit',
      {
        p_import_id: importId,
        p_school_id: schoolId,
        p_dso_user_id: dsoUserId,
        p_rows: rpcRows,
      },
    );

    if (rpcError) {
      // Mark import as failed; auth users already invited are orphaned but inactive
      await rosterImportRepository.update(importId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        errors: [{ message: `DB commit failed: ${rpcError.message}` }],
      });
      throw new Error(`COMMIT_FAILED: ${rpcError.message}`);
    }

    const result = rpcResult as { created: number; updated: number };

    return {
      importId,
      created: result.created,
      updated: result.updated,
      invitationsSent,
      invitationErrors,
    };
  }

  /**
   * Get all roster imports for a school, ordered by most recent.
   */
  async getHistory(schoolId: string): Promise<RosterImport[]> {
    return rosterImportRepository.findBySchool(schoolId);
  }

  /**
   * Get a single import record, with tenant ownership validation.
   */
  async getDetail(importId: string, schoolId: string): Promise<RosterImport> {
    const record = await rosterImportRepository.findById(importId);
    if (!record) {
      throw new Error(`Roster import not found: ${importId}`);
    }
    if (record.school_id !== schoolId) {
      throw new Error('Forbidden: This import does not belong to your school');
    }
    return record;
  }

  /**
   * Generate a CSV string from the error rows stored in an import record.
   * Returns an empty CSV header row if no errors exist.
   */
  async buildErrorCsv(importId: string, schoolId: string): Promise<string> {
    const record = await this.getDetail(importId, schoolId);
    const errors = (record.errors ?? []) as unknown as Array<{
      row: number; field: string; code: string; message: string; value?: string;
    }>;

    const header = 'Row,Field,Error Code,Message,Value\n';
    if (errors.length === 0) return header;

    const rows = errors.map((e) =>
      [e.row, e.field, e.code, `"${e.message.replace(/"/g, '""')}"`, e.value ?? ''].join(',')
    );
    return header + rows.join('\n');
  }
}

export const rosterService = new RosterService();
