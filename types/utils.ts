import type { Plugin } from 'unified';

/**
 * Growiのmarkdownレンダラーのオプション型
 * remarkPlugins に自作プラグインを追加するために使う
 */
export type Options = Record<string, unknown>;

export type Func = (...args: unknown[]) => unknown;

export interface ViewOptions {
  remarkPlugins: Plugin[];
  [key: string]: unknown;
}
