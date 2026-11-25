import { useId } from 'react';

export type Role = 'student' | 'dso';

interface RoleSwitchProps {
  value: Role;
  onChange: (role: Role) => void;
}

export function RoleSwitch({ value, onChange }: RoleSwitchProps) {
  const labelId = useId();

  return (
    <div className="ap-field">
      <span className="ap-lbl" id={labelId}>I'm signing in as</span>
      <div className="ap-seg" role="radiogroup" aria-labelledby={labelId}>
        <button
          type="button"
          role="radio"
          aria-checked={value === 'student'}
          onClick={() => onChange('student')}
        >
          Student
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === 'dso'}
          onClick={() => onChange('dso')}
        >
          DSO or staff
        </button>
      </div>
    </div>
  );
}
