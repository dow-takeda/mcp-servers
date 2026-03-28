# 複数アカウント設定ガイド

複数のJIRA/Confluenceアカウント（顧客ごとなど）を使い分ける方法を説明します。

## 基本概念

Claude Desktop Appの設定ファイルに、同じMCPサーバープログラムを**異なる環境変数**で複数登録することで、複数のアカウントを使い分けることができます。

各MCPサーバーインスタンスには一意の名前を付けます（例: `jira-confluence-company-a`, `jira-confluence-company-b`）。

## 設定手順

### 1. 各クライアントのAPI Tokenを取得

クライアントごとに以下の情報を用意します：
- Atlassian ドメイン (例: `https://company-a.atlassian.net`)
- ユーザーメールアドレス
- JIRA API Token
- Confluence API Token

### 2. claude_desktop_config.json の編集

`~/Library/Application Support/Claude/claude_desktop_config.json` を編集し、複数のMCPサーバーを登録します。

```json
{
  "mcpServers": {
    "jira-confluence-company-a": {
      "command": "node",
      "args": [
        "/path/to/mcp-servers/jira-confluence/dist/index.js"
      ],
      "env": {
        "JIRA_BASE_URL": "https://company-a.atlassian.net",
        "JIRA_USER_EMAIL": "your-email@company-a.com",
        "JIRA_API_TOKEN": "your-company-a-jira-token",
        "CONFLUENCE_BASE_URL": "https://company-a.atlassian.net",
        "CONFLUENCE_USER_EMAIL": "your-email@company-a.com",
        "CONFLUENCE_API_TOKEN": "your-company-a-confluence-token",
        "LOG_LEVEL": "info"
      }
    },
    "jira-confluence-company-b": {
      "command": "node",
      "args": [
        "/path/to/mcp-servers/jira-confluence/dist/index.js"
      ],
      "env": {
        "JIRA_BASE_URL": "https://company-b.atlassian.net",
        "JIRA_USER_EMAIL": "your-email@company-b.com",
        "JIRA_API_TOKEN": "your-company-b-jira-token",
        "CONFLUENCE_BASE_URL": "https://company-b.atlassian.net",
        "CONFLUENCE_USER_EMAIL": "your-email@company-b.com",
        "CONFLUENCE_API_TOKEN": "your-company-b-confluence-token",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**重要なポイント**:
- 各サーバーインスタンスの名前（例: `jira-confluence-company-a`）は一意である必要があります
- `command` と `args` は全て同じMCPサーバープログラムを指します
- `env` セクションで接続先を切り替えています

### 3. Claude Desktop App の再起動

設定を反映するため、Claude Desktop Appを再起動します。

## 使用方法

### クライアント名を指定して操作

Claudeに対して、どのクライアントのアカウントを使用するか指定します。

**例1: Company A のJIRAを検索**
```
Company A のプロジェクトで、PROJの未完了チケットを検索して
```

**例2: Company B のConfluenceページを作成**
```
Company B のConfluenceで、DEVスペースに新しいページを作成して
```

**例3: 明示的にクライアントを指定**
```
company-a のアカウントで PROJ-123 の詳細を取得
```

### Claudeの動作

Claudeは複数のMCPサーバーインスタンスから適切なものを選択して操作します。各サーバーは独立して動作するため、異なるアカウントへの同時アクセスも可能です。

## 管理のヒント

### 命名規則

MCPサーバーインスタンス名は分かりやすい命名規則を使うことを推奨します：

- `jira-confluence-{company-name}`: 会社名ベース
- `jira-confluence-{project-name}`: プロジェクト名ベース
- `jira-confluence-{client-code}`: クライアントコードベース

### セキュリティ

- `claude_desktop_config.json` にはAPI Tokenが平文で記載されるため、ファイルのパーミッションに注意
- 不要になったクライアント設定は削除する
- 定期的にAPI Tokenをローテーションする

### トラブルシューティング

**Q: 複数のサーバーが表示されない**
- Claude Desktop Appを再起動したか確認
- JSON構文が正しいか確認（カンマの位置など）
- ログレベルを `debug` に変更して詳細を確認

**Q: どのアカウントに接続されているか分からない**
- Claudeに「現在接続されているJIRAアカウントを確認して」と指示
- 各MCPサーバーの接続テストを実行

**Q: 誤ったアカウントに接続してしまう**
- メッセージ内で明示的にクライアント名を指定
- 例: 「company-a のアカウントで」「company-b で」

## 設定例

プロジェクト構成に応じた設定例：

### ケース1: 社内プロジェクト + 複数の顧客案件

```json
{
  "mcpServers": {
    "jira-confluence-internal": {
      "command": "node",
      "args": ["..."],
      "env": { /* 社内用の設定 */ }
    },
    "jira-confluence-customer-a": {
      "command": "node",
      "args": ["..."],
      "env": { /* 顧客A用の設定 */ }
    },
    "jira-confluence-customer-b": {
      "command": "node",
      "args": ["..."],
      "env": { /* 顧客B用の設定 */ }
    }
  }
}
```

### ケース2: 環境別（開発/本番）

```json
{
  "mcpServers": {
    "jira-confluence-dev": {
      "command": "node",
      "args": ["..."],
      "env": { /* 開発環境の設定 */ }
    },
    "jira-confluence-prod": {
      "command": "node",
      "args": ["..."],
      "env": { /* 本番環境の設定 */ }
    }
  }
}
```

## 今後の拡張

他のMCPサーバー（Slack、GitHub等）も同様に複数インスタンスを登録できます。

```json
{
  "mcpServers": {
    "jira-confluence-company-a": { /* ... */ },
    "jira-confluence-company-b": { /* ... */ },
    "slack-company-a": { /* ... */ },
    "slack-company-b": { /* ... */ }
  }
}
```
