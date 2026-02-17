/**
 * client-entry.tsx - Growiプラグインのエントリポイント（修正版v2）
 *
 * 【lsxプラグインの方式を参考にした設計】
 *
 * lsx（Growi内蔵）の場合:
 *   remarkPlugin → data.hName='lsx' → components.lsx = LsxComponent
 *   → react-markdown が <lsx> タグを React コンポーネントとして描画
 *
 * 外部プラグイン（このプラグイン）の場合:
 *   サニタイズ設定を変更できないため、カスタムタグ名は使えない。
 *   代わりに以下の方式を使う:
 *
 *   remarkPlugin → data.hName='div' + data-growi-plugin-timer 属性
 *   → サニタイザーを通過（div と data-* は標準で許可される）
 *   → MutationObserver が div[data-growi-plugin-timer] を検知
 *   → ReactDOM.createRoot() で Stopwatch コンポーネントをマウント
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import config from './package.json';
import { timerPlugin } from './src/timer';
import { Stopwatch } from './src/Stopwatch';
import type { Options, Func, ViewOptions } from './types/utils';

declare const growiFacade: {
  markdownRenderer?: {
    optionsGenerators: {
      customGenerateViewOptions: (path: string, options: Options, toc: Func) => ViewOptions;
      generateViewOptions: (path: string, options: Options, toc: Func) => ViewOptions;
      generatePreviewOptions: (path: string, options: Options, toc: Func) => ViewOptions;
      customGeneratePreviewOptions: (path: string, options: Options, toc: Func) => ViewOptions;
    };
  };
};

/**
 * 指定した要素に Stopwatch React コンポーネントをマウントする
 */
function mountStopwatch(container: HTMLElement): void {
  // 既にマウント済みならスキップ
  if (container.dataset.timerMounted === 'true') return;
  container.dataset.timerMounted = 'true';

  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(Stopwatch));
}

/**
 * DOM を監視し、timer プレースホルダーが現れたら React をマウント
 *
 * MutationObserver は DOM の変更をリアルタイムで監視する Web API。
 * Growi は SPA なのでページ遷移時にも新しい要素が追加される。
 * それを検知して自動的にストップウォッチをマウントする。
 */
function observeAndMount(): void {
  const selector = 'div[data-growi-plugin-timer]';

  // 既に存在する要素に対応
  document.querySelectorAll<HTMLElement>(selector).forEach(mountStopwatch);

  // 今後追加される要素を監視
  const observer = new MutationObserver(() => {
    document.querySelectorAll<HTMLElement>(selector).forEach(mountStopwatch);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// --- プラグイン登録 ---
const activate = (): void => {
  if (growiFacade == null || growiFacade.markdownRenderer == null) {
    return;
  }

  const { optionsGenerators } = growiFacade.markdownRenderer;

  // ページ閲覧画面への登録
  const originalCustomViewOptions = optionsGenerators.customGenerateViewOptions;
  optionsGenerators.customGenerateViewOptions = (...args) => {
    const options = originalCustomViewOptions
      ? originalCustomViewOptions(...args)
      : optionsGenerators.generateViewOptions(...args);
    options.remarkPlugins.push(timerPlugin as any);
    return options;
  };

  // プレビュー画面への登録
  const originalGeneratePreviewOptions = optionsGenerators.customGeneratePreviewOptions;
  optionsGenerators.customGeneratePreviewOptions = (...args) => {
    const preview = originalGeneratePreviewOptions
      ? originalGeneratePreviewOptions(...args)
      : optionsGenerators.generatePreviewOptions(...args);
    preview.remarkPlugins.push(timerPlugin as any);
    return preview;
  };

  // DOM 監視を開始
  observeAndMount();
};

const deactivate = (): void => {};

if ((window as any).pluginActivators == null) {
  (window as any).pluginActivators = {};
}
(window as any).pluginActivators[config.name] = {
  activate,
  deactivate,
};
