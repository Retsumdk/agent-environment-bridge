#!/usr/bin/env bun
/**
 * agent-environment-bridge - Secure interface for agents to interact with legacy systems and non-AI APIs
 * Built by Retsumdk
 */

import { Command } from "commander";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { AgentEnvironmentBridge } from "./core/bridge.js";
import { BridgeConfig } from "./types/index.js";

const DEFAULT_CONFIG: BridgeConfig = {
  name: "agent-environment-bridge",
  version: "1.0.0",
  auditPath: "./logs/audit.jsonl",
  security: {
    enableInputValidation: true,
    enableOutputFiltering: true,
    maskSensitiveData: true,
    blockedKeywords: ["/etc/passwd", "/etc/shadow", "rm -rf /"],
    allowedCommands: ["ls", "cat", "grep", "echo"]
  },
  adapters: [
    {
      id: "local-shell",
      type: "shell",
      name: "Local Shell Access",
      permissions: ["ls", "cat"],
      options: {
        cwd: process.cwd(),
        timeout: 5000
      }
    },
    {
      id: "public-api",
      type: "rest",
      name: "Public REST API",
      permissions: ["*"],
      options: {
        baseUrl: "https://jsonplaceholder.typicode.com",
        timeout: 10000
      }
    }
  ]
};

function loadConfig(path: string): BridgeConfig {
  if (existsSync(path)) {
    try {
      const content = readFileSync(path, "utf-8");
      return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
    } catch (e) {
      console.warn(`Failed to load config from ${path}, using defaults.`);
    }
  }
  return DEFAULT_CONFIG;
}

const program = new Command();

program
  .name("agent-environment-bridge")
  .description("Secure interface for agents to interact with legacy systems and non-AI APIs")
  .version("1.0.0");

program
  .command("run")
  .description("Execute an action through the bridge")
  .requiredOption("-a, --adapter <id>", "Adapter ID")
  .requiredOption("-x, --action <name>", "Action/Path/Command")
  .option("-p, --params <json>", "Parameters as JSON string", "{}")
  .option("-c, --config <path>", "Path to config file", "config.json")
  .action(async (opts) => {
    const config = loadConfig(opts.config);
    const bridge = new AgentEnvironmentBridge(config);
    
    let params = {};
    try {
      params = JSON.parse(opts.params);
    } catch (e) {
      console.error("Invalid JSON in params");
      process.exit(1);
    }

    const response = await bridge.handleRequest({
      adapterId: opts.adapter,
      action: opts.action,
      params
    });

    console.log(JSON.stringify(response, null, 2));
    if (!response.success) process.exit(1);
  });

program
  .command("config")
  .description("Show current configuration")
  .option("-c, --config <path>", "Path to config file", "config.json")
  .action((opts) => {
    const config = loadConfig(opts.config);
    console.log(JSON.stringify(config, null, 2));
  });

program.parse(process.argv);
