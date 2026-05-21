import { SecurityConfig, ExecutionRequest } from '../types/index.js';

export class SecurityGateway {
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  public async validateRequest(request: ExecutionRequest, adapterType?: string): Promise<void> {
    if (this.config.enableInputValidation) {
      this.checkBlockedKeywords(JSON.stringify(request.params));
      this.checkBlockedKeywords(request.action);
    }

    if (adapterType === 'shell' && this.config.allowedCommands) {
      if (!this.config.allowedCommands.includes(request.action)) {
        throw new Error(`Security Violation: Command '${request.action}' is not in the allow-list.`);
      }
    }
  }

  public async filterResponse(data: any): Promise<any> {
    if (!this.config.enableOutputFiltering) return data;

    let serialized = JSON.stringify(data);
    
    if (this.config.maskSensitiveData) {
      serialized = this.maskSensitivePatterns(serialized);
    }

    return JSON.parse(serialized);
  }

  private checkBlockedKeywords(input: string): void {
    for (const keyword of this.config.blockedKeywords) {
      if (input.toLowerCase().includes(keyword.toLowerCase())) {
        throw new Error(`Security Violation: Input contains blocked keyword '${keyword}'`);
      }
    }
  }

  private maskSensitivePatterns(input: string): string {
    // Basic patterns for masking secrets, API keys, etc.
    const patterns = [
      { regex: /\"(password|secret|token|key)\":\s*\"[^\"]+\"/gi, replacement: '"$1": "***MASKED***"' },
      { regex: /Bearer\s+[a-zA-Z0-9\-\._~+/]+=*/gi, replacement: 'Bearer ***MASKED***' },
    ];

    let result = input;
    for (const p of patterns) {
      result = result.replace(p.regex, p.replacement);
    }
    return result;
  }
}
