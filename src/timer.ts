/**
 * timer.ts - remarkプラグイン本体
 *
 * 【修正ポイント】
 * Growi は rehype-sanitize でHTMLをサニタイズするため、
 * <script> タグやインライン style 属性は除去されます。
 *
 * そこで、このプラグインでは：
 * - HTMLは <div> と <span>, <button> のみ使用
 * - class 属性でスタイリングとJS紐付けを行う
 * - JavaScript の動作は client-entry.tsx 側で後付けする
 *
 * 【処理の流れ】
 * 1. ASTを巡回して $timer ディレクティブを探す
 * 2. 見つけたノードを data.hName / data.hChildren で
 *    HAST（HTML AST）ノードに変換する
 *    → これにより rehype-sanitize をバイパスできる
 */

import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

/**
 * remarkプラグイン
 *
 * Growiのサニタイザーを考慮し、node.type = 'html' ではなく
 * data.hName を使った HAST 変換を行います。
 *
 * data.hName: このノードをHTMLに変換する際のタグ名
 * data.hProperties: HTMLの属性（class, data-* など）
 * data.hChildren: 子要素の配列
 */
export const timerPlugin: Plugin = function () {
  return (tree: any) => {
    visit(tree, (node: any) => {
      // 1. Growiディレクティブノードか？
      if (node.type !== 'leafGrowiPluginDirective') return;

      // 2. $timer ディレクティブか？
      if (node.name !== 'timer') return;

      // 3. HAST ノードとして変換
      // data.hName を設定すると、remark→rehype 変換時に
      // そのタグ名のHTML要素として出力される
      node.data = {
        hName: 'div',
        hProperties: {
          className: ['growi-plugin-timer'],
        },
        hChildren: [
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['growi-timer-display'] },
            children: [{ type: 'text', value: '00:00' }],
          },
          {
            type: 'element',
            tagName: 'button',
            properties: { className: ['growi-timer-toggle'] },
            children: [{ type: 'text', value: 'Start' }],
          },
          {
            type: 'element',
            tagName: 'button',
            properties: { className: ['growi-timer-reset'] },
            children: [{ type: 'text', value: 'Reset' }],
          },
        ],
      };
    });
  };
};
