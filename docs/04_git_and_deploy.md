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

## 2. .gitignore の作成

ビルド成果物や `node_modules` をGitの追跡対象から除外します。

```bash
# .gitignore ファイルを作成
```

以下の内容で `.gitignore` を作成してください：

```
node_modules/
dist/
*.log
```

> **ポイント**: `dist/` を除外するかどうかはプロジェクトによります。
> Growiはプラグインインストール時にサーバー側でビルドするため、
> `dist/` はリポジトリに含めなくてもOKです。
> ただし、Growi側のビルド環境に問題がある場合は `dist/` を含めることもあります。

## 3. コミット

```bash
# すべてのファイルをステージング
git add .

# 状態を確認（コミット対象を確認する習慣をつけましょう）
git status

# 初回コミット
git commit -m "Initial commit: growi-plugin-timer"
```

## 4. GitHubにリポジトリを作成

### 方法A: GitHub CLI（gh）を使う場合

```bash
# GitHub CLIがインストール済みで認証済みの場合
gh repo create growi-plugin-timer --public --source=. --push
```

これだけで、リポジトリ作成 → リモート設定 → push まで一括で完了します。

### 方法B: 手動で行う場合

1. ブラウザで https://github.com/new を開く
2. Repository name に `growi-plugin-timer` と入力
3. Public を選択
4. 「Create repository」をクリック
5. 以下のコマンドを実行：

```bash
# リモートリポジトリを登録（URLは自分のものに置き換え）
git remote add origin https://github.com/あなたのユーザー名/growi-plugin-timer.git

# メインブランチ名を main に設定
git branch -M main

# プッシュ
git push -u origin main
```

## 5. （推奨）GitHubトピックの設定

Growiプラグインギャラリーに掲載されるよう、リポジトリにトピックを付けます。

### GitHub CLI の場合

```bash
gh repo edit --add-topic growi-plugin
```

### 手動の場合

1. GitHubのリポジトリページを開く
2. 右上の歯車アイコン（About欄）をクリック
3. Topics に `growi-plugin` と入力して保存

## 6. Growiにプラグインをインストール

### 手順

1. Growiに**管理者アカウント**でログイン
2. 左メニューまたはURL直接で **管理画面** を開く
   - URL例: `https://your-growi.example.com/admin`
3. サイドバーから **「プラグイン」** を選択
4. 「GitHub URL」の入力欄に、リポジトリのURLを入力：
   ```
   https://github.com/あなたのユーザー名/growi-plugin-timer
   ```
5. **「インストール」** ボタンをクリック
6. Growiがリポジトリをclone → `npm install` → ビルドを自動実行
7. インストール完了後、プラグイン一覧に表示される
8. トグルスイッチで**有効化**する

### 動作確認

1. 任意のWikiページを開く（または新規作成）
2. 編集画面で以下を入力：
   ```markdown
   # ストップウォッチテスト

   $timer
   ```
3. プレビューまたはページ閲覧画面で、ストップウォッチが表示されることを確認
4. Start/Stop ボタン、Reset ボタンが正常に動作することを確認

## トラブルシューティング

| 問題 | 対処 |
|------|------|
| インストールボタンが無い | 管理者アカウントでログインしているか確認 |
| インストールがエラーになる | リポジトリがPublicか確認。Privateの場合はGrowiにGitHubトークンの設定が必要 |
| プラグインが一覧に出ない | `package.json` の `growiPlugin` フィールドが正しいか確認 |
| `$timer` がそのまま表示される | プラグインが有効化されているか確認。ページをリロードしてみる |
| ビルドエラーが出る | Growiサーバーの Node.js バージョンが18以上か確認 |

## コマンドまとめ（コピペ用）

```bash
# --- Git初期化 & コミット ---
cd f:\Work\Growi_plugin1
git init
git add .
git commit -m "Initial commit: growi-plugin-timer"

# --- GitHub にアップロード（gh CLI） ---
gh repo create growi-plugin-timer --public --source=. --push
gh repo edit --add-topic growi-plugin
```
