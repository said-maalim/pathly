CREATE OR REPLACE FUNCTION roster_import_commit(
  p_import_id   UUID,
  p_school_id   UUID,
  p_dso_user_id UUID,
  p_rows        JSONB    -- array of {action, ...} objects
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row             JSONB;
  v_auth_user_id    UUID;
  v_user_id         UUID;
  v_student_id      UUID;
  v_created_count   INT     := 0;
  v_updated_count   INT     := 0;
  v_created_ids     UUID[]  := '{}';
  v_updated_ids     UUID[]  := '{}';
  v_old_values      JSONB;
BEGIN
  -- Verify the import record belongs to the calling school
  IF NOT EXISTS (
    SELECT 1 FROM roster_imports
    WHERE id = p_import_id AND school_id = p_school_id
  ) THEN
    RAISE EXCEPTION 'IMPORT_NOT_FOUND: Import % does not exist or does not belong to school %',
      p_import_id, p_school_id;
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    -- ── CREATE rows ────────────────────────────────────────────────────────────
    IF (v_row->>'action') = 'create' THEN
      v_auth_user_id := (v_row->>'auth_user_id')::UUID;

      -- Insert into users table (auth user already created by Edge Function)
      INSERT INTO users (
        id, school_id, email, full_name, preferred_name,
        role, status
      ) VALUES (
        v_auth_user_id,
        p_school_id,
        v_row->>'email',
        v_row->>'full_name',
        NULLIF(v_row->>'preferred_name', ''),
        'student',
        'inactive'       -- activated when student completes invitation flow
      )
      ON CONFLICT (id) DO NOTHING   -- idempotent: if user already exists skip
      RETURNING id INTO v_user_id;

      -- If ON CONFLICT fired, look up the existing user_id
      IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM users WHERE id = v_auth_user_id;
      END IF;

      -- Insert into students table
      INSERT INTO students (
        user_id, school_id,
        student_id_number, sevis_id,
        degree_level, major, program_of_study,
        visa_type,
        sevis_status, sevis_start_date,
        expected_graduation_date, i20_expiration_date,
        visa_status, compliance_status,
        created_by
      ) VALUES (
        v_user_id,
        p_school_id,
        v_row->>'student_id_number',
        NULLIF(v_row->>'sevis_id', ''),
        v_row->>'degree_level',
        v_row->>'major',
        NULLIF(v_row->>'program_of_study', ''),
        NULLIF(v_row->>'visa_type', '')::visa_type,
        (v_row->>'sevis_status')::sevis_status,
        (v_row->>'sevis_start_date')::DATE,
        (v_row->>'expected_graduation_date')::DATE,
        CASE WHEN v_row->>'i20_expiration_date' = '' OR v_row->>'i20_expiration_date' IS NULL
             THEN NULL
             ELSE (v_row->>'i20_expiration_date')::DATE
        END,
        'pending',       -- visa_status default
        'N/A',           -- compliance_status default
        p_dso_user_id
      )
      ON CONFLICT (user_id) DO NOTHING
      RETURNING id INTO v_student_id;

      IF v_student_id IS NOT NULL THEN
        v_created_ids   := array_append(v_created_ids, v_student_id);
        v_created_count := v_created_count + 1;
      END IF;

    -- ── UPDATE rows ────────────────────────────────────────────────────────────
    ELSIF (v_row->>'action') = 'update' THEN
      v_student_id := (v_row->>'student_id')::UUID;

      -- Capture old values for audit log
      SELECT to_jsonb(s.*) INTO v_old_values
      FROM students s WHERE id = v_student_id;

      UPDATE students SET
        degree_level              = COALESCE(NULLIF(v_row->>'degree_level', ''),     degree_level),
        major                     = COALESCE(NULLIF(v_row->>'major', ''),             major),
        program_of_study          = COALESCE(NULLIF(v_row->>'program_of_study', ''),  program_of_study),
        visa_type                 = COALESCE(
                                      CASE WHEN v_row->>'visa_type' != ''
                                           THEN (v_row->>'visa_type')::visa_type
                                      END,
                                      visa_type),
        sevis_status              = COALESCE(
                                      CASE WHEN v_row->>'sevis_status' != ''
                                           THEN (v_row->>'sevis_status')::sevis_status
                                      END,
                                      sevis_status),
        sevis_start_date          = COALESCE(
                                      CASE WHEN v_row->>'sevis_start_date' != ''
                                           THEN (v_row->>'sevis_start_date')::DATE
                                      END,
                                      sevis_start_date),
        expected_graduation_date  = COALESCE(
                                      CASE WHEN v_row->>'expected_graduation_date' != ''
                                           THEN (v_row->>'expected_graduation_date')::DATE
                                      END,
                                      expected_graduation_date),
        i20_expiration_date       = CASE
                                      WHEN v_row->>'i20_expiration_date' IS NOT NULL
                                           AND v_row->>'i20_expiration_date' != ''
                                      THEN (v_row->>'i20_expiration_date')::DATE
                                      ELSE i20_expiration_date
                                    END,
        sevis_last_updated_at     = NOW(),
        sevis_last_updated_by     = p_dso_user_id
      WHERE id = v_student_id
        AND school_id = p_school_id;  -- tenant safety guard even inside the RPC

      -- Audit log for update
      INSERT INTO audit_logs (
        school_id, user_id, action,
        resource_type, resource_id, description,
        old_values, new_values
      ) VALUES (
        p_school_id, p_dso_user_id, 'update',
        'student', v_student_id,
        'Updated via roster import ' || p_import_id::TEXT,
        v_old_values,
        v_row - 'action' - 'student_id'
      );

      v_updated_ids   := array_append(v_updated_ids, v_student_id);
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;

  -- Update the roster_imports record
  UPDATE roster_imports SET
    status              = 'completed',
    successful_rows     = v_created_count + v_updated_count,
    failed_rows         = 0,
    created_student_ids = v_created_ids,
    updated_student_ids = v_updated_ids,
    started_at          = COALESCE(started_at, NOW()),
    completed_at        = NOW()
  WHERE id = p_import_id;

  -- Master audit log for the import event
  INSERT INTO audit_logs (
    school_id, user_id, action,
    resource_type, resource_id, description
  ) VALUES (
    p_school_id, p_dso_user_id, 'import',
    'roster_import', p_import_id,
    'Roster import completed: ' ||
      v_created_count::TEXT || ' created, ' ||
      v_updated_count::TEXT || ' updated'
  );

  RETURN jsonb_build_object(
    'created',     v_created_count,
    'updated',     v_updated_count,
    'created_ids', v_created_ids,
    'updated_ids', v_updated_ids
  );

EXCEPTION WHEN OTHERS THEN
  -- Automatic ROLLBACK by plpgsql on exception
  UPDATE roster_imports SET
    status        = 'failed',
    completed_at  = NOW(),
    errors        = jsonb_build_array(jsonb_build_object('message', SQLERRM))
  WHERE id = p_import_id;

  RAISE;   -- re-raise so the caller (Edge Function) receives the error message
END;
$$;
--- RLS ---
-- =====================================================
-- RLS POLICIES: roster_imports
-- =====================================================
-- Safe to re-run: drops and recreates each policy.

DROP POLICY IF EXISTS "DSOs can create roster imports for their school" ON roster_imports;
DROP POLICY IF EXISTS "DSOs can view their school roster imports"       ON roster_imports;
DROP POLICY IF EXISTS "DSOs can update their school roster imports"     ON roster_imports;

-- DSOs can insert imports for their own school
CREATE POLICY "DSOs can create roster imports for their school"
  ON roster_imports FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid() AND role IN ('dso', 'admin')
    )
  );

-- DSOs can view imports for their own school
CREATE POLICY "DSOs can view their school roster imports"
  ON roster_imports FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid() AND role IN ('dso', 'admin')
    )
  );

-- DSOs can update imports for their own school (status changes)
CREATE POLICY "DSOs can update their school roster imports"
  ON roster_imports FOR UPDATE
  USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid() AND role IN ('dso', 'admin')
    )
  );

-- Students have no access to roster_imports
-- (No SELECT policy for 'student' role → RLS denies by default)
