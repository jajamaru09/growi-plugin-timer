# Growiプラグイン開発ガイド

## 1. Growiプラグインとは？

Growiは OSS の Wiki ツールで、**プラグインによって機能を拡張**できます。
プラグインはGitHubリポジトリとして配布され、Growi管理画面からURLを指定してインストールします。

## 2. プラグインの3つのタイプ

| タイプ | 用途 | 実体 |
|--------|------|------|
| **Script** | Markdownレンダリング拡張、UI追加 | TypeScript + Vite でビルドしたJS |
| **Template** | 再利用可能なページテンプレート | meta.json + Markdownファイル |
| **Theme** | 見た目のカスタマイズ | SCSS/CSS |

今回作るのは **Script タイプ** です。

## 3. プラグインのバージョン体系

| schemaVersion | 時期 | 特徴 |
|---------------|------|------|
| 3 (旧) | Growi v4以前 | `meta.js` + Interceptorパターン。`growilabs/growi-plugin-lsx` がこの形式 |
| **4 (現行)** | Growi v6+ | `package.json` の `growiPlugin` フィールド + Viteビルド + `client-entry.tsx` |

**重要**: `growilabs/growi-plugin-lsx` リポジトリはschemaVersion 3の旧形式です。
現行のschemaVersion 4 プラグインの参考には **`goofmint/growi-plugin-remark-youtube`** や
**`growilabs/growi-plugin-datatables`** を使いましょう。

## 4. Scriptプラグインの仕組み（重要）

### Growi内蔵プラグイン（lsx等）の場合

```
$lsx(/path)
  → remark-growi-directive がASTノードに変換
  → remarkPlugin が data.hName='lsx', data.hProperties={prefix:'/path'} を設定
  → remark-rehype が <lsx prefix="/path"> HAST要素に変換
  → rehype-sanitize が sanitizeOption で <lsx> タグを許可
  → react-markdown の components.lsx = LsxComponent でReactコンポーネントに変換
  → 画面に表示
```

### 外部プラグイン（このtimerプラグイン等）の場合

外部プラグインは rehype-sanitize の設定を直接変更できないため、
カスタムタグ名は使えない。代わりに以下の方式を取る：

```
$timer
  → remark-growi-directive がASTノードに変換
  → remarkPlugin が data.hName='div', data.hProperties={'data-growi-plugin-timer':'true'} を設定
  → remark-rehype が <div data-growi-plugin-timer="true"> に変換
  → rehype-sanitize を通過（div と data-* 属性は標準で許可されるため）
  → client-entry.tsx の MutationObserver が <div data-growi-plugin-timer> を検知
  → ReactDOM.createRoot() で Stopwatch コンポーネントをマウント
  → 画面に表示
```

### キーワード解説

- **remark**: Markdownを処理するJavaScriptライブラリ群（unified エコシステム）
- **AST（Abstract Syntax Tree）**: Markdownを構造化したデータ。木構造で表現される
- **MDAST**: Markdown AST。remarkが扱うAST形式
- **HAST**: HTML AST。rehypeが扱うAST形式。MDSTからHASTへの変換を remark-rehype が行う
- **directive（ディレクティブ）**: `$name(args)` 形式の特殊記法。Growi独自の拡張
- **leafGrowiPluginDirective**: `$timer` のようなディレクティブが変換されるASTノードの型名
- **rehype-sanitize**: HTMLをサニタイズするライブラリ。`<script>` 等の危険なタグを除去する
- **data.hName / data.hProperties**: MDAST→HAST変換時の出力タグ名・属性を制御するunified標準の仕組み
- **MutationObserver**: DOMの変更をリアルタイム監視するWeb API

### ASTノードの例

ユーザーが `$timer` と書くと、以下のようなASTノードが生成されます：

```json
{
  "type": "leafGrowiPluginDirective",
  "name": "timer",
  "attributes": {}
}
```

## 5. プラグインのファイル構成（実際の動作確認済み構成）

```
growi-plugin-timer/
  ├── package.json          ... プラグイン設定（最重要）
  ├── client-entry.tsx      ... エントリポイント（Growiが読み込む起点）
  ├── src/
  │   ├── timer.ts          ... remarkプラグイン（ASTノードを変換）
  │   └── Stopwatch.tsx     ... Reactコンポーネント（ストップウォッチUI）
  ├── types/
  │   └── utils.ts          ... TypeScript型定義（Growiが提供する型）
  ├── dist/                 ... ビルド成果物（GitHubにpush必須！）
  │   ├── .vite/
  │   │   └── manifest.json ... Growiがビルド成果物を見つけるための索引
  │   └── assets/
  │       └── client-entry-xxx.js ... ビルド済みJavaScript
  ├── tsconfig.json         ... TypeScript設定
  ├── tsconfig.node.json    ... Vite設定ファイル用TypeScript設定
  └── vite.config.ts        ... Viteビルド設定
```

## 6. package.json の必須フィールド（覚えるべきポイント）

```json
{
  "name": "growi-plugin-timer",
  "type": "module",
  "keywords": ["growi", "growi-plugin"],
  "growiPlugin": {
    "schemaVersion": "4",
    "types": ["script"]
  }
}
```

- **`"type": "module"`** : ESモジュール形式を宣言。全動作プラグインに存在する必須項目
- **`"keywords": ["growi", "growi-plugin"]`** : Growiがプラグインを識別するためのキーワード
- **`"growiPlugin.schemaVersion": "4"`** : 現在のGrowiが認識するバージョン。固定値
- **`"growiPlugin.types": ["script"]`** : このプラグインがScriptタイプであることを宣言

### dependencies vs devDependencies の配置ルール

| 配置先 | パッケージ | 理由 |
|--------|-----------|------|
| **dependencies** | react, react-dom, unified, unist-util-visit | プラグインの実行時に必要 |
| **devDependencies** | typescript, vite, @vitejs/plugin-react, @types/* | ビルド時のみ必要 |

**注意**: `@growi/pluginkit` は動作している外部プラグインでは使用されていません。

## 7. プラグイン登録の仕組み（覚えるべきポイント）

プラグインは `window.pluginActivators` というグローバルオブジェクトに自分自身を登録します。

```typescript
window.pluginActivators["growi-plugin-timer"] = {
  activate: () => { /* プラグイン初期化処理 */ },
  deactivate: () => { /* クリーンアップ */ },
};
```

### activate() の中でやること

1. `growiFacade.markdownRenderer.optionsGenerators` にアクセス
2. 既存のオプション生成関数を上書き（ラップ）して、自分のremarkプラグインを追加
3. **動的コンテンツの場合**: MutationObserver を起動してDOMを監視

## 8. remarkプラグインの書き方（覚えるべきポイント）

### 方式1: 静的HTML（iframe埋め込み等）→ YouTubeプラグインの方式

```typescript
visit(tree, (node) => {
  if (node.type !== 'leafGrowiPluginDirective') return;
  if (node.name !== 'youtube') return;
  node.type = 'html';
  node.value = '<iframe src="..."></iframe>';
});
```

**制約**: `<script>` タグ、インライン `style` 属性はサニタイズで除去される。
`<div>`, `<iframe>` 等の標準タグのみ使用可能。

### 方式2: 動的コンテンツ（React）→ このtimerプラグインの方式

```typescript
visit(tree, (node) => {
  if (node.type !== 'leafGrowiPluginDirective') return;
  if (node.name !== 'timer') return;
  // data.hName/hProperties でHAST変換を制御
  node.data = {
    hName: 'div',
    hProperties: { 'data-growi-plugin-timer': 'true' },
  };
});
```

→ client-entry.tsx 側で MutationObserver + ReactDOM.createRoot() でマウント

## 9. Growiへのインストール方法

1. **ローカルでビルド**: `npm run build` → `dist/` にJS生成
2. **dist/ を含めてGitHubにpush**（Growiはcloneするだけでビルドしない）
3. Growi管理画面 > プラグイン管理 を開く
4. GitHubリポジトリのURLを入力してインストール
5. トグルスイッチで有効化

**重要**: Growiはリポジトリをcloneした後、`dist/.vite/manifest.json` を読んで
ビルド済みJSファイルのパスを特定します。`dist/` がリポジトリに含まれていないと
プラグインは読み込まれません。

## 10. 参考リンク

### 動作確認済みの外部プラグイン（schemaVersion 4）
- [YouTubeプラグイン](https://github.com/goofmint/growi-plugin-remark-youtube) - 最もシンプルな実装例
- [DataTablesプラグイン](https://github.com/growilabs/growi-plugin-datatables) - componentsラップの実装例
- [Script Templateプラグイン](https://github.com/goofmint/growi-plugin-script-template) - テンプレート

### 公式ドキュメント
- [プラグイン概要](https://docs.growi.org/en/dev/plugin/overview.html)
- [Scriptプラグイン](https://docs.growi.org/en/dev/plugin/script.html)
- [Growiプラグインギャラリー](https://growi.org/en/plugins)

### 旧形式（参考のみ）
- [growi-plugin-lsx](https://github.com/growilabs/growi-plugin-lsx) - schemaVersion 3（旧形式）。現行v6+のlsxはGrowiモノレポ内の `packages/remark-lsx` に移行済み
