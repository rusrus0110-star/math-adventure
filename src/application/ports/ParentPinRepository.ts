import type { ParentPinRecord } from '@/domain/parents/parentPin';

export interface ParentPinRepository {
  read(): Promise<ParentPinRecord | undefined>;
  save(record: ParentPinRecord, expectedHash: string | null): Promise<void>;
}
