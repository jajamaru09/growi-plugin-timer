/**
 * client-entry.tsx - Growiプラグインのエントリポイント
 *
 * 【修正版】
 * Growiはセキュリティのため <script> タグをサニタイズします。
 * そこで、ストップウォッチの動作（JavaScript）は
 * remarkプラグイン側ではなく、こちら（client-entry）で付与します。
 *
 * 方式：MutationObserver でDOMを監視し、
 * .growi-plugin-timer 要素が現れたらイベントリスナーを設定する
 */

import config from './package.json';
import { timerPlugin } from './src/timer';
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

// --- ストップウォッチのCSS（<style>タグとしてheadに注入） ---
function injectStyles(): void {
  if (document.getElementById('growi-plugin-timer-style')) return;

  const style = document.createElement('style');
  style.id = 'growi-plugin-timer-style';
  style.textContent = `
    .growi-plugin-timer {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      background: #f8f9fa;
      font-family: 'Courier New', Consolas, monospace;
      margin: 4px 0;
    }
    .growi-timer-display {
      font-size: 1.5em;
      font-weight: bold;
      min-width: 5ch;
      text-align: center;
    }
    .growi-timer-toggle,
    .growi-timer-reset {
      padding: 4px 12px;
      border: 1px solid;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      font-size: 0.9em;
    }
    .growi-timer-toggle {
      background: #28a745;
      border-color: #28a745;
    }
    .growi-timer-toggle.running {
      background: #dc3545;
      border-color: #dc3545;
    }
    .growi-timer-reset {
      background: #6c757d;
      border-color: #6c757d;
    }
  `;
  document.head.appendChild(style);
}

// --- ストップウォッチのJS動作を要素に付与 ---
function attachTimerBehavior(container: HTMLElement): void {
  // 既に初期化済みならスキップ
  if (container.dataset.timerInitialized === 'true') return;
  container.dataset.timerInitialized = 'true';

  const display = container.querySelector('.growi-timer-display') as HTMLElement | null;
  const toggleBtn = container.querySelector('.growi-timer-toggle') as HTMLButtonElement | null;
  const resetBtn = container.querySelector('.growi-timer-reset') as HTMLButtonElement | null;

  if (!display || !toggleBtn || !resetBtn) return;

  let seconds = 0;
  let interval: ReturnType<typeof setInterval> | null = null;
  let running = false;

  function formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function updateDisplay(): void {
    if (display) display.textContent = formatTime(seconds);
  }

  toggleBtn.addEventListener('click', () => {
    if (running) {
      if (interval) clearInterval(interval);
      interval = null;
      running = false;
      toggleBtn.textContent = 'Start';
      toggleBtn.classList.remove('running');
    } else {
      running = true;
      toggleBtn.textContent = 'Stop';
      toggleBtn.classList.add('running');
      interval = setInterval(() => {
        seconds++;
        updateDisplay();
      }, 1000);
    }
  });

  resetBtn.addEventListener('click', () => {
    if (interval) clearInterval(interval);
    interval = null;
    running = false;
    seconds = 0;
    updateDisplay();
    toggleBtn.textContent = 'Start';
    toggleBtn.classList.remove('running');
  });
}

// --- DOM監視：ストップウォッチ要素が現れたらJS動作を付与 ---
function observeTimerElements(): void {
  // 既存の要素にも対応
  document.querySelectorAll<HTMLElement>('.growi-plugin-timer').forEach(attachTimerBehavior);

  // 今後追加される要素を監視（ページ遷移やプレビュー更新に対応）
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (!(addedNode instanceof HTMLElement)) continue;

        // 追加されたノード自身がタイマーか
        if (addedNode.classList?.contains('growi-plugin-timer')) {
          attachTimerBehavior(addedNode);
        }
        // 追加されたノードの子孫にタイマーがあるか
        addedNode.querySelectorAll<HTMLElement>('.growi-plugin-timer').forEach(attachTimerBehavior);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// --- プラグイン登録 ---
const activate = (): void => {
  if (growiFacade == null || growiFacade.markdownRenderer == null) {
    return;
  }

  const { optionsGenerators } = growiFacade.markdownRenderer;

  // ページ閲覧画面（View）への登録
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

  // CSSを注入し、DOM監視を開始
  injectStyles();
  observeTimerElements();
};

const deactivate = (): void => {};

if ((window as any).pluginActivators == null) {
  (window as any).pluginActivators = {};
}
(window as any).pluginActivators[config.name] = {
  activate,
  deactivate,
};
