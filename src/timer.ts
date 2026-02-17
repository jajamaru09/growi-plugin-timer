/**
 * timer.ts - remarkプラグイン本体（修正版v2）
 *
 * 【lsxプラグインから学んだポイント】
 * Growi内蔵の rehype-sanitize は未知のタグや属性を除去する。
 * 外部プラグインではサニタイズ設定を直接変更できないため、
 * 標準HTMLタグ（div）＋ data-* 属性 で出力する。
 *
 * data-* 属性は HTML仕様で自由に定義でき、
 * 多くのサニタイザーがデフォルトで許可している。
 *
 * 【戦略】
 * remarkプラグイン → 空の <div data-growi-plugin-timer> を出力
 * client-entry.tsx → MutationObserver でこの div を検知し、
 *                    ReactDOM で Stopwatch コンポーネントをマウント
 */

import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

export const timerPlugin: Plugin = function () {
  return (tree: any) => {
    visit(tree, (node: any) => {
      if (node.type !== 'leafGrowiPluginDirective') return;
      if (node.name !== 'timer') return;

      // data.hName / data.hProperties を使って
      // remark → rehype 変換時の出力を制御する
      // （unified エコシステムの標準的な手法）
      node.data = {
        hName: 'div',
        hProperties: {
          'data-growi-plugin-timer': 'true',
        },
      };
    });
  };
};
