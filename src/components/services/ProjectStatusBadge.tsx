import React from 'react';
import { ProjectRequestStatus } from '../../types/services';
import {
  Clock,
  Search,
  AlertCircle,
  UserCheck,
  CheckCircle,
  PlayCircle,
  Eye,
  CheckCheck,
  XCircle,
  Ban,
} from 'lucide-react';

interface ProjectStatusBadgeProps {
  status: ProjectRequestStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const ProjectStatusBadge: React.FC<ProjectStatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'SUBMITTED':
        return {
          label: 'Submitted',
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          icon: Clock,
        };
      case 'UNDER_REVIEW':
        return {
          label: 'Under Review',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: Search,
        };
      case 'NEEDS_INFORMATION':
        return {
          label: 'Needs Info',
          bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
          icon: AlertCircle,
        };
      case 'ASSIGNED':
        return {
          label: 'Expert Assigned',
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          icon: UserCheck,
        };
      case 'ACCEPTED':
        return {
          label: 'Expert Accepted',
          bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          icon: CheckCircle,
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Progress',
          bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          icon: PlayCircle,
        };
      case 'AWAITING_CUSTOMER':
        return {
          label: 'Awaiting Your Review',
          bg: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
          icon: Eye,
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: CheckCheck,
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
          icon: Ban,
        };
      case 'REJECTED':
        return {
          label: 'Declined',
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: XCircle,
        };
      default:
        return {
          label: status,
          bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
          icon: Clock,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.bg} ${sizeClasses[size]}`}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </span>
  );
};
