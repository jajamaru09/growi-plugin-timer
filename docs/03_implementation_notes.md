# 実装ポイントまとめ

## 覚えるべき5つのポイント

### 1. package.json の `growiPlugin` フィールドが必須
```json
"growiPlugin": {
  "schemaVersion": "4",
  "types": ["script"]
}
```
これがないとGrowiはプラグインとして認識しません。`schemaVersion` は現在 `"4"` 固定です。

### 2. エントリポイントは `client-entry.tsx`
- Growiが最初に読み込むファイル
- `window.pluginActivators` にプラグインを登録する
- `activate()` / `deactivate()` の2つの関数を提供する

### 3. activate() で remarkプラグインを登録する
```typescript
optionsGenerators.customGenerateViewOptions = (...args) => {
  const options = original(...args);
  options.remarkPlugins.push(myPlugin);  // ← ここで追加！
  return options;
};
```
- 閲覧画面用（ViewOptions）とプレビュー用（PreviewOptions）の両方に登録が必要
- 既存の関数を「ラップ」する形で上書きする（デコレータパターン）

### 4. remarkプラグインは「ASTノードの変換」
```typescript
visit(tree, (node) => {
  if (node.type !== 'leafGrowiPluginDirective') return;
  if (node.name !== 'timer') return;
  node.type = 'html';
  node.value = '<div>...</div>';
});
```
- `$timer` → ASTノード `{type: "leafGrowiPluginDirective", name: "timer"}`
- このノードを `{type: "html", value: "..."}` に書き換える
- `visit()` がAST全体を再帰的に巡回してくれる

### 5. ストップウォッチのUIはバニラJSで実装
- remarkプラグインの出力はHTML文字列
- Reactコンポーネントではなく、純粋なHTML + インラインJSで実装
- 各ストップウォッチにユニークIDを付与して、複数配置時も独立動作する

## ストップウォッチの仕様

| 要素 | 説明 |
|------|------|
| **表示** | `00:00` 形式（分:秒） |
| **Start/Stopボタン** | トグル動作。Startで計測開始、Stopで一時停止 |
| **Resetボタン** | タイマーを0に戻し、停止状態にする |

## 応用：引数を受け取るディレクティブ

`$timer` は引数なしですが、例えば `$timer(start=30)` のように引数を渡すことも可能です：

```typescript
visit(tree, (node) => {
  if (node.name !== 'timer') return;
  // node.attributes にパース済みの引数が入る
  // 例: $timer(start=30) → node.attributes = { start: "30" }
  const startValue = parseInt(node.attributes?.start || "0", 10);
});
```

## トラブルシューティング

| 問題 | 原因と対処 |
|------|------------|
| $timer がそのまま表示される | プラグインが読み込まれていない → Growi管理画面で有効化を確認 |
| ビルドエラー | `npm install` が完了しているか確認 |
| ストップウォッチが動かない | ブラウザのコンソールでJSエラーを確認 |
