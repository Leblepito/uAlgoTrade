# Developer Agent Spec — Evolution AI

> Reference document sourced from AAnti/Antigravity Ventures agent system.
> Patterns and standards to guide ai-engine and platform development.

## Code Generation Standards

All generated code must follow:

1. **Documentation** — JSDoc/docstring for all functions, README for modules
2. **Error Handling** — Try-catch, meaningful messages, graceful degradation
3. **Testing** — Unit tests for pure functions, integration tests for APIs
4. **Security** — No hardcoded secrets, input validation, output sanitization
5. **Performance** — Async where applicable, caching, resource cleanup

## Supported Stack

```yaml
languages:
  primary: [python 3.12+, typescript 5+]
  secondary: [sql, bash, yaml]

frameworks:
  frontend: [react 19+, next.js 15+, tailwindcss 4+]
  backend: [fastapi, asp.net 9.0]
  infrastructure: [docker, railway, github actions]
```

## Skill Template

```yaml
skill:
  id: "skill_[sector]_[name]"
  version: "1.0.0"
  description: "[What, When, Expected outcomes]"
  triggers: ["keyword1", "keyword2"]
  level: "[basic|intermediate|advanced|expert]"
  inputs:
    - name: "[input_name]"
      type: "[string|number|boolean|array|object]"
      required: true
  outputs:
    - name: "[output_name]"
      type: "[type]"
  execution:
    steps:
      - step: 1
        action: "[description]"
  metrics:
    success_rate: null
    usage_count: 0
```

## Integration Patterns

| Pattern | Use Case | Implementation |
|---------|----------|---------------|
| Real-time Sync | Price updates, signals | WebSocket + pub/sub |
| Batch Processing | Daily reports, analytics | Scheduled jobs (APScheduler) |
| Event-Driven | Notifications, triggers | Message bus (pub/sub) |
| Request-Response | API queries, actions | REST/FastAPI |

## Cross-Agent Learning Process

1. **Identify pattern** in one agent's behavior
2. **Abstract pattern** into generalized form
3. **Adapt pattern** for target agent context
4. **Validate transfer** with test cases
5. **Deploy and monitor** with rollback option
