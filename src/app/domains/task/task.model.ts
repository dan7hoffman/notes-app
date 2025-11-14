export enum TaskStatus {
  Pending = 'pending',
  InProgress = 'in-progress',
  Completed = 'completed',
}

export enum TaskPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export enum TaskTags {
  Bug = 'bug',
  Risk = 'risk',
  Feature = 'feature',
}

export interface TaskHistory {
  modifiedAt: Date;
  changes: {
    [K in keyof Omit<Task, 'id' | 'history'>]?: {
      oldValue: Task[K] | null;
      newValue: Task[K];
    };
  };
}

export interface Task {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  lastModifiedAt?: Date;
  deletionAt?: Date;
  deleted?: boolean;
  status: TaskStatus;
  priority: TaskPriority;
  history?: TaskHistory[];
  tags?: TaskTags[];
}
