export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  lastModifiedAt?: Date;
  deletionAt?: Date;
  deleted?: boolean;
}
