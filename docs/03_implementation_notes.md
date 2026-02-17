# 実装ポイントまとめ

## 覚えるべき7つのポイント

### 1. package.json の必須フィールド

```json
{
  "type": "module",
  "keywords": ["growi", "growi-plugin"],
  "growiPlugin": {
    "schemaVersion": "4",
    "types": ["script"]
  }
}
```

| フィールド | 重要度 | 説明 |
|-----------|--------|------|
| `type: "module"` | **必須** | 全動作プラグインに存在。ESモジュール形式の宣言 |
| `keywords` | 推奨 | Growiがプラグインを識別するキーワード |
| `growiPlugin` | **必須** | これがないとGrowiはプラグインとして認識しない |

### 2. エントリポイントは `client-entry.tsx`

- Growiがビルド済みJSを読み込む際の起点
- `window.pluginActivators` にプラグインを登録する
- `activate()` / `deactivate()` の2つの関数を提供する
- Growiは `dist/.vite/manifest.json` → ビルド済みJS → `window.pluginActivators` の順で読み込む

### 3. activate() で remarkプラグインを登録する

```typescript
optionsGenerators.customGenerateViewOptions = (...args) => {
  const options = original(...args);
  options.remarkPlugins.push(myPlugin);  // ← ここで追加！
  return options;
};
```

- **閲覧画面用**（customGenerateViewOptions）と**プレビュー用**（customGeneratePreviewOptions）の両方に登録が必要
- 既存の関数を「ラップ」する形で上書きする（デコレータパターン）

### 4. rehype-sanitize によるHTMLサニタイズ（最大の落とし穴）

Growiは `rehype-sanitize` でHTMLをサニタイズします。以下のものは**除去されます**：

| 除去されるもの | 例 |
|---------------|-----|
| `<script>` タグ | `<script>alert('hi')</script>` |
| インライン `style` 属性 | `<div style="color:red">` |
| 未知のタグ名 | `<my-timer>`, `<lsx>`（ホワイトリストがなければ） |

**安全に通過するもの:**
- `<div>`, `<span>`, `<button>`, `<iframe>` 等の標準タグ
- `class` 属性
- `data-*` 属性（カスタムデータ属性）

### 5. 内蔵プラグイン vs 外部プラグインの違い

| | 内蔵プラグイン（lsx等） | 外部プラグイン（timer等） |
|---|---|---|
| コード配置 | Growiモノレポ内 | 独立したGitHubリポジトリ |
| sanitize設定 | `sanitizeOption` をエクスポートしてマージ可能 | 変更不可 |
| React描画方式 | `components.tagName = Component` でマッピング | MutationObserver + ReactDOM.createRoot() |
| カスタムタグ | 使える（`<lsx>` 等） | 使えない（サニタイズで除去される） |

### 6. data.hName / data.hProperties パターン

```typescript
node.data = {
  hName: 'div',
  hProperties: { 'data-growi-plugin-timer': 'true' },
};
```

- unified エコシステムの**標準的な仕組み**
- MDAST → HAST 変換時に `data.hName` がHTMLタグ名になる
- `data.hProperties` がHTMLの属性になる
- `node.type = 'html'` + `node.value = '...'` よりも安全で制御しやすい

### 7. MutationObserver + ReactDOM による動的マウント

```typescript
const observer = new MutationObserver(() => {
  document.querySelectorAll('div[data-growi-plugin-timer]').forEach(mountStopwatch);
});
observer.observe(document.body, { childList: true, subtree: true });
```

- Growiは SPA（Single Page Application）なのでページ遷移時にDOMが動的に変わる
- MutationObserver がDOMの変更を監視し、プレースホルダー要素を検知
- `ReactDOM.createRoot(container).render(...)` で React コンポーネントをマウント
- `dataset.timerMounted` フラグで二重マウントを防止

## ストップウォッチの仕様

| 要素 | 説明 |
|------|------|
| **表示** | `00:00` 形式（分:秒） |
| **Start/Stopボタン** | トグル動作。Startで計測開始、Stopで一時停止 |
| **Resetボタン** | タイマーを0に戻し、停止状態にする |

## 開発中に遭遇した問題と解決策

### 問題1: `$timer` が空の `<div></div>` になる

**原因**: `<script>` タグとインライン `style` 属性が rehype-sanitize で除去されていた

**解決**: remarkプラグインではプレースホルダーの `<div>` のみ出力し、
JSの動作は client-entry.tsx 側で MutationObserver + ReactDOM.createRoot() を使って後付け

### 問題2: プラグインが Growi に読み込まれない

**原因（複合）**:
1. `.gitignore` に `dist/` が入っていた → ビルド成果物がGitHubにpushされない
2. `package.json` に `"type": "module"` がなかった
3. `react` 等が `devDependencies` に入っていた（`dependencies` が正しい）
4. vite.config.ts の input パスが `'client-entry.tsx'` だった（`'/client-entry.tsx'` が正しい）
5. `tsconfig.node.json` が存在しなかった

**解決**: 動作している外部プラグイン（youtube, datatables, script-template）のファイル構成と
完全に一致するよう全設定ファイルを修正

## 応用：引数を受け取るディレクティブ

`$timer` は引数なしですが、例えば `$timer(start=30)` のように引数を渡すことも可能です：

```typescript
visit(tree, (node) => {
  if (node.name !== 'timer') return;
  // node.attributes にパース済みの引数が入る
  // 例: $timer(start=30) → node.attributes = { start: "30" }
  const startValue = parseInt(node.attributes?.start || "0", 10);
  node.data = {
    hName: 'div',
    hProperties: {
      'data-growi-plugin-timer': 'true',
      'data-start': String(startValue),
    },
  };
});
```

## トラブルシューティング

| 問題 | 原因と対処 |
|------|------------|
| `$timer` がそのまま表示される | プラグインが有効化されていない → Growi管理画面で確認 |
| `$timer` が空の div になる | サニタイズで内容が除去されている → data.hName + MutationObserver 方式を使う |
| プラグインが読み込まれない | `dist/` がGitHubにpushされているか確認。`manifest.json` が存在するか確認 |
| ビルドエラー | `npm install` が完了しているか確認。`tsconfig.node.json` が存在するか確認 |
| ストップウォッチが動かない | ブラウザの開発者ツール > Console でJSエラーを確認 |
| プラグイン更新が反映されない | Growiで一度プラグインを削除してから再インストール |
