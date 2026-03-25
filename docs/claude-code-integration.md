# Claude Code 集成指南

本文档介绍如何将 Claude Code 配置为使用 LLM Gateway 作为 API 代理，实现多用户管理和用量追踪。

## 前提条件

- LLM Gateway 已部署并运行
- 已创建 API Key（参考 [多用户 API Key 分发指南](./multi-user-api-key-guide.md)）
- 已配置至少一个 Provider Key（如 Kimi、OpenAI 等）

## 网关兼容性

LLM Gateway 提供以下兼容端点：

| 端点 | 格式 | 用途 |
|------|------|------|
| `/v1/chat/completions` | OpenAI | OpenAI SDK 兼容 |
| `/v1/messages` | Anthropic | Anthropic SDK / Claude Code 兼容 |
| `/v1/models` | OpenAI | 模型列表查询 |

## 配置 Claude Code

### 环境变量方式

在终端中设置以下环境变量：

```bash
# 网关地址（必须支持 /v1/messages 端点）
export ANTHROPIC_BASE_URL=http://localhost:8080

# 网关分发的 API Key
export ANTHROPIC_API_KEY=sk_live_xxxxx

# 要使用的模型（使用 Provider 支持的模型名）
export ANTHROPIC_MODEL=moonshot-v1-8k
```

### 永久配置

将配置添加到 shell 配置文件中：

**~/.zshrc** (macOS 默认) 或 **~/.bashrc** (Linux):

```bash
# Claude Code - 使用 LLM Gateway
export ANTHROPIC_BASE_URL=http://localhost:8080
export ANTHROPIC_API_KEY=sk_live_xxxxx
export ANTHROPIC_MODEL=moonshot-v1-8k
```

然后重新加载配置：

```bash
source ~/.zshrc  # 或 source ~/.bashrc
```

### 不同用户配置示例

```bash
# 用户 A
export ANTHROPIC_API_KEY=sk_live_userA_key123
export ANTHROPIC_MODEL=moonshot-v1-8k

# 用户 B
export ANTHROPIC_API_KEY=sk_live_userB_key456
export ANTHROPIC_MODEL=moonshot-v1-32k

# 用户 C（使用 OpenAI）
export ANTHROPIC_API_KEY=sk_live_userC_key789
export ANTHROPIC_MODEL=gpt-4o
```

## 验证配置

### 测试网关连接

```bash
# 测试 Anthropic 兼容端点
curl http://localhost:8080/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk_live_xxxxx" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "moonshot-v1-8k",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 启动 Claude Code

```bash
claude
```

如果配置正确，Claude Code 将通过网关发送请求。

## 环境变量说明

| 变量 | 必需 | 说明 |
|------|------|------|
| `ANTHROPIC_BASE_URL` | 是 | 网关地址，必须指向 Anthropic API 兼容端点 |
| `ANTHROPIC_API_KEY` | 是 | 网关分发的 API Key |
| `ANTHROPIC_MODEL` | 否 | 默认模型，可在运行时指定 |

## 支持的模型

使用 Claude Code 时，需要指定网关支持的模型名称：

### Kimi 模型

```bash
export ANTHROPIC_MODEL=moonshot-v1-8k      # 8K 上下文
export ANTHROPIC_MODEL=moonshot-v1-32k     # 32K 上下文
export ANTHROPIC_MODEL=moonshot-v1-128k    # 128K 上下文
```

### OpenAI 模型

```bash
export ANTHROPIC_MODEL=gpt-4o
export ANTHROPIC_MODEL=gpt-4o-mini
export ANTHROPIC_MODEL=gpt-4-turbo
```

### Anthropic 模型（如果配置了 Anthropic Provider）

```bash
export ANTHROPIC_MODEL=claude-sonnet-4-6
export ANTHROPIC_MODEL=claude-opus-4-6
export ANTHROPIC_MODEL=claude-haiku-4-5
```

## 功能限制

使用自定义端点时，Claude Code 的以下功能可能受限：

| 功能 | 状态 | 说明 |
|------|------|------|
| 聊天对话 | ✅ 支持 | 核心功能正常 |
| 流式输出 | ✅ 支持 | 支持 SSE 流式响应 |
| MCP 工具搜索 | ❌ 禁用 | 使用非官方端点时禁用 |
| 内置工具 | ⚠️ 部分支持 | 取决于底层模型能力 |

## 生产环境部署

### HTTPS 配置

生产环境建议使用 HTTPS：

```bash
export ANTHROPIC_BASE_URL=https://gateway.yourcompany.com
```

### 示例架构

```
用户终端 (Claude Code)
        ↓
    HTTPS
        ↓
  Nginx / Load Balancer
        ↓
  LLM Gateway (8080)
        ↓
  ┌─────┼─────┐
  ↓     ↓     ↓
Kimi  OpenAI  Anthropic
```

### Nginx 配置示例

```nginx
server {
    listen 443 ssl;
    server_name gateway.yourcompany.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE 支持
        proxy_buffering off;
        proxy_cache off;
    }
}
```

## 用量追踪

所有通过 Claude Code 发出的请求都会被网关记录，可以在管理后台查看：

```bash
# 查看成本汇总
curl "http://localhost:8081/costs/summary?group_by=api_key_id" \
  -H "Cookie: SESSION=你的session"

# 查看请求日志
curl http://localhost:8081/logs \
  -H "Cookie: SESSION=你的session"
```

日志记录包括：
- 请求时间
- 使用的模型
- Token 用量（prompt + completion）
- 估算成本
- API Key 标识
- 响应状态

## 故障排查

### 连接失败

```bash
# 检查网关是否运行
curl http://localhost:8080/actuator/health

# 检查环境变量
echo $ANTHROPIC_BASE_URL
echo $ANTHROPIC_API_KEY
```

### 认证失败

- 确认 API Key 正确且未过期
- 确认 API Key 处于激活状态（`active: true`）
- 检查请求头格式（`x-api-key` 而非 `Authorization`）

### 模型不可用

- 检查模型名称拼写
- 确认 Provider Key 已配置
- 检查 IAM 规则是否限制了该模型

### 请求超时

- 检查网络连接
- 检查上游 Provider 是否正常
- 查看网关日志排查问题

## 相关文档

- [多用户 API Key 分发指南](./multi-user-api-key-guide.md)
- [Claude Code 官方文档 - 环境变量](https://code.claude.com/docs/en/env-vars)
- [Claude Code 官方文档 - LLM Gateway](https://code.claude.com/docs/en/llm-gateway)
