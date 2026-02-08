// Workflow automation types

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';
export type WorkflowObjectType = 'contact' | 'company' | 'deal';

export type WorkflowActionType =
  | 'send_email'
  | 'send_notification'
  | 'create_task'
  | 'update_property'
  | 'delay'
  | 'if_then'
  | 'webhook';

export type TriggerType =
  | 'property_change'
  | 'record_created'
  | 'form_submission'
  | 'schedule'
  | 'manual';

export interface WorkflowStep {
  id: string;
  type: WorkflowActionType;
  name: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  next?: string[];
  nextTrue?: string[];
  nextFalse?: string[];
}

export interface TriggerConfig {
  type: TriggerType;
  objectType?: WorkflowObjectType;
  property?: string;
  operator?: string;
  value?: string | number | boolean;
  reEnrollment?: boolean;
  formId?: string;
  cron?: string;
  timezone?: string;
}

export interface WorkflowSettings {
  enrollmentType: 'once' | 'multiple';
  suppressionLists: string[];
  goalCriteria?: Record<string, unknown>;
  notifications: {
    onError: boolean;
    onComplete: boolean;
  };
}

export type ExecutionStatus = 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled';
export type StepLogStatus = 'started' | 'completed' | 'failed' | 'skipped';
