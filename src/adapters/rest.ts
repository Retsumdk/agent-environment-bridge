
import { EnvironmentAdapter } from './base.js';
import { ExecutionRequest, AdapterConfig } from '../types/index.js';

export interface RestAdapterOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class RestAdapter extends EnvironmentAdapter {
  private options: RestAdapterOptions;

  constructor(config: AdapterConfig) {
    super(config);
    this.options = config.options as RestAdapterOptions;
  }

  async execute(request: ExecutionRequest): Promise<any> {
    return this.wrapExecution(request.action, async () => {
      const { action, params } = request;
      const url = new URL(action, this.options.baseUrl);
      
      // Merge query params if GET
      if (params && Object.keys(params).length > 0) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, String(value));
        });
      }

      const response = await fetch(url.toString(), {
        method: 'GET', // Defaulting to GET for now, could be expanded
        headers: {
          'Accept': 'application/json',
          ...this.options.headers,
        },
        signal: AbortSignal.timeout(this.options.timeout || 30000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    });
  }
}
