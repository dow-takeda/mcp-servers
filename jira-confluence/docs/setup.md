# セットアップガイド

## 必要な環境

- Node.js 18.0.0以上
- npm または yarn
- JIRA/Confluenceのアカウントとアクセス権限

## インストール手順

### 1. 依存パッケージのインストール

```bash
cd utilities/mcp-servers/jira-confluence
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成します。

```bash
cp .env.example .env
```

`.env` ファイルを編集して、JIRA/Confluenceの認証情報を設定します:

```bash
# JIRA Configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_USER_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# Confluence Configuration
CONFLUENCE_BASE_URL=https://your-domain.atlassian.net
CONFLUENCE_USER_EMAIL=your-email@example.com
CONFLUENCE_API_TOKEN=your-confluence-api-token

# Optional: Logging level (debug, info, warn, error)
LOG_LEVEL=info
```

### 3. API Tokenの取得方法

1. Atlassian アカウント設定にアクセス: https://id.atlassian.com/manage-profile/security/api-tokens
2. 「Create API token」をクリック
3. トークン名を入力（例: "MCP Server for Claude"）
4. 生成されたトークンをコピーして `.env` ファイルに貼り付け

**重要**: API Tokenは一度しか表示されないため、必ず安全な場所に保存してください。

### 4. ビルド

TypeScriptコードをコンパイルします。

```bash
npm run build
```

### 5. 接続テスト（オプション）

環境変数が正しく設定されているか確認します。

```bash
npm start
```

起動時に以下のようなログが表示されれば成功です:

```
[INFO] Starting JIRA/Confluence MCP Server...
[INFO] JIRA connection successful
[INFO] Confluence connection successful
[INFO] MCP Server running on stdio
```

## Claude Desktop Appでの設定

### macOS

`~/Library/Application Support/Claude/claude_desktop_config.json` を編集:

```json
{
  "mcpServers": {
    "jira-confluence": {
      "command": "node",
      "args": [
        "/path/to/mcp-servers/jira-confluence/dist/index.js"
      ],
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

### Windows

`%APPDATA%\Claude\claude_desktop_config.json` を編集:

```json
{
  "mcpServers": {
    "jira-confluence": {
      "command": "node",
      "args": [
        "C:\\path\\to\\utilities\\mcp-servers\\jira-confluence\\dist\\index.js"
      ],
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

**注意事項**:
- パスは絶対パスで指定してください
- `YOUR_USERNAME` を実際のユーザー名に置き換えてください
- API Tokenは実際の値に置き換えてください

## Claude Code (CLI) での設定

Claude Codeの設定ファイルに同様の内容を追加します。

## 動作確認

1. Claude Desktop App または Claude Code を起動
2. 新しいチャットを開始
3. 以下のようなメッセージを送信して動作確認:

```
JIRAの接続テストをして
```

または

```
Confluenceのスペース一覧を取得して
```

正常に動作すれば、セットアップ完了です。

## トラブルシューティング

### 認証エラーが発生する場合

- API Tokenが正しいか確認
- メールアドレスが正しいか確認
- JIRA/ConfluenceのURLが正しいか確認（末尾にスラッシュは不要）

### MCPサーバーが起動しない場合

- Node.jsのバージョンが18.0.0以上か確認: `node -v`
- ビルドが成功しているか確認: `npm run build`
- ログレベルを`debug`に設定して詳細なログを確認

### ツールが表示されない場合

- Claude Desktop Appを再起動
- 設定ファイルのJSON構文が正しいか確認
- パスが絶対パスになっているか確認

## 次のステップ

- [使用例](../examples/jira_examples.md)を参照して実際の使い方を学ぶ
- [API仕様書](./api_reference.md)で利用可能な機能を確認
