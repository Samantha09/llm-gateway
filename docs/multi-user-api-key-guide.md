# 多用户 API Key 分发指南

本文档介绍如何通过 LLM Gateway 为多个用户分發不同的 API Key，实现用量追踪和成本分摊。

## 多租户架构

```
Organization (组织)
    └── Project (项目)
            └── API Key (用户密钥)
```

| 层级 | 说明 |
|------|------|
| **Organization** | 组织/租户，代表一个团队或公司 |
| **Project** | 组织下的项目，用于分组管理 |
| **API Key** | 分发给最终用户的调用密钥 |
| **Provider Key** | 上游 LLM 提供商（Kimi、OpenAI 等）的 API 密钥 |

## 快速开始

### 1. 启动服务

```bash
# 终端1: 启动 gateway (端口 8080)
mvn -pl gateway-app spring-boot:run

# 终端2: 启动 control-plane (端口 8081)
mvn -pl control-plane spring-boot:run
```

### 2. 登录管理后台

默认管理员账户：
- Email: `admin@example.com`
- Password: `password`

```bash
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

登录成功后会返回 Session Cookie，后续请求需要携带。

## 配置 Provider Key

Provider Key 是上游 LLM 提供商的 API 密钥，用户调用时会使用这些密钥访问实际的 LLM 服务。

### 配置 Kimi (月之暗面)

```bash
curl -X POST http://localhost:8081/keys/provider \
  -H "Content-Type: application/json" \
  -H "Cookie: SESSION=你的session" \
  -d '{
    "provider_id": "kimi",
    "name": "Kimi API Key",
    "api_key": "你的kimi密钥",
    "base_url": "https://api.moonshot.cn"
  }'
```

### 配置 OpenAI

```bash
curl -X POST http://localhost:8081/keys/provider \
  -H "Content-Type: application/json" \
  -H "Cookie: SESSION=你的session" \
  -d '{
    "provider_id": "openai",
    "name": "OpenAI API Key",
    "api_key": "你的openai密钥",
    "base_url": "https://api.openai.com"
  }'
```

### 配置 Anthropic

```bash
curl -X POST http://localhost:8081/keys/provider \
  -H "Content-Type: application/json" \
  -H "Cookie: SESSION=你的session" \
  -d '{
    "provider_id": "anthropic",
    "name": "Anthropic API Key",
    "api_key": "你的anthropic密钥",
    "base_url": "https://api.anthropic.com"
  }'
```

### 查看已配置的 Provider Keys

```bash
curl http://localhost:8081/keys/provider \
  -H "Cookie: SESSION=你的session"
```

## 创建组织和项目

### 创建组织

```bash
curl -X POST http://localhost:8081/orgs \
  -H "Content-Type: application/json" \
  -H "Cookie: SESSION=你的session" \
  -d '{"name":"研发团队A"}'
```

响应示例：
```json
{
  "id": "abc123def456",
  "name": "研发团队A",
  "active": true
}
```

### 创建项目

```bash
curl -X POST http://localhost:8081/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: SESSION=你的session" \
  -d '{
    "organizationId": "组织ID",
    "name": "项目1"
  }'
```

## 为用户创建 API Key

### 创建 API Key

```bash
curl -X POST http://localhost:8081/keys/api \
  -H "Content-Type: application/json" \
  -H "Cookie: SESSION=你的session" \
  -d '{
    "organizationId": "组织ID",
    "projectId": "项目ID",
    "name": "张三的密钥"
  }'
```

响应示例：
```json
{
  "id": "key123",
  "token": "sk_live_abc123xyz789",
  "token_prefix": "sk_live_",
  "name": "张三的密钥",
  "project_id": "proj123",
  "organization_id": "org123"
}
```

> **重要**：`token` 字段只在创建时返回一次，请妥善保存并分发给用户。

### 列出所有 API Keys

```bash
curl http://localhost:8081/keys/api \
  -H "Cookie: SESSION=你的session"
```

## 用户使用 API

用户使用分配的 API Key 调用网关：

### OpenAI 兼容格式

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_live_用户的密钥" \
  -d '{
    "model": "moonshot-v1-8k",
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

### Anthropic 兼容格式

```bash
curl http://localhost:8080/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk_live_用户的密钥" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "moonshot-v1-8k",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

## API Key 管理

### 设置预算限制

```bash
curl -X PATCH http://localhost:8081/keys/api/{keyId} \
  -H "Content-Type: application/json" \
  -H "Cookie: SESSION=你的session" \
  -d '{
    "budget_micros_usd": 10000000,
    "requests_per_minute_limit": 60
  }'
```

> `budget_micros_usd` 单位是微美元，10000000 = $10

### 配置 IAM 规则（限制可用模型）

```bash
# 允许特定模型
curl -X POST http://localhost:8081/keys/api/{keyId}/iam \
  -H "Content-Type: application/json" \
  -H "Cookie: SESSION=你的session" \
  -d '{
    "rule_type": "MODEL",
    "effect": "ALLOW",
    "pattern": "moonshot-v1-8k"
  }'

# 禁止特定模型
curl -X POST http://localhost:8081/keys/api/{keyId}/iam \
  -H "Content-Type: application/json" \
  -H "Cookie: SESSION=你的session" \
  -d '{
    "rule_type": "MODEL",
    "effect": "DENY",
    "pattern": "gpt-4*"
  }'
```

### 禁用 API Key

```bash
curl -X PATCH http://localhost:8081/keys/api/{keyId} \
  -H "Content-Type: application/json" \
  -H "Cookie: SESSION=你的session" \
  -d '{"active": false}'
```

### 删除 API Key

```bash
curl -X DELETE http://localhost:8081/keys/api/{keyId} \
  -H "Cookie: SESSION=你的session"
```

## 用量监控

### 查看成本汇总

```bash
# 按API Key分组
curl "http://localhost:8081/costs/summary?group_by=api_key_id" \
  -H "Cookie: SESSION=你的session"

# 按组织分组
curl "http://localhost:8081/costs/summary?group_by=organization_id" \
  -H "Cookie: SESSION=你的session"

# 按模型分组
curl "http://localhost:8081/costs/summary?group_by=model" \
  -H "Cookie: SESSION=你的session"
```

### 查看成本时间序列

```bash
curl "http://localhost:8081/costs/timeseries?bucket=day&group_by=organization_id" \
  -H "Cookie: SESSION=你的session"
```

### 查看请求日志

```bash
curl http://localhost:8081/logs \
  -H "Cookie: SESSION=你的session"
```

## 支持的模型

### Kimi (月之暗面)

| 模型 | 上下文长度 | 说明 |
|------|-----------|------|
| `moonshot-v1-8k` | 8,000 | 基础模型 |
| `moonshot-v1-32k` | 32,000 | 长上下文 |
| `moonshot-v1-128k` | 128,000 | 超长上下文 |

### OpenAI

| 模型 | 说明 |
|------|------|
| `gpt-4o` | GPT-4 Optimized |
| `gpt-4o-mini` | 轻量版 |
| `gpt-4-turbo` | GPT-4 Turbo |

### Anthropic

| 模型 | 说明 |
|------|------|
| `claude-sonnet-4-6` | Claude Sonnet 4.6 |
| `claude-opus-4-6` | Claude Opus 4.6 |
| `claude-haiku-4-5` | Claude Haiku 4.5 |

## 审计日志

```bash
# 查看组织的审计日志
curl http://localhost:8081/audit-logs/{organizationId} \
  -H "Cookie: SESSION=你的session"

# 获取审计日志过滤器选项
curl http://localhost:8081/audit-logs/{organizationId}/filters \
  -H "Cookie: SESSION=你的session"
```

## 最佳实践

1. **密钥安全**：API Key 只在创建时显示一次，务必安全保存
2. **最小权限**：通过 IAM 规则限制每个 Key 可访问的模型
3. **预算控制**：为每个 Key 设置合理的预算上限
4. **定期审计**：定期检查用量日志，发现异常及时处理
5. **密钥轮换**：定期重新生成密钥，禁用旧密钥

## 故障排查

### API Key 无效

- 检查 Key 是否已禁用（`active: false`）
- 检查请求头是否正确（`Authorization: Bearer xxx` 或 `x-api-key: xxx`）

### 模型不可用

- 检查 Provider Key 是否已配置
- 检查 IAM 规则是否限制了该模型
- 检查模型名称是否正确

### 超出预算

- 检查 Key 的 `spent_micros_usd` 是否超过 `budget_micros_usd`
- 如需继续使用，增加预算或重置用量
