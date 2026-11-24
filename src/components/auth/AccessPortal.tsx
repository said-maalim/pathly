import React, { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { signIn } from '../../services/auth.service';
import { useUser } from '../../context/UserContext';
import { ROUTES } from './constants';
import { BrandPanel } from './BrandPanel';
import { SchoolSelect } from './SchoolSelect';
import { RoleSwitch } from './RoleSwitch';
import { PasswordField } from './PasswordField';
import type { School } from './constants';
import type { Role } from './RoleSwitch';
import './portal.css';

interface FormErrors {
  school?: string;
  email?: string;
  password?: string;
  form?: string;
}

export function AccessPortal() {
  const { userData, setUserData } = useUser();
  const navigate = useNavigate();

  const [school, setSchool] = useState<School | null>(null);
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const schoolComboRef = useRef<HTMLButtonElement>(null);
  // Prevents the render-time redirect from firing mid-login when setUserData()
  // triggers a re-render before navigate() has taken the user to their portal.
  const isLoggingIn = useRef(false);

  const token =
    userData?.data?.session?.access_token ||
    (userData as { session?: { access_token?: string } })?.session?.access_token;
  if (token && !isLoggingIn.current) return <Navigate to={ROUTES.studentPortal} replace />;

  const clearErr = (field: keyof FormErrors) => {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    let firstEl: HTMLElement | null = null;

    if (!school) {
      next.school = 'Choose your school to continue.';
      firstEl = firstEl ?? schoolComboRef.current;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      next.email = 'Enter your university email address.';
      firstEl = firstEl ?? emailRef.current;
    }
    if (password.length < 6) {
      next.password = 'Enter your password (at least 6 characters).';
      firstEl = firstEl ?? passwordRef.current;
    }

    setErrors(next);
    if (firstEl) { firstEl.focus(); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(prev => ({ ...prev, form: undefined }));
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      if (result.error || !result.userData) {
        setErrors({ form: "We couldn't sign you in. Check your details and try again." });
        setLoading(false);
        return;
      }
      // Set the flag before setUserData so the render-time token check is suppressed
      // when React re-renders this component mid-login.
      isLoggingIn.current = true;
      setUserData(result.userData);
      navigate(role === 'dso' ? ROUTES.dsoPortal : ROUTES.studentPortal, { replace: true });
    } catch {
      setErrors({ form: "We couldn't sign you in. Check your details and try again." });
      setLoading(false);
    }
  };

  const submitLabel = loading
    ? 'Signing in…'
    : role === 'dso' ? 'Sign in as DSO' : 'Sign in as student';

  return (
    <div className="ap-page">
      <BrandPanel school={school} role={role} />

      <main className="ap-main">
        <div className="ap-top">
          <Link to={ROUTES.home} className="ap-back">← Back to home</Link>
          <span />
        </div>

        <form className="ap-card" noValidate onSubmit={handleSubmit}>
          <span className="ap-beta">Private beta</span>
          <h2>Sign in to Pathly</h2>
          <p className="ap-lead">Start by choosing your school. We'll take you to the right portal.</p>

          {errors.form && (
            <div role="alert" className="ap-form-err">{errors.form}</div>
          )}

          <SchoolSelect
            comboRef={schoolComboRef}
            value={school}
            onChange={s => { setSchool(s); clearErr('school'); }}
            error={errors.school}
          />

          <RoleSwitch value={role} onChange={setRole} />

          <div className="ap-field">
            <label htmlFor="ap-email">University email</label>
            <input
              ref={emailRef}
              id="ap-email"
              type="email"
              autoComplete="username"
              placeholder={role === 'dso' ? 'dso@university.edu' : 'you@university.edu'}
              value={email}
              aria-invalid={errors.email ? 'true' : undefined}
              aria-describedby={errors.email ? 'ap-email-err' : undefined}
              onChange={e => { setEmail(e.target.value); clearErr('email'); }}
              className="ap-input"
            />
            {errors.email && (
              <p id="ap-email-err" role="alert" className="ap-err">{errors.email}</p>
            )}
          </div>

          <PasswordField
            id="ap-password"
            inputRef={passwordRef}
            value={password}
            onChange={v => { setPassword(v); clearErr('password'); }}
            error={errors.password}
          />

          <div className="ap-row">
            <span />
            <Link to={ROUTES.forgotPassword}>Forgot password?</Link>
          </div>

          <button type="submit" disabled={loading} className="ap-btn ap-btn-p" id="ap-go">
            {submitLabel}
          </button>

          <div className="ap-or">or</div>

          <button type="button" disabled aria-disabled="true" className="ap-btn ap-btn-s">
            Single sign-on (coming soon)
          </button>

          <p className="ap-note">
            Don't have access yet?{' '}
            <a href="mailto:hello@pathly.app">Ask your international office</a>
          </p>
        </form>

        <div className="ap-foot">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Help</a>
        </div>
      </main>
    </div>
  );
}
