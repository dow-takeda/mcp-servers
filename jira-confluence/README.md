# JIRA/Confluence MCP Server

## プロジェクト概要

Model Context Protocol (MCP) を利用して、生成AI（主にClaude）とJIRA、Confluenceを直接連携させるMCPサーバーです。Claude経由でJIRAの課題管理とConfluenceのドキュメント管理を自然言語で操作できます。

## 目的

- JIRAの課題（Issue）の作成・更新・検索をClaude経由で実行
- Confluenceのページ作成・更新・検索をClaude経由で実行
- 開発者がチャットインターフェースで自然言語を使ってJIRA/Confluenceを操作可能に
- 定型作業の自動化とドキュメント作成の効率化

## 技術スタック

### MCPサーバー実装

- **実装言語**: Python または TypeScript/Node.js（選定中）
- **MCPプロトコル**: Anthropic MCP SDK
- **HTTPクライアント**: requests (Python) / axios (TypeScript)

### 対象サービスAPI

- **JIRA REST API v3**
  - エンドポイント: `https://{domain}.atlassian.net/rest/api/3/`
  - 認証: API Token (Basic Auth)
- **Confluence REST API v2**
  - エンドポイント: `https://{domain}.atlassian.net/wiki/api/v2/`
  - 認証: API Token (Basic Auth)

### Claude連携

- Claude Desktop App または Claude Code (CLI)
- MCP設定ファイル経由でサーバーに接続

## 想定機能

### JIRA連携機能

#### 基本機能（Phase 2で実装）

- [ ] **課題検索** (search_issues)
  - JQL（JIRA Query Language）による柔軟な検索
  - プロジェクト、ステータス、担当者などでフィルタリング
- [ ] **課題詳細取得** (get_issue)
  - 課題キー（例: PROJ-123）による詳細情報取得
  - 説明、コメント、添付ファイル、履歴などを取得
- [ ] **課題作成** (create_issue)
  - タイトル、説明、課題タイプ、優先度などを指定
  - プロジェクト、担当者、ラベルの設定

#### 拡張機能（Phase 2で実装）

- [ ] **課題更新** (update_issue)
  - 説明、担当者、優先度などのフィールド更新
- [ ] **コメント追加** (add_comment)
  - 課題へのコメント追加
- [ ] **ステータス遷移** (transition_issue)
  - ワークフローに沿ったステータス変更（例: To Do → In Progress → Done）
- [ ] **添付ファイル操作** (attach_file, get_attachments)
  - ファイルの添付と取得

#### 高度な機能（Phase 5で検討）

- [ ] スプリント情報の取得
- [ ] ボード・バックログの管理
- [ ] バルク操作（複数課題の一括更新）

### Confluence連携機能

#### 基本機能（Phase 3で実装）

- [ ] **ページ検索** (search_pages)
  - CQL（Confluence Query Language）による検索
  - タイトル、スペース、ラベルでフィルタリング
- [ ] **ページコンテンツ取得** (get_page)
  - ページIDまたはタイトルでコンテンツ取得
  - Storage Format（HTML風）とMarkdown形式で取得可能
- [ ] **スペース一覧取得** (list_spaces)
  - アクセス可能なスペースの一覧取得

#### 拡張機能（Phase 3で実装）

- [ ] **ページ作成** (create_page)
  - Markdown入力をConfluence Storage Formatに変換して作成
  - スペース、親ページを指定
- [ ] **ページ更新** (update_page)
  - 既存ページのコンテンツ更新
  - バージョン管理に対応
- [ ] **ページツリー構造取得** (get_page_tree)
  - 階層構造の取得
- [ ] **添付ファイル操作** (attach_file, get_attachments)

#### 高度な機能（Phase 5で検討）

- [ ] テンプレートベースのページ作成
- [ ] マクロの挿入・管理
- [ ] ページ間のリンク自動生成

## 必要な設定・認証情報

### 環境変数

以下の環境変数を `.env` ファイルまたはMCP設定で指定します:

```bash
# JIRA設定
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_USER_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token

# Confluence設定
CONFLUENCE_BASE_URL=https://your-domain.atlassian.net
CONFLUENCE_USER_EMAIL=your-email@example.com
CONFLUENCE_API_TOKEN=your-api-token
```

### API Tokenの取得方法

1. Atlassian アカウント設定にアクセス: https://id.atlassian.com/manage-profile/security/api-tokens
2. 「Create API token」をクリック
3. トークン名を入力（例: "MCP Server for Claude"）
4. 生成されたトークンをコピー（再表示不可なので注意）

**重要**:
- API Tokenは個人アカウントに紐づくため、チーム共有の場合はサービスアカウントの作成を推奨
- トークンには適切な権限のみを付与する
- `.env` ファイルは `.gitignore` に追加し、リポジトリにコミットしない

## ディレクトリ構造

```
jira-confluence/
├── README.md                    # このファイル（作業計画書）
├── requirements.txt             # Pythonパッケージ依存関係
├── package.json                 # Node.jsパッケージ依存関係（TypeScript実装の場合）
├── .env.example                 # 環境変数のサンプル
├── .gitignore                   # Git除外設定
├── src/                         # ソースコード
│   ├── server.py               # MCPサーバーのメインファイル（Python版）
│   ├── server.ts               # MCPサーバーのメインファイル（TypeScript版）
│   ├── config.py               # 設定読み込み
│   ├── jira/                   # JIRA関連
│   │   ├── __init__.py
│   │   ├── client.py           # JIRAクライアント（API通信）
│   │   ├── handlers.py         # JIRA操作ハンドラー（MCPツール定義）
│   │   └── models.py           # データモデル
│   ├── confluence/             # Confluence関連
│   │   ├── __init__.py
│   │   ├── client.py           # Confluenceクライアント（API通信）
│   │   ├── handlers.py         # Confluence操作ハンドラー（MCPツール定義）
│   │   ├── models.py           # データモデル
│   │   └── formatters.py       # Markdown ↔ Storage Format変換
│   └── utils/                  # 共通ユーティリティ
│       ├── __init__.py
│       ├── auth.py             # 認証処理
│       └── logging.py          # ロギング
├── tests/                       # テストコード
│   ├── test_jira_client.py
│   ├── test_confluence_client.py
│   └── test_integration.py
├── examples/                    # 使用例
│   ├── jira_examples.md        # JIRA操作の例
│   └── confluence_examples.md  # Confluence操作の例
└── docs/                        # ドキュメント
    ├── setup.md                # セットアップ手順
    ├── development.md          # 開発ガイド
    ├── api_reference.md        # API仕様
    └── troubleshooting.md      # トラブルシューティング
```

## 実装計画

### Phase 1: 環境構築と基本設計（1週目）

#### 1.1 技術選定

- [ ] **実装言語の決定**
  - Python: シンプルで実装が早い、atlassian-python-api が利用可能
  - TypeScript: 型安全性が高い、Node.js MCPサーバーの実績あり
  - **決定基準**: チームの習熟度、既存ツールとの整合性

- [ ] **MCPサーバーSDKの選定**
  - Python: `mcp` パッケージ
  - TypeScript: `@modelcontextprotocol/sdk`

- [ ] **JIRA/Confluence クライアントライブラリの選定**
  - Python: `atlassian-python-api` または 自前実装（requests使用）
  - TypeScript: 自前実装（axios使用）

#### 1.2 開発環境セットアップ

- [ ] プロジェクトディレクトリの初期化
- [ ] `.gitignore` の作成（`.env`, `__pycache__/`, `node_modules/` など）
- [ ] 依存パッケージファイルの作成
  - Python: `requirements.txt`
  - TypeScript: `package.json`
- [ ] `.env.example` の作成（認証情報のテンプレート）
- [ ] 仮想環境のセットアップ（Python の場合）

#### 1.3 認証機能の実装

- [ ] 環境変数読み込み機能（`python-dotenv` または `dotenv` パッケージ）
- [ ] API Token認証の実装（Basic Auth）
- [ ] 接続テスト機能
  - JIRA: `/rest/api/3/myself` エンドポイントで認証確認
  - Confluence: `/wiki/api/v2/spaces` で接続確認
- [ ] エラーハンドリング（認証失敗、ネットワークエラー）

#### 1.4 基本アーキテクチャの設計

- [ ] MCPサーバーのエントリーポイント作成
- [ ] ツール登録の仕組み実装
- [ ] 共通エラーハンドリング機構
- [ ] ロギング機構（デバッグ用）

### Phase 2: JIRA連携機能の実装（2週目）

#### 2.1 JIRAクライアントの実装

- [ ] **JIRAClient クラスの作成** (`jira/client.py`)
  - 初期化処理（ベースURL、認証情報）
  - 共通HTTPリクエストメソッド（GET, POST, PUT, DELETE）
  - エラーハンドリングとリトライ処理

#### 2.2 基本機能の実装

- [ ] **課題検索機能** (search_issues)
  ```python
  def search_issues(jql: str, max_results: int = 50, fields: list = None) -> list
  ```
  - JQLクエリの実行
  - ページネーション対応
  - フィールドのフィルタリング

- [ ] **課題詳細取得** (get_issue)
  ```python
  def get_issue(issue_key: str, fields: list = None, expand: list = None) -> dict
  ```
  - 課題キーによる取得
  - コメント、添付ファイル、履歴の取得オプション

- [ ] **課題作成** (create_issue)
  ```python
  def create_issue(project_key: str, summary: str, issue_type: str,
                   description: str = None, **kwargs) -> dict
  ```
  - 必須フィールドのバリデーション
  - オプションフィールドの設定（優先度、担当者、ラベルなど）

#### 2.3 拡張機能の実装

- [ ] **課題更新** (update_issue)
  ```python
  def update_issue(issue_key: str, fields: dict) -> dict
  ```

- [ ] **コメント追加** (add_comment)
  ```python
  def add_comment(issue_key: str, body: str) -> dict
  ```

- [ ] **ステータス遷移** (transition_issue)
  ```python
  def transition_issue(issue_key: str, transition_name: str) -> dict
  ```
  - 利用可能なトランジションの取得
  - トランジションの実行

#### 2.4 MCPハンドラーの実装

- [ ] **各機能をMCPツールとして登録** (`jira/handlers.py`)
  - ツール名、説明、パラメータスキーマの定義
  - JIRAClientメソッドの呼び出し
  - レスポンスの整形（Claude向けに読みやすく）

- [ ] **エラーハンドリング**
  - API エラーの適切な変換
  - ユーザーフレンドリーなエラーメッセージ

#### 2.5 テストの実装

- [ ] ユニットテスト（モック使用）
- [ ] 統合テスト（実際のJIRA環境）
- [ ] エッジケースのテスト

### Phase 3: Confluence連携機能の実装（3週目）

#### 3.1 Confluenceクライアントの実装

- [ ] **ConfluenceClient クラスの作成** (`confluence/client.py`)
  - 初期化処理
  - 共通HTTPリクエストメソッド
  - エラーハンドリング

#### 3.2 基本機能の実装

- [ ] **ページ検索** (search_pages)
  ```python
  def search_pages(cql: str = None, title: str = None, space_key: str = None,
                   max_results: int = 25) -> list
  ```
  - CQLクエリ対応
  - シンプルな検索パラメータ（タイトル、スペース）
  - ページネーション

- [ ] **ページコンテンツ取得** (get_page)
  ```python
  def get_page(page_id: str = None, title: str = None, space_key: str = None,
               body_format: str = "storage") -> dict
  ```
  - IDまたはタイトル+スペースで取得
  - Storage Format / View Format 選択

- [ ] **スペース一覧取得** (list_spaces)
  ```python
  def list_spaces(space_type: str = None, status: str = "current") -> list
  ```

#### 3.3 拡張機能の実装

- [ ] **Markdown ↔ Storage Format 変換機能** (`confluence/formatters.py`)
  - Markdown → Confluence Storage Format（XHTML風）
  - Storage Format → Markdown（Claude用）
  - 既存ライブラリの活用検討（`markdown2`, `html2text`）

- [ ] **ページ作成** (create_page)
  ```python
  def create_page(space_key: str, title: str, body: str,
                  parent_id: str = None, body_format: str = "markdown") -> dict
  ```
  - Markdown入力の自動変換
  - 親ページ指定

- [ ] **ページ更新** (update_page)
  ```python
  def update_page(page_id: str, title: str = None, body: str = None,
                  version_number: int = None, body_format: str = "markdown") -> dict
  ```
  - バージョン番号の自動取得・インクリメント
  - 部分更新対応

- [ ] **ページツリー構造取得** (get_page_tree)
  ```python
  def get_page_tree(page_id: str, depth: int = 1) -> dict
  ```

#### 3.4 MCPハンドラーの実装

- [ ] 各機能をMCPツールとして登録
- [ ] レスポンスフォーマット整形
- [ ] エラーハンドリング

#### 3.5 テストの実装

- [ ] ユニットテスト
- [ ] 統合テスト
- [ ] Markdown変換のテスト

### Phase 4: Claude連携とテスト（4週目）

#### 4.1 MCP設定

- [ ] **Claude Desktop App 設定ファイルの作成**
  - サンプル `claude_desktop_config.json` の作成
  - 環境変数の設定方法を記載

- [ ] **MCPサーバー起動スクリプト**
  - Python: `python src/server.py`
  - バックグラウンド実行スクリプト
  - ログ出力設定

- [ ] **接続確認**
  - Claude Desktop/Code からの接続テスト
  - ツール一覧の表示確認

#### 4.2 動作テスト

- [ ] **JIRA機能のエンドツーエンドテスト**
  - 課題検索
  - 課題作成
  - 課題更新
  - コメント追加
  - ステータス遷移

- [ ] **Confluence機能のエンドツーエンドテスト**
  - ページ検索
  - ページ作成（Markdown入力）
  - ページ更新
  - ページコンテンツ取得

- [ ] **エラーケースのテスト**
  - 認証失敗
  - 存在しない課題/ページ
  - 権限エラー
  - ネットワークエラー

- [ ] **パフォーマンステスト**
  - レスポンス時間の測定
  - 大量データ取得時の動作確認

#### 4.3 ドキュメント作成

- [ ] **セットアップガイド** (`docs/setup.md`)
  - 環境構築手順
  - 認証情報の設定方法
  - Claude との接続方法

- [ ] **使用例** (`examples/`)
  - JIRA操作の実例
  - Confluence操作の実例
  - 複合的な使用シナリオ

- [ ] **API仕様書** (`docs/api_reference.md`)
  - 各ツールの仕様
  - パラメータ説明
  - レスポンス形式

- [ ] **トラブルシューティング** (`docs/troubleshooting.md`)
  - よくある問題と解決方法
  - デバッグ方法

### Phase 5: 運用と改善（継続的）

#### 5.1 リリース準備

- [ ] **README.md の充実**
  - プロジェクト概要
  - クイックスタートガイド
  - 機能一覧
  - ライセンス情報

- [ ] **サンプル設定ファイルの整備**
  - `.env.example` の詳細化
  - `claude_desktop_config.json` のサンプル

- [ ] **チーム内共有**
  - 社内ドキュメントへの記載
  - 使用方法のデモ・説明会

#### 5.2 機能拡張（オプション）

- [ ] **バッチ操作**
  - 複数課題の一括更新
  - 一括コメント追加
  - CSV/JSONからの一括インポート

- [ ] **レポート生成機能**
  - スプリントレポート
  - 課題集計レポート
  - Confluenceページとして出力

- [ ] **Webhook連携**
  - JIRA Webhookのリスニング
  - リアルタイム通知

- [ ] **高度な検索機能**
  - 自然言語からJQL/CQL生成
  - 検索結果の要約・分析

- [ ] **テンプレート機能**
  - よく使う課題のテンプレート
  - Confluenceページテンプレート

#### 5.3 保守・改善

- [ ] ユーザーフィードバックの収集
- [ ] バグ修正
- [ ] パフォーマンス改善
- [ ] セキュリティアップデート

## 使用方法（予定）

### セットアップ

```bash
# ディレクトリに移動
cd utilities/mcp-servers/jira-confluence

# 依存パッケージのインストール（Python版の場合）
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 環境変数の設定
cp .env.example .env
# .env ファイルを編集してJIRA/Confluenceの認証情報を設定

# MCPサーバーの起動（テスト）
python src/server.py
```

### Claude Desktop Appでの設定

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) に以下を追加:

```json
{
  "mcpServers": {
    "jira-confluence": {
      "command": "python",
      "args": [
        "/path/to/mcp-servers/jira-confluence/src/server.py"
      ],
      "env": {
        "JIRA_BASE_URL": "https://your-domain.atlassian.net",
        "JIRA_USER_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-jira-api-token",
        "CONFLUENCE_BASE_URL": "https://your-domain.atlassian.net",
        "CONFLUENCE_USER_EMAIL": "your-email@example.com",
        "CONFLUENCE_API_TOKEN": "your-confluence-api-token"
      }
    }
  }
}
```

**注意**: パスは絶対パスで指定してください。

### Claude Code (CLI) での使用

Claude Codeでも同様の設定ファイルで利用可能です。

### 使用例

Claude Desktop AppまたはClaude Codeで以下のような指示が可能になります。

#### JIRA操作例

**課題検索:**
```
プロジェクトOPEの未完了チケットを検索して
```

**課題詳細取得:**
```
OPE-123のチケット詳細を教えて
```

**課題作成:**
```
バグチケットを作成して。
プロジェクト: OPE
タイトル: ログイン画面でエラーが発生する
優先度: High
説明: ユーザー名に特殊文字を入力すると500エラーになる
```

**ステータス変更:**
```
OPE-456のステータスを「進行中」に変更して
```

**コメント追加:**
```
OPE-789に「レビュー完了しました」とコメントを追加して
```

#### Confluence操作例

**ページ検索:**
```
開発スペースで「API仕様」に関するページを検索して
```

**ページ作成:**
```
「新機能リリースノート v2.0」というタイトルでConfluenceページを作成して。
スペース: DEV

内容:
# 新機能
- ユーザー認証強化
- パフォーマンス改善

# バグ修正
- ログイン画面のエラー修正
```

**ページ内容取得と要約:**
```
「開発ガイドライン」ページの内容を取得して要約して
```

**ページ更新:**
```
「リリースノート」ページに今月の変更内容を追加して
```

## 技術的な詳細

### JIRA REST API エンドポイント

| 機能 | エンドポイント | メソッド |
|------|---------------|----------|
| 課題検索 | `/rest/api/3/search` | GET |
| 課題取得 | `/rest/api/3/issue/{issueIdOrKey}` | GET |
| 課題作成 | `/rest/api/3/issue` | POST |
| 課題更新 | `/rest/api/3/issue/{issueIdOrKey}` | PUT |
| コメント追加 | `/rest/api/3/issue/{issueIdOrKey}/comment` | POST |
| トランジション取得 | `/rest/api/3/issue/{issueIdOrKey}/transitions` | GET |
| トランジション実行 | `/rest/api/3/issue/{issueIdOrKey}/transitions` | POST |

### Confluence REST API エンドポイント

| 機能 | エンドポイント | メソッド |
|------|---------------|----------|
| ページ検索 | `/wiki/api/v2/pages` | GET |
| ページ取得 | `/wiki/api/v2/pages/{id}` | GET |
| ページ作成 | `/wiki/api/v2/pages` | POST |
| ページ更新 | `/wiki/api/v2/pages/{id}` | PUT |
| スペース一覧 | `/wiki/api/v2/spaces` | GET |

### 認証方式

Atlassian Cloud APIはBasic認証を使用:
- ユーザー名: メールアドレス
- パスワード: API Token

HTTPヘッダー:
```
Authorization: Basic base64(email:api_token)
```

### エラーハンドリング

主なHTTPステータスコード:
- `200 OK`: 成功
- `201 Created`: リソース作成成功
- `400 Bad Request`: リクエストが不正
- `401 Unauthorized`: 認証失敗
- `403 Forbidden`: 権限不足
- `404 Not Found`: リソースが存在しない
- `429 Too Many Requests`: レート制限超過

MCPサーバーは適切なエラーメッセージをClaudeに返し、ユーザーが理解しやすい形で表示します。

## 参考リンク

### MCP関連
- [MCP公式ドキュメント](https://modelcontextprotocol.io/)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

### Atlassian API
- [JIRA REST API v3 Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/)
- [Confluence REST API v2 Documentation](https://developer.atlassian.com/cloud/confluence/rest/v2/intro/)
- [Atlassian Python API](https://github.com/atlassian-api/atlassian-python-api)

### 関連ツール
- [JQL (JIRA Query Language) Reference](https://support.atlassian.com/jira-software-cloud/docs/what-is-advanced-searching-in-jira-cloud/)
- [CQL (Confluence Query Language) Reference](https://developer.atlassian.com/cloud/confluence/cql/)

## 注意事項

### セキュリティ

1. **認証情報の管理**
   - API Tokenやクレデンシャルは絶対にGitにコミットしない
   - `.gitignore` に `.env` を追加済み
   - 本番環境のトークンは慎重に管理

2. **権限管理**
   - 使用するAPI Tokenには必要最小限の権限のみ付与
   - チーム共有の場合はサービスアカウントを推奨

3. **ログ管理**
   - 認証情報をログに出力しない
   - エラーログにも機密情報を含めない

### パフォーマンス

1. **APIレート制限**
   - Atlassian Cloud APIには時間あたりのリクエスト制限あり
   - 大量のリクエストを送信する場合は注意
   - リトライロジックとバックオフの実装を推奨

2. **ページネーション**
   - 大量のデータ取得時はページネーション対応
   - 適切な `maxResults` パラメータの設定

### 運用

1. **バージョン管理**
   - ConfluenceページのバージョンConflictに注意
   - 更新前に最新バージョンを取得

2. **データ整合性**
   - JIRAのワークフロー制約を考慮
   - 必須フィールドのバリデーション

## ライセンス

社内利用ツールのため、外部公開の予定はありません。

## 開発者向け情報

### 開発環境

**推奨Python バージョン**: 3.9以上

**主要パッケージ（予定）**:
- `mcp` - MCP SDK
- `requests` - HTTP通信
- `python-dotenv` - 環境変数管理
- `atlassian-python-api` - Atlassian API（検討中）
- `markdown` - Markdown変換
- `html2text` - HTML→Markdown変換

### コーディング規約

- PEP 8準拠
- 型ヒント（Type Hints）の使用
- Docstring（Google Style）の記載
- ユニットテストの実装

### コントリビューション

社内ツールのため、改善提案や機能追加はチーム内で議論してください。
