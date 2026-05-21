
import { expect, test, describe } from "bun:test";
import { AgentEnvironmentBridge } from "../src/core/bridge.js";
import { BridgeConfig } from "../src/types/index.js";

const testConfig: BridgeConfig = {
  name: "test-bridge",
  version: "1.0.0",
  auditPath: "./logs/test-audit.jsonl",
  security: {
    enableInputValidation: true,
    enableOutputFiltering: true,
    maskSensitiveData: true,
    blockedKeywords: ["secret-keyword"],
    allowedCommands: ["echo", "ls"]
  },
  adapters: [
    {
      id: "test-shell",
      type: "shell",
      name: "Test Shell",
      permissions: ["*"],
      options: { timeout: 2000 }
    },
    {
      id: "test-rest",
      type: "rest",
      name: "Test REST",
      permissions: ["*"],
      options: { baseUrl: "https://jsonplaceholder.typicode.com" }
    }
  ]
};

describe("AgentEnvironmentBridge", () => {
  const bridge = new AgentEnvironmentBridge(testConfig);

  test("should execute a shell command successfully", async () => {
    const response = await bridge.handleRequest({
      adapterId: "test-shell",
      action: "echo",
      params: { args: ["hello world"] }
    });

    expect(response.success).toBe(true);
    expect(response.data.stdout).toContain("hello world");
  });

  test("should block commands not in the allow-list", async () => {
    const response = await bridge.handleRequest({
      adapterId: "test-shell",
      action: "rm",
      params: { args: ["-rf", "/"] }
    });

    expect(response.success).toBe(false);
    expect(response.error).toContain("Security Violation");
  });

  test("should block input containing blocked keywords", async () => {
    const response = await bridge.handleRequest({
      adapterId: "test-shell",
      action: "echo",
      params: { args: ["this contains a secret-keyword"] }
    });

    expect(response.success).toBe(false);
    expect(response.error).toContain("blocked keyword");
  });

  test("should mask sensitive data in response", async () => {
    // This is a bit tricky to test with real external APIs, but we can mock or rely on the logic
    const sensitiveData = {
      user: "test",
      password: "my-secret-password"
    };
    
    // Manually trigger the filterResponse for a unit test feel
    const security = (bridge as any).security;
    const filtered = await security.filterResponse(sensitiveData);
    
    expect(filtered.password).toBe("***MASKED***");
  });

  test("should handle REST API requests", async () => {
    const response = await bridge.handleRequest({
      adapterId: "test-rest",
      action: "posts/1",
      params: {}
    });

    expect(response.success).toBe(true);
    expect(response.data.id).toBe(1);
  });
});
