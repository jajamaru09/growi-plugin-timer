/**
 * timer.ts - remarkプラグイン本体
 *
 * 【このファイルの役割】
 * Markdownの `$timer` ディレクティブを見つけて、
 * ストップウォッチのHTMLに変換します。
 *
 * 【処理の流れ】
 * 1. unified/remarkがMarkdownをAST（構文木）に変換する
 * 2. このプラグインがASTの全ノードを巡回（visit）する
 * 3. `leafGrowiPluginDirective` タイプで、name が "timer" のノードを探す
 * 4. 見つかったら、そのノードをストップウォッチHTMLに書き換える
 *
 * 【重要な概念】
 * - visit(): unist-util-visit ライブラリの関数。ASTの全ノードを再帰的に巡回する
 * - node.type: ASTノードの種類。Growiディレクティブは 'leafGrowiPluginDirective'
 * - node.name: ディレクティブ名。$timer なら 'timer'
 */

import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

/**
 * ストップウォッチのHTMLを生成する関数
 *
 * Growiのremarkプラグインでは、ASTノードを `type: 'html'` に変換して
 * `value` にHTMLを直接書き込む方法が最もシンプルです。
 *
 * ストップウォッチはJavaScriptで動作するため、
 * HTMLの中にインラインの<script>でロジックを埋め込みます。
 * （Reactコンポーネントではなく、バニラJSで実装）
 */
function generateStopwatchHtml(): string {
  // 各ストップウォッチが独立して動作するよう、ユニークなIDを生成
  const id = `growi-timer-${Math.random().toString(36).slice(2, 9)}`;

  return `
<div id="${id}" style="
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: #f8f9fa;
  font-family: 'Courier New', Consolas, monospace;
">
  <span id="${id}-display" style="
    font-size: 1.5em;
    font-weight: bold;
    min-width: 5ch;
    text-align: center;
  ">00:00</span>

  <button id="${id}-toggle" style="
    padding: 4px 12px;
    border: 1px solid #28a745;
    border-radius: 4px;
    background: #28a745;
    color: white;
    cursor: pointer;
    font-size: 0.9em;
  ">Start</button>

  <button id="${id}-reset" style="
    padding: 4px 12px;
    border: 1px solid #6c757d;
    border-radius: 4px;
    background: #6c757d;
    color: white;
    cursor: pointer;
    font-size: 0.9em;
  ">Reset</button>
</div>

<script>
(function() {
  var timerId = "${id}";
  var display = document.getElementById(timerId + "-display");
  var toggleBtn = document.getElementById(timerId + "-toggle");
  var resetBtn = document.getElementById(timerId + "-reset");

  var seconds = 0;
  var interval = null;
  var running = false;

  function formatTime(totalSeconds) {
    var m = Math.floor(totalSeconds / 60);
    var s = totalSeconds % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function updateDisplay() {
    if (display) display.textContent = formatTime(seconds);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function() {
      if (running) {
        // Stop
        clearInterval(interval);
        interval = null;
        running = false;
        toggleBtn.textContent = "Start";
        toggleBtn.style.background = "#28a745";
        toggleBtn.style.borderColor = "#28a745";
      } else {
        // Start
        running = true;
        toggleBtn.textContent = "Stop";
        toggleBtn.style.background = "#dc3545";
        toggleBtn.style.borderColor = "#dc3545";
        interval = setInterval(function() {
          seconds++;
          updateDisplay();
        }, 1000);
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", function() {
      clearInterval(interval);
      interval = null;
      running = false;
      seconds = 0;
      updateDisplay();
      if (toggleBtn) {
        toggleBtn.textContent = "Start";
        toggleBtn.style.background = "#28a745";
        toggleBtn.style.borderColor = "#28a745";
      }
    });
  }
})();
</script>
  `.trim();
}

/**
 * remarkプラグインのエクスポート
 *
 * 【Plugin の構造】
 * unified の Plugin は「関数を返す関数」です。
 * 外側の関数はオプションを受け取り、
 * 内側の関数（transformer）がASTを変換します。
 */
export const timerPlugin: Plugin = function () {
  return (tree: any) => {
    visit(tree, (node: any) => {
      // 1. Growiディレクティブノードか？
      if (node.type !== 'leafGrowiPluginDirective') return;

      // 2. $timer ディレクティブか？
      if (node.name !== 'timer') return;

      // 3. ノードをHTMLに変換
      node.type = 'html';
      node.value = generateStopwatchHtml();
    });
  };
};
