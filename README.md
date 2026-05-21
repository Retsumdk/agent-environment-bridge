# Agent Environment Bridge

Secure interface for AI agents to interact with legacy systems, local environments, and non-AI APIs.

## Overview

Agent Environment Bridge provides a secure, audited, and schema-driven gateway for AI agents to interact with their surrounding environment. It acts as a protective layer between the agent's broad capabilities and the sensitive reality of your systems.

## Features

- **Adapter Architecture**: Pluggable system for REST APIs, Shell commands, SQL databases, and more.
- **Security Gateway**:
  - **Input Validation**: Blocked keyword detection and schema enforcement.
  - **Output Filtering**: Automatic masking of sensitive data (passwords, tokens, keys).
  - **Command Allow-lists**: Strict control over which local commands can be executed.
- **Audit Logging**: Immutable record of every request, response, duration, and status.
- **Context Management**: Handles authentication headers and session state per adapter.

## Installation

```bash
bun install
```

## Usage

### CLI Mode

```bash
# Execute a shell command
bun src/index.ts run --adapter local-shell --action ls --params '{"args": ["-la"]}'

# Call a REST API
bun src/index.ts run --adapter public-api --action posts/1
```

### Configuration

Create a `config.json` to define your adapters and security rules:

```json
{
  "name": "my-agent-bridge",
  "security": {
    "enableInputValidation": true,
    "enableOutputFiltering": true,
    "maskSensitiveData": true,
    "blockedKeywords": ["/etc/shadow"],
    "allowedCommands": ["ls", "grep"]
  },
  "adapters": [
    {
      "id": "production-api",
      "type": "rest",
      "permissions": ["*"],
      "options": {
        "baseUrl": "https://api.myapp.com",
        "headers": { "Authorization": "Bearer TOKEN" }
      }
    }
  ]
}
```

## Architecture

The bridge follows a modular design:

- **Core**: Orchestration, Security, and Auditing logic.
- **Adapters**: Target-specific implementations for different environments.
- **Types**: Shared interface definitions for consistency.

## Testing

```bash
bun test
```

## License

MIT
