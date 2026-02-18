import 'chart.js';

declare module 'chart.js' {
  interface Chart {
    zoom: (amountOrOptions: number | unknown) => void;
    resetZoom: () => void;
  }
}