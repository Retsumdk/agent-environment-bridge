
export interface BridgeConfig {
  name: string;
  version: string;
  adapters: AdapterConfig[];
  security: SecurityConfig;
  auditPath?: string;
}

export interface AdapterConfig {
  id: string;
  type: 'rest' | 'shell' | 'sql' | 'graphql';
  name: string;
  options: any;
  permissions: string[];
}

export interface SecurityConfig {
  enableInputValidation: boolean;
  enableOutputFiltering: boolean;
  maskSensitiveData: boolean;
  blockedKeywords: string[];
  allowedCommands?: string[];
}

export interface ExecutionRequest {
  adapterId: string;
  action: string;
  params: Record<string, any>;
  context?: Record<string, any>;
}

export interface ExecutionResponse {
  success: boolean;
  data?: any;
  error?: string;
  auditId: string;
  duration: number;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  adapterId: string;
  action: string;
  params: any;
  response: any;
  duration: number;
  status: 'success' | 'failure' | 'blocked';
}
