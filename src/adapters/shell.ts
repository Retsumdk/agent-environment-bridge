
import { EnvironmentAdapter } from './base.js';
import { ExecutionRequest, AdapterConfig } from '../types/index.js';
import { spawn } from 'node:child_process';

export interface ShellAdapterOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

export class ShellAdapter extends EnvironmentAdapter {
  private options: ShellAdapterOptions;

  constructor(config: AdapterConfig) {
    super(config);
    this.options = config.options as ShellAdapterOptions;
  }

  async execute(request: ExecutionRequest): Promise<any> {
    return this.wrapExecution(request.action, async () => {
      const { action, params } = request;
      const args = params.args || [];
      
      return new Promise((resolve, reject) => {
        const proc = spawn(action, args, {
          cwd: this.options.cwd || process.cwd(),
          env: { ...process.env, ...this.options.env },
          shell: false, // Security: avoid shell interpolation
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => stdout += data);
        proc.stderr.on('data', (data) => stderr += data);

        const timeout = setTimeout(() => {
          proc.kill();
          reject(new Error(`Process timed out after ${this.options.timeout || 10000}ms`));
        }, this.options.timeout || 10000);

        proc.on('close', (code) => {
          clearTimeout(timeout);
          if (code === 0) {
            resolve({ stdout, stderr, code });
          } else {
            reject(new Error(`Process exited with code ${code}. Stderr: ${stderr}`));
          }
        });

        proc.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    });
  }
}
