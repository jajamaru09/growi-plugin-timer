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

## 3. Scriptプラグインの仕組み（重要）

### 全体の流れ

```
1. ユーザーがMarkdownに `$timer` と書く
2. Growiの内蔵パーサー（remark-growi-directive）がこれをAST（構文木）ノードに変換
3. あなたのプラグインがそのASTノードを見つけて、HTMLに変換する
4. Growiが変換後のHTMLを画面に表示する
```

### キーワード解説

- **remark**: Markdownを処理するJavaScriptライブラリ群（unified エコシステム）
- **AST（Abstract Syntax Tree）**: Markdownを構造化したデータ。木構造で表現される
- **directive（ディレクティブ）**: `$name(args)` 形式の特殊記法。Growi独自の拡張
- **leafGrowiPluginDirective**: `$timer` のようなディレクティブが変換されるASTノードの型名

### ASTノードの例

ユーザーが `$timer` と書くと、以下のようなASTノードが生成されます：

```json
{
  "type": "leafGrowiPluginDirective",
  "name": "timer",
  "attributes": {}
}
```

## 4. プラグインの必須ファイル構成

```
growi-plugin-timer/
  ├── package.json         ... プラグインの設定（最重要）
  ├── client-entry.tsx     ... プラグインのエントリポイント（Growiが読み込む起点）
  ├── src/
  │   └── timer.ts         ... remarkプラグイン本体（ASTを変換するロジック）
  ├── tsconfig.json        ... TypeScript設定
  └── vite.config.ts       ... ビルド設定（Viteを使用）
```

## 5. package.json の `growiPlugin` フィールド（覚えるべきポイント）

```json
{
  "growiPlugin": {
    "schemaVersion": "4",
    "types": ["script"]
  }
}
```

- **`schemaVersion: "4"`** : 現在のGrowiが認識するバージョン。固定値
- **`types: ["script"]`** : このプラグインがScriptタイプであることを宣言

この `growiPlugin` フィールドがないと、Growiはプラグインとして認識しません。

## 6. プラグイン登録の仕組み（覚えるべきポイント）

プラグインは `window.pluginActivators` というグローバルオブジェクトに自分自身を登録します。

```typescript
// Growiが起動時に window.pluginActivators を走査して、
// 各プラグインの activate() を呼び出す
window.pluginActivators["growi-plugin-timer"] = {
  activate: () => { /* プラグイン初期化処理 */ },
  deactivate: () => { /* クリーンアップ */ },
};
```

### activate() の中でやること

1. `growiFacade.markdownRenderer.optionsGenerators` にアクセス
2. 既存のオプション生成関数を上書き（ラップ）して、自分のremarkプラグインを追加
3. これにより、Markdownレンダリング時に自分のプラグインが呼ばれるようになる

## 7. remarkプラグインの書き方（覚えるべきポイント）

```typescript
import { visit } from 'unist-util-visit';

export const plugin = function() {
  return (tree) => {
    // ASTの全ノードを巡回
    visit(tree, (node) => {
      // 自分が処理すべきノードか判定
      if (node.type !== 'leafGrowiPluginDirective') return;
      if (node.name !== 'timer') return;

      // ノードをHTMLに変換
      node.type = 'html';
      node.value = '<div>ここにストップウォッチのHTMLが入る</div>';
    });
  };
};
```

**ポイント**: `visit` 関数でAST全体を巡回し、`$timer` に対応するノードだけを見つけて変換します。

## 8. Growiへのインストール方法

1. プラグインのコードをGitHubリポジトリにpush
2. Growi管理画面 > プラグイン管理 を開く
3. GitHubリポジトリのURLを入力してインストール
4. Growiが自動でビルド＆有効化

## 9. 参考リンク

- [Growi公式ドキュメント - プラグイン概要](https://docs.growi.org/en/dev/plugin/overview.html)
- [Growi公式ドキュメント - Scriptプラグイン](https://docs.growi.org/en/dev/plugin/script.html)
- [公式ボイラープレート（アーカイブ）](https://github.com/weseek/growi-plugin-boilerplate)
- [YouTubeプラグイン実例](https://github.com/goofmint/growi-plugin-remark-youtube)
- [Growiプラグインギャラリー](https://growi.org/en/plugins)
