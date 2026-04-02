# MCP Servers

## 概要

このディレクトリには、Model Context Protocol (MCP) を利用して生成AI（主にClaude）と外部サービスを連携させるためのMCPサーバー群を配置しています。

## Model Context Protocol (MCP) とは

MCPは、AnthropicによるAIアシスタントと外部システムを接続するための標準プロトコルです。MCPサーバーを介して、Claudeが様々な外部サービスのデータやAPIに直接アクセスできるようになります。

## 利点

- **自然言語での操作**: チャットインターフェースで外部サービスを操作可能
- **効率化**: 定型作業の自動化とドキュメント作成の効率化
- **拡張性**: 新しいサービスを追加することで機能を拡張可能
- **統合環境**: 複数のサービスをClaude経由で一元管理

## 連携サービス一覧

### 実装済み

- [JIRA/Confluence](./jira-confluence/) - アトラシアンの課題管理・ドキュメント管理ツール
- [GitHub](./github/) - GitHubリポジトリ・Issue・PR管理
- [GitLab](./gitlab/) - GitLabプロジェクト・Issue・MR管理

### 今後の予定

- Slack
- Notion
- Google Workspace (Drive, Sheets, Docs)
- その他の社内ツール

## ディレクトリ構造

```
mcp-servers/
├── README.md                    # このファイル
├── CLAUDE.md                    # Claude Code用ガイダンス
├── Makefile                     # ビルド・テストコマンド
├── jira-confluence/             # JIRA/Confluence連携サーバー
├── github/                      # GitHub連携サーバー
├── gitlab/                      # GitLab連携サーバー
└── .github/                     # CI/CD・Dependabot設定
```

## セットアップ

各MCPサーバーのセットアップ方法については、各サービスのディレクトリ内のREADMEを参照してください。

## 使用方法

### Claude Desktop Appでの設定

`claude_desktop_config.json` に各MCPサーバーを登録します:

```json
{
  "mcpServers": {
    "jira-confluence": {
      "command": "python",
      "args": ["/path/to/utilities/mcp-servers/jira-confluence/src/server.py"],
      "env": {
        // 環境変数設定
      }
    }
    // 他のMCPサーバーもここに追加
  }
}
```

### Claude Code (CLI) での使用

Claude Code では `claude mcp add` コマンドでMCPサーバーを登録できます。

#### 基本構文

```bash
# ローカルサーバー（stdio トランスポート）
claude mcp add --transport stdio <サーバー名> [オプション] -- <コマンド> [引数...]

# リモートサーバー（http トランスポート）
claude mcp add --transport http <サーバー名> <URL> [オプション]
```

#### 主要オプション

| オプション | 説明 | 例 |
|-----------|------|-----|
| `--transport` | トランスポート種別: `stdio`, `http`, `sse` | `--transport stdio` |
| `--scope` | 保存先: `local`(デフォルト), `project`, `user` | `--scope project` |
| `--env KEY=value` | 環境変数を設定（複数指定可） | `--env API_KEY=xxx` |
| `--header` | HTTPヘッダー追加（複数指定可） | `--header "Authorization: Bearer xxx"` |

#### スコープの違い

| スコープ | 保存先 | 共有範囲 | Git管理 |
|---------|--------|---------|---------|
| `local` | `~/.claude.json` | 自分のみ（このプロジェクト） | No |
| `project` | `.mcp.json` | チーム全員 | Yes |
| `user` | `~/.claude.json` | 自分のみ（全プロジェクト） | No |

#### 登録例

```bash
# JIRA/Confluence サーバーを登録（個人用）
claude mcp add --transport stdio jira-confluence \
  --env JIRA_BASE_URL=https://your-domain.atlassian.net \
  --env JIRA_USER_EMAIL=your-email@example.com \
  --env JIRA_API_TOKEN=your-api-token \
  --env CONFLUENCE_BASE_URL=https://your-domain.atlassian.net \
  --env CONFLUENCE_USER_EMAIL=your-email@example.com \
  --env CONFLUENCE_API_TOKEN=your-api-token \
  -- node /path/to/mcp-servers/jira-confluence/dist/index.js

# GitHub サーバーを登録（個人用）
claude mcp add --transport stdio github \
  --env GITHUB_TOKEN=ghp_xxxxxxxxxxxx \
  -- node /path/to/mcp-servers/github/dist/index.js

# GitLab サーバーを登録（個人用）
claude mcp add --transport stdio gitlab \
  --env GITLAB_TOKEN=glpat-xxxxxxxxxxxx \
  -- node /path/to/mcp-servers/gitlab/dist/index.js

# チーム共有用に .mcp.json へ登録
claude mcp add --transport stdio gitlab --scope project \
  -- node ./gitlab/dist/index.js
```

#### 関連コマンド

```bash
# 登録済みサーバー一覧
claude mcp list

# サーバー詳細表示
claude mcp get <サーバー名>

# サーバー削除
claude mcp remove <サーバー名>

# JSON形式で直接追加
claude mcp add-json <サーバー名> '<JSON設定>'
```

#### Claude Code 内での管理

Claude Code 起動後、`/mcp` コマンドで接続中のMCPサーバーの状態確認・OAuth認証が可能です。

## 参考リンク

- [MCP公式ドキュメント](https://modelcontextprotocol.io/)
- [MCP GitHub Repository](https://github.com/anthropics/anthropic-sdk-python)

## 注意事項

- 各サービスのAPI認証情報は `.env` ファイルで管理し、リポジトリにコミットしないこと
- APIレート制限に注意して使用すること
- 適切な権限管理を行うこと

## Development Flow

**This flow MUST be strictly followed.** When receiving a modification request from the user, follow these steps:

1. **Receive Request**: Receive the request from the user (text or file path). If a file path is provided, read the file.
2. **Create Plan**: Enter Plan mode and create an implementation plan for user approval.
3. **Create Issue**: After user approval, create a GitHub Issue.
4. **Create Branch**: Create a feature branch. Naming convention: `feature/{issue_number}-{summary_2_5_words_snake_case}`
5. **Implement**: Make the modifications. Ensure unit tests are sufficient (add if needed).
6. **Local Validation**: Run `make check` (lint, security check, unit tests). Fix any issues and re-run.
7. **Commit**: After all checks pass, commit. Prefix commit message with `#{issue_number}`.
8. **Push & Create PR**: Push to GitHub and create a Pull Request. Report to the user.
9. **Review Response**:
   - If user **rejects** the PR: Comment the rejection reason on the Issue and restart from step 5.
   - If user **approves** the PR: Add a summary comment to the Issue and close it.
