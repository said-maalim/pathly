import { Link } from 'react-router-dom';
import { ROUTES, ROLE_COPY } from './constants';
import type { School } from './constants';
import type { Role } from './RoleSwitch';

interface BrandPanelProps {
  school: School | null;
  role: Role;
}

export function BrandPanel({ school, role }: BrandPanelProps) {
  return (
    <aside className="ap-side">
      <Link to={ROUTES.home} className="ap-logo">
        <i className="ap-logo-icon">🌐</i>
        Pathly
      </Link>

      <div className={`ap-pitch${school ? ' picked' : ''}`}>
        <div className="ap-mono" aria-hidden="true">
          {school?.abbr}
        </div>
        <h1>
          {school ? school.name : 'Your international office, in one place.'}
        </h1>
        <p>
          {school ? ROLE_COPY[role] : 'Choose your school to get started.'}
        </p>
      </div>

      <div className="ap-facts">
        <span><b>FERPA-compliant</b> records</span>
        <span><b>Encrypted</b> in transit and at rest</span>
      </div>
    </aside>
  );
}
