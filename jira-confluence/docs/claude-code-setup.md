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

## 作業ログ（2026-03-27）

### 実施した作業

1. Claude Code で MCPサーバーへの接続確認
2. Confluenceスペース一覧の取得テスト
3. JIRA issue（OTHER-5）の詳細取得
4. JIRA issue へのコメント追加

### 学んだ注意点

#### JIRA Cloud でのマークアップについて

**重要**: JIRA Cloud の新しいエディタ（Atlassian Document Format / ADF）では、従来のwiki記法がサポートされていません。

以下のwiki記法は **そのままテキストとして表示されてしまいます**:

- `h2. 見出し` → wiki記法が解釈されない
- `||テーブル||ヘッダー||` → wiki記法が解釈されない
- `*太字*` → wiki記法が解釈されない

**対策**: プレーンテキストで読みやすく整形する

```
【見出し】
■ セクション1
● サブセクション
  - 項目1
  - 項目2
```

MCP経由のコメント追加ではプレーンテキストとして送信されるため、上記のような記号を使った整形を推奨します。

### 成功した操作例

```
【調査結果】
調査日: 2026-03-27

■ 調査対象

● アカウントA
  - item-1 | 説明 | running
  - item-2 | 説明 | stopped

■ サマリー
  - 対象数: 8
  - 移行対象: 5件
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
