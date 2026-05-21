
import { ExecutionRequest, ExecutionResponse, AdapterConfig } from '../types/index.js';

export abstract class EnvironmentAdapter {
  public readonly id: string;
  public readonly type: string;
  protected config: AdapterConfig;

  constructor(config: AdapterConfig) {
    this.id = config.id;
    this.type = config.type;
    this.config = config;
  }

  abstract execute(request: ExecutionRequest): Promise<any>;

  protected validatePermissions(action: string): void {
    if (!this.config.permissions.includes(action) && !this.config.permissions.includes('*')) {
      throw new Error(`Permission denied: Action '${action}' is not allowed for adapter '${this.id}'`);
    }
  }

  protected async wrapExecution(
    action: string,
    executor: () => Promise<any>
  ): Promise<any> {
    this.validatePermissions(action);
    const start = Date.now();
    try {
      const result = await executor();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Execution failed in ${this.id}:${action} - ${message}`);
    }
  }
}
