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

### 今後の予定

- Slack
- GitHub
- Notion
- Google Workspace (Drive, Sheets, Docs)
- その他の社内ツール

## ディレクトリ構造

```
mcp-servers/
├── README.md                    # このファイル
├── jira-confluence/             # JIRA/Confluence連携サーバー
│   ├── README.md               # 詳細な作業計画書
│   ├── src/                    # ソースコード
│   └── ...
└── (future-services)/          # 今後追加される他のサービス連携
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

Claude Codeでも同様の設定で各MCPサーバーを利用できます。

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
