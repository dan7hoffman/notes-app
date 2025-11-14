export enum loggingLevel {
  Information = 'info',
  Warning = 'warn',
  Error = 'error',
}

export interface SystemLogging {
    id: string;
    level: loggingLevel;
    message: string;
    context?: string;
    data?: any;
    timeStamp: Date
}