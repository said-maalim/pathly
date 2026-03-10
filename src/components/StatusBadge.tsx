import { Badge } from './ui/badge';
import { Clock, Eye, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export type RequestStatus = 'submitted' | 'under-review' | 'needs-info' | 'in-progress' | 'completed' | 'rejected';

interface StatusBadgeProps {
  status: RequestStatus;
  showIcon?: boolean;
}

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const getStatusConfig = (status: RequestStatus) => {
    switch (status) {
      case 'submitted':
        return {
          label: 'Submitted',
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
          icon: Clock
        };
      case 'under-review':
        return {
          label: 'Under Review',
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
          icon: Eye
        };
      case 'needs-info':
        return {
          label: 'Needs Info',
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
          icon: AlertCircle
        };
      case 'in-progress':
        return {
          label: 'In Progress',
          className: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
          icon: Clock
        };
      case 'completed':
        return {
          label: 'Completed',
          className: 'bg-green-100 text-green-800 hover:bg-green-100',
          icon: CheckCircle2
        };
      case 'rejected':
        return {
          label: 'Rejected',
          className: 'bg-red-100 text-red-800 hover:bg-red-100',
          icon: XCircle
        };
      default:
        return {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
          icon: Clock
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}
