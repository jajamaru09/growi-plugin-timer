/**
 * client-entry.tsx - Growiプラグインのエントリポイント
 *
 * 【このファイルの役割】
 * Growiがプラグインを読み込む際の「入口」です。
 * 1. activate() : プラグイン有効化時に呼ばれる。remarkプラグインを登録する
 * 2. deactivate() : プラグイン無効化時に呼ばれる（今回は何もしない）
 *
 * 【仕組み】
 * Growiは起動時に window.pluginActivators を走査し、
 * 各プラグインの activate() を呼び出します。
 * activate() の中で、Markdownレンダラーのオプションに
 * 自作のremarkプラグインを追加（push）します。
 */

import config from './package.json';
import { timerPlugin } from './src/timer';
import type { Options, Func, ViewOptions } from './types/utils';

// Growiが提供するグローバルオブジェクトの型宣言
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
 * プラグイン有効化関数
 * Growiがこの関数を呼ぶことで、timerプラグインがMarkdownレンダリングに組み込まれる
 */
const activate = (): void => {
  // growiFacade が存在しない場合は何もしない（安全ガード）
  if (growiFacade == null || growiFacade.markdownRenderer == null) {
    return;
  }

  const { optionsGenerators } = growiFacade.markdownRenderer;

  // --- ページ閲覧画面（View）への登録 ---
  // 既存のオプション生成関数を保存しておく
  const originalCustomViewOptions = optionsGenerators.customGenerateViewOptions;
  // 新しい関数で上書き：既存の処理 + timerPluginを追加
  optionsGenerators.customGenerateViewOptions = (...args) => {
    const options = originalCustomViewOptions
      ? originalCustomViewOptions(...args)
      : optionsGenerators.generateViewOptions(...args);
    // remarkPlugins配列に自作プラグインを追加
    options.remarkPlugins.push(timerPlugin as any);
    return options;
  };

  // --- プレビュー画面（編集中のプレビュー）への登録 ---
  const originalGeneratePreviewOptions = optionsGenerators.customGeneratePreviewOptions;
  optionsGenerators.customGeneratePreviewOptions = (...args) => {
    const preview = originalGeneratePreviewOptions
      ? originalGeneratePreviewOptions(...args)
      : optionsGenerators.generatePreviewOptions(...args);
    preview.remarkPlugins.push(timerPlugin as any);
    return preview;
  };
};

/**
 * プラグイン無効化関数（今回は特にクリーンアップ不要）
 */
const deactivate = (): void => {};

// --- Growiのプラグインシステムに自分自身を登録 ---
if ((window as any).pluginActivators == null) {
  (window as any).pluginActivators = {};
}
(window as any).pluginActivators[config.name] = {
  activate,
  deactivate,
};
