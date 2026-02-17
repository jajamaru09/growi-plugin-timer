/**
 * Stopwatch.tsx - ストップウォッチ React コンポーネント
 *
 * 【なぜ React コンポーネントにしたか】
 * Growi は rehype-sanitize で <script> タグを除去するため、
 * インラインJSは使えない。
 * 代わりに client-entry.tsx から ReactDOM.createRoot() で
 * このコンポーネントを DOM にマウントする。
 *
 * 【React の useState / useRef / useEffect】
 * - useState: コンポーネントの状態（秒数、動作中かどうか）を管理
 * - useRef: setInterval の ID を保持（再レンダリングで失われないように）
 * - useEffect: コンポーネント破棄時に interval をクリーンアップ
 */

import React, { useState, useRef, useEffect } from 'react';

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

export const Stopwatch: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // running 状態が変わったら interval を制御
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    // クリーンアップ: コンポーネント破棄時に interval を停止
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running]);

  const handleToggle = () => {
    setRunning((prev) => !prev);
  };

  const handleReset = () => {
    setRunning(false);
    setSeconds(0);
  };

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 16px',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      background: '#f8f9fa',
      fontFamily: "'Courier New', Consolas, monospace",
      margin: '4px 0',
    }}>
      <span style={{
        fontSize: '1.5em',
        fontWeight: 'bold',
        minWidth: '5ch',
        textAlign: 'center',
      }}>
        {formatTime(seconds)}
      </span>

      <button
        onClick={handleToggle}
        style={{
          padding: '4px 12px',
          border: '1px solid',
          borderRadius: '4px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '0.9em',
          background: running ? '#dc3545' : '#28a745',
          borderColor: running ? '#dc3545' : '#28a745',
        }}
      >
        {running ? 'Stop' : 'Start'}
      </button>

      <button
        onClick={handleReset}
        style={{
          padding: '4px 12px',
          border: '1px solid #6c757d',
          borderRadius: '4px',
          background: '#6c757d',
          color: 'white',
          cursor: 'pointer',
          fontSize: '0.9em',
        }}
      >
        Reset
      </button>
    </div>
  );
};
