import { useEffect, useRef } from 'react';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Analytics() {
  const barRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!barRef.current) return;
    const ctx = barRef.current.getContext('2d');
    if (!ctx) return;
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['数学', '英语', '物理', '化学', '计算机'],
        datasets: [{ label: '课程热度', data: [12, 19, 3, 5, 2], backgroundColor: 'rgba(59,130,246,0.6)' }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
    return () => chart.destroy();
  }, []);

  return (
    <div>
      <h1 className="text-xl mb-4">数据分析</h1>
      <div className="h-80">
        <canvas ref={barRef} />
      </div>
    </div>
  );
}

