# 環境構築とビルド手順

## 1. 前提条件

- **Node.js** 18以上がインストールされていること
- **npm** または **pnpm** が使えること

## 2. 依存パッケージのインストール

```bash
cd f:\Work\Growi_plugin1
npm install
```

### インストールされるパッケージの説明

| パッケージ | 役割 |
|------------|------|
| `@growi/pluginkit` | Growiプラグイン開発キット（公式） |
| `vite` | ビルドツール（TypeScript→JavaScript変換） |
| `@vitejs/plugin-react` | ViteでReact/JSXをビルドするためのプラグイン |
| `typescript` | TypeScriptコンパイラ |
| `react`, `react-dom` | React（JSX記法を使うために必要） |
| `unified` | Markdownパーサーのコアライブラリ |
| `unist-util-visit` | AST巡回ユーティリティ |

## 3. ビルド

```bash
npm run build
```

> **注意**: 現在の `package.json` にはまだ `scripts.build` がありません。
> 以下のコマンドで直接ビルドできます：
>
> ```bash
> npx vite build
> ```
>
> または `package.json` に以下を追加してください：
> ```json
> "scripts": {
>   "build": "vite build"
> }
> ```

ビルドが成功すると `dist/` フォルダにJavaScriptファイルが生成されます。

## 4. ファイル構成の解説

```
growi-plugin-timer/
  ├── package.json          ... (1) プラグイン設定の中心
  ├── client-entry.tsx      ... (2) プラグインの入口
  ├── src/
  │   └── timer.ts          ... (3) remarkプラグイン本体
  ├── types/
  │   └── utils.ts          ... (4) TypeScript型定義
  ├── tsconfig.json         ... (5) TypeScript設定
  ├── vite.config.ts        ... (6) Viteビルド設定
  ├── docs/                 ... 学習資料
  └── project.md            ... プロジェクト仕様
```

### 各ファイルの関係図

```
[Growiが起動]
    ↓
[client-entry.tsx] を読み込む（エントリポイント）
    ↓
activate() が呼ばれる
    ↓
growiFacade.markdownRenderer に timerPlugin を登録
    ↓
[ユーザーがMarkdownに $timer と書く]
    ↓
Growi内蔵パーサーが AST ノード (leafGrowiPluginDirective, name="timer") を生成
    ↓
[src/timer.ts] の timerPlugin が AST を巡回して該当ノードを発見
    ↓
ノードをストップウォッチのHTMLに置換
    ↓
画面にストップウォッチが表示される！
```

## 5. Growiへのインストール

1. このプロジェクトをGitHubリポジトリにpush
2. Growi管理画面 > 「プラグイン」を開く
3. GitHubリポジトリのURLを入力してインストール
4. ページで `$timer` と書いてみる → ストップウォッチが表示される
