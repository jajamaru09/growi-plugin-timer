# 環境構築とビルド手順

## 1. 前提条件

- **Node.js** 18以上がインストールされていること
- **npm** が使えること（動作プラグインの多くは yarn を使用しているが npm でも可）

## 2. 依存パッケージのインストール

```bash
npm install
```

### パッケージの説明

#### dependencies（実行時に必要）

| パッケージ | 役割 |
|------------|------|
| `react` | UIコンポーネントの描画（Stopwatch.tsx で使用） |
| `react-dom` | ReactコンポーネントをDOMにマウント（createRoot で使用） |
| `unified` | Markdownパーサーのコアライブラリ（remarkプラグインの型定義に必要） |
| `unist-util-visit` | AST巡回ユーティリティ（visit関数を提供） |

#### devDependencies（ビルド時のみ必要）

| パッケージ | 役割 |
|------------|------|
| `typescript` | TypeScriptコンパイラ（型チェック用。ビルドはViteが担当） |
| `vite` | ビルドツール（TypeScript→JavaScript変換、バンドル） |
| `@vitejs/plugin-react` | ViteでReact/JSXをビルドするためのプラグイン |
| `@types/react` | Reactの型定義 |
| `@types/react-dom` | ReactDOMの型定義 |

**注意**: `@growi/pluginkit` は動作している外部プラグインでは使われていません。不要です。

## 3. ビルド

```bash
npm run build
```

内部で `tsc && vite build` が実行されます：
1. `tsc` : TypeScriptの型チェック（エラーがあればここで止まる）
2. `vite build` : バンドル生成 → `dist/` に出力

### ビルド成果物

```
dist/
  ├── .vite/
  │   └── manifest.json    ... Growiがエントリポイントを見つけるための索引
  └── assets/
      └── client-entry-xxxxx.js  ... バンドルされたJavaScript（1ファイル）
```

**`manifest.json` の中身（例）:**
```json
{
  "client-entry.tsx": {
    "file": "assets/client-entry-BQTVaxj0.js",
    "name": "client-entry",
    "src": "client-entry.tsx",
    "isEntry": true
  }
}
```

Growiはこの `manifest.json` を読んで `assets/client-entry-xxxxx.js` を特定し、
ブラウザに配信します。

## 4. ファイル構成の解説

```
growi-plugin-timer/
  ├── package.json          ... (1) プラグイン設定の中心
  ├── client-entry.tsx      ... (2) プラグインの入口（activate/deactivate）
  ├── src/
  │   ├── timer.ts          ... (3) remarkプラグイン（AST変換）
  │   └── Stopwatch.tsx     ... (4) Reactコンポーネント（UI）
  ├── types/
  │   └── utils.ts          ... (5) Growi側の型定義
  ├── dist/                 ... (6) ビルド成果物（GitHubにpush必須！）
  ├── tsconfig.json         ... (7) TypeScript設定（メイン）
  ├── tsconfig.node.json    ... (8) TypeScript設定（Vite設定用）
  └── vite.config.ts        ... (9) Viteビルド設定
```

### 各ファイルの関係図

```
[Growiがプラグインをインストール]
    ↓
[dist/.vite/manifest.json] を読む → ビルド済みJSのパスを特定
    ↓
[dist/assets/client-entry-xxx.js] をブラウザに配信
    ↓
window.pluginActivators に登録 → Growiが activate() を呼ぶ
    ↓
activate() 内で:
  (A) remarkPlugins に timerPlugin を追加
  (B) MutationObserver でDOM監視を開始
    ↓
[ユーザーがMarkdownに $timer と書く]
    ↓
(A) のtimerPlugin が AST を巡回 → <div data-growi-plugin-timer> に変換
    ↓
rehype-sanitize を通過（div + data-* は安全なので許可される）
    ↓
(B) のMutationObserver が <div data-growi-plugin-timer> を検知
    ↓
ReactDOM.createRoot() で Stopwatch コンポーネントをマウント
    ↓
画面にストップウォッチが表示される！
```

## 5. 設定ファイルの詳細

### tsconfig.json のポイント

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Node",
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

- **`noEmit: true`** : tsc はビルド（JS出力）しない。型チェックのみ行う。実際のビルドはViteが担当
- **`jsx: "react-jsx"`** : React 17+の新しいJSX変換を使用
- **`references`** : `tsconfig.node.json` を参照。Vite設定ファイル用の別設定

### vite.config.ts のポイント

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    manifest: true,
    rollupOptions: {
      input: ['/client-entry.tsx'],
    },
  },
});
```

- **`manifest: true`** : `dist/.vite/manifest.json` を生成。Growiがビルド成果物を見つけるために必須
- **`input: ['/client-entry.tsx']`** : エントリポイントの指定。先頭の `/` が必要（動作プラグインと同じ形式）

## 6. .gitignore について（重要な落とし穴）

```
node_modules/
*.log
```

**`dist/` は .gitignore に入れてはいけません！**

Growiはリポジトリをcloneするだけで、サーバー側で `npm install` や `npm run build` は実行しません。
そのため `dist/` 内のビルド済みJSがリポジトリに含まれている必要があります。

動作している全プラグイン（youtube, datatables, script-template）が `dist/` をコミットしています。

## 7. Growiへのインストール

1. このプロジェクトをGitHubリポジトリにpush（**dist/ を含めること**）
2. Growi管理画面 > 「プラグイン」を開く
3. GitHubリポジトリのURLを入力してインストール
4. ページで `$timer` と書いてみる → ストップウォッチが表示される
