export enum LogLevel {
  Information = 'info',
  Warning = 'warn',
  Error = 'error',
}

export interface Log {
    id: number;
    level: LogLevel;
    message: string;
    context?: string;
    data?: unknown;
    timeStamp: Date;
}