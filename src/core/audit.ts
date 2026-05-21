
import { AuditRecord } from '../types/index.js';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export class AuditLogger {
  private logPath: string;

  constructor(logPath: string = 'audit.log') {
    this.logPath = logPath;
  }

  public async log(record: Partial<AuditRecord>): Promise<string> {
    const id = crypto.randomUUID();
    const fullRecord: AuditRecord = {
      id,
      timestamp: new Date().toISOString(),
      adapterId: record.adapterId || 'unknown',
      action: record.action || 'unknown',
      params: record.params || {},
      response: record.response || {},
      duration: record.duration || 0,
      status: record.status || 'success',
    };

    try {
      await mkdir(dirname(this.logPath), { recursive: true }).catch(() => {});
      const entry = JSON.stringify(fullRecord) + '\n';
      await appendFile(this.logPath, entry, 'utf-8');
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }

    return id;
  }
}
