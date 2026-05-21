import { 
  BridgeConfig, 
  ExecutionRequest, 
  ExecutionResponse, 
  AuditRecord 
} from '../types/index.js';
import { EnvironmentAdapter } from '../adapters/base.js';
import { RestAdapter } from '../adapters/rest.js';
import { ShellAdapter } from '../adapters/shell.js';
import { SecurityGateway } from './security.js';
import { AuditLogger } from './audit.js';

export class AgentEnvironmentBridge {
  private adapters: Map<string, EnvironmentAdapter> = new Map();
  private security: SecurityGateway;
  private audit: AuditLogger;

  constructor(config: BridgeConfig) {
    this.security = new SecurityGateway(config.security);
    this.audit = new AuditLogger(config.auditPath);
    
    this.initializeAdapters(config.adapters);
  }

  private initializeAdapters(configs: any[]) {
    for (const cfg of configs) {
      switch (cfg.type) {
        case 'rest':
          this.adapters.set(cfg.id, new RestAdapter(cfg));
          break;
        case 'shell':
          this.adapters.set(cfg.id, new ShellAdapter(cfg));
          break;
        default:
          console.warn(`Unsupported adapter type: ${cfg.type}`);
      }
    }
  }

  public async handleRequest(request: ExecutionRequest): Promise<ExecutionResponse> {
    const start = Date.now();
    let auditId = 'pending';
    let status: AuditRecord['status'] = 'success';
    let result: any;
    let error: string | undefined;

    try {
      // 1. Find Adapter
      const adapter = this.adapters.get(request.adapterId);
      if (!adapter) {
        throw new Error(`Adapter not found: ${request.adapterId}`);
      }

      // 2. Security Check
      await this.security.validateRequest(request, adapter.type);

      // 3. Execute
      result = await adapter.execute(request);

      // 4. Filter Response
      result = await this.security.filterResponse(result);

    } catch (e) {
      status = 'failure';
      error = e instanceof Error ? e.message : String(e);
      if (error.includes('Security Violation')) status = 'blocked';
    } finally {
      const duration = Date.now() - start;
      auditId = await this.audit.log({
        adapterId: request.adapterId,
        action: request.action,
        params: request.params,
        response: error ? { error } : result,
        duration,
        status,
      });

      return {
        success: status === 'success',
        data: result,
        error,
        auditId,
        duration,
      };
    }
  }
}
