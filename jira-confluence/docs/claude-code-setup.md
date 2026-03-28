# Claude Code (CLI) でのセットアップガイド

## 概要

Claude Code（CLIツール）でJIRA/Confluence MCPサーバーを利用するための設定手順です。

## 前提条件

- Claude Code がインストール済み
- Node.js 18.0.0以上
- JIRA/Confluenceの認証情報（API Token）

## セットアップ手順

### 1. MCPサーバーのビルド

```bash
cd /path/to/utilities/mcp-servers/jira-confluence
npm install
npm run build
```

### 2. Claude Code の設定ファイルを編集

Claude Code の MCP 設定ファイルを編集します。

**ファイルの場所**: `~/.claude/settings.json`

```json
{
  "mcpServers": {
    "jira-confluence": {
      "command": "node",
      "args": ["/path/to/mcp-servers/jira-confluence/dist/index.js"],
      "env": {
        "JIRA_BASE_URL": "https://your-domain.atlassian.net",
        "JIRA_USER_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-jira-api-token",
        "CONFLUENCE_BASE_URL": "https://your-domain.atlassian.net",
        "CONFLUENCE_USER_EMAIL": "your-email@example.com",
        "CONFLUENCE_API_TOKEN": "your-confluence-api-token",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**注意**:

- `YOUR_USERNAME` を実際のユーザー名に置き換えてください
- API Tokenは [Atlassianアカウント設定](https://id.atlassian.com/manage-profile/security/api-tokens) から取得

### 3. Claude Code を起動

```bash
claude
```

起動時に `connected` と表示されれば、MCPサーバーへの接続成功です。

## 動作確認

### Confluenceスペース一覧の取得

```
Confluenceのスペース一覧を取得して
```

### JIRAの課題を取得

```
JIRA issue OTHER-5 の詳細を表示して
```

### JIRAにコメントを追加

```
OTHER-5 に「作業完了しました」とコメントを追加して
```

## トラブルシューティング

### MCPサーバーに接続できない場合

1. Node.js のバージョン確認: `node -v` (18.0.0以上)
2. ビルドの実行: `npm run build`
3. 設定ファイルのパスが正しいか確認
4. API Token が有効か確認

### ツールが利用できない場合

- Claude Code を再起動
- `~/.claude/settings.json` のJSON構文を確認

## 参考

- [セットアップガイド（Claude Desktop App向け）](./setup.md)
- [MCP公式ドキュメント](https://modelcontextprotocol.io/)
