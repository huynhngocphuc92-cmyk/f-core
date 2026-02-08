export const WORKFLOW_STATUSES = ['draft', 'active', 'paused', 'archived'] as const;

export const WORKFLOW_OBJECT_TYPES = ['contact', 'company', 'deal'] as const;

export const WORKFLOW_ACTION_TYPES = {
  send_email: { label: 'Send email', icon: 'Mail', color: 'cyan' },
  send_notification: { label: 'Send notification', icon: 'Bell', color: 'blue' },
  create_task: { label: 'Create task', icon: 'CheckSquare', color: 'green' },
  update_property: { label: 'Set property value', icon: 'Edit3', color: 'orange' },
  delay: { label: 'Delay', icon: 'Clock', color: 'purple' },
  if_then: { label: 'If/then branch', icon: 'GitBranch', color: 'yellow' },
  webhook: { label: 'Webhook', icon: 'Webhook', color: 'gray' },
} as const;

export const TRIGGER_TYPES = {
  property_change: { label: 'Property value change', icon: 'RefreshCw' },
  record_created: { label: 'Record created', icon: 'Plus' },
  form_submission: { label: 'Form submission', icon: 'FileText' },
  schedule: { label: 'Schedule', icon: 'Calendar' },
  manual: { label: 'Manual enrollment', icon: 'UserPlus' },
} as const;

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  active: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  paused: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  archived: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' },
};
