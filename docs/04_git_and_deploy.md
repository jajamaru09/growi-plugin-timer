# Git設定・GitHubアップロード・Growiインストール手順

## 1. Gitリポジトリの初期化

```bash
cd f:\Work\Growi_plugin1

# Gitリポジトリを作成
git init

# ユーザー情報の設定（未設定の場合のみ）
git config user.name "あなたのユーザー名"
git config user.email "your-email@example.com"
```

## 2. .gitignore の設定

```
node_modules/
*.log
```

**重要: `dist/` は含めないこと！**

Growiはリポジトリをcloneした後、サーバー側で `npm install` や `npm run build` を**実行しません**。
`dist/.vite/manifest.json` を読んでビルド済みJSのパスを特定し、そのファイルをブラウザに配信します。
そのため `dist/` がリポジトリに含まれていないとプラグインは動作しません。

動作している全プラグイン（youtube, datatables, script-template）が `dist/` をコミットしています。

## 3. ビルドしてからコミット

```bash
# ビルド（dist/ を生成）
npm run build

# すべてのファイルをステージング
git add .

# 状態を確認（dist/ が含まれていることを確認！）
git status

# コミット
git commit -m "Initial commit: growi-plugin-timer"
```

**確認ポイント**: `git status` で以下のファイルが含まれていること
- `dist/.vite/manifest.json`
- `dist/assets/client-entry-xxxxx.js`

## 4. GitHubにリポジトリを作成

### 方法A: GitHub CLI（gh）を使う場合

```bash
gh repo create growi-plugin-timer --public --source=. --push
```

### 方法B: 手動で行う場合

1. ブラウザで https://github.com/new を開く
2. Repository name に `growi-plugin-timer` と入力
3. Public を選択して「Create repository」
4. 以下を実行：

```bash
git remote add origin https://github.com/あなたのユーザー名/growi-plugin-timer.git
git branch -M main
git push -u origin main
```

## 5. （推奨）GitHubトピックの設定

Growiプラグインギャラリーに掲載されるよう、リポジトリにトピックを付けます。

```bash
# GitHub CLI の場合
gh repo edit --add-topic growi-plugin
```

手動の場合: GitHubリポジトリページ → About欄の歯車 → Topics に `growi-plugin` と入力

## 6. Growiにプラグインをインストール

1. Growiに**管理者アカウント**でログイン
2. 管理画面（`/admin`）→ サイドバーの **「プラグイン」**
3. 「GitHub URL」にリポジトリURLを入力してインストール
4. プラグイン一覧に表示されたら、トグルスイッチで**有効化**

### 動作確認

1. 任意のWikiページを編集
2. `$timer` と入力
3. プレビューまたは閲覧画面でストップウォッチが表示されることを確認

## 7. プラグインを更新した場合

ソースコード修正後の更新手順：

```bash
# 1. ビルド
npm run build

# 2. コミット＆プッシュ
git add .
git commit -m "更新内容の説明"
git push
```

3. Growi管理画面でプラグインを**一度削除**してから**再インストール**

## トラブルシューティング

| 問題 | 対処 |
|------|------|
| インストールボタンが無い | 管理者アカウントでログインしているか確認 |
| インストールがエラーになる | リポジトリがPublicか確認。Privateの場合はGrowiにGitHubトークンの設定が必要 |
| プラグインが一覧に出ない | `package.json` の `growiPlugin` フィールドが正しいか確認 |
| `$timer` がそのまま表示される | プラグインが有効化されているか確認。ページをリロード |
| 更新が反映されない | プラグインを削除→再インストール。ブラウザのキャッシュもクリア |

## コマンドまとめ（コピペ用）

```bash
# --- ビルド ---
npm run build

# --- Git初期化 & コミット ---
git init
git add .
git commit -m "Initial commit: growi-plugin-timer"

# --- GitHub にアップロード（gh CLI） ---
gh repo create growi-plugin-timer --public --source=. --push
gh repo edit --add-topic growi-plugin
```
