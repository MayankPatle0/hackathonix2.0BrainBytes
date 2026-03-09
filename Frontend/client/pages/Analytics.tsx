'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MemoryItem } from '@/types/memory';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart2, Hash, PieChart, Smile } from 'lucide-react';

// 1. Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  ChartData,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// 2. Register all the components you are using
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// --- Data Transformation Helper ---
function transformDbItemToMemoryItem(dbItem: any): MemoryItem {
  const meta = dbItem.metadata;
  function deriveTypeFromUrl(url: string | null) {
    if (!url) return 'text';
    if (url.includes('youtube.com')) return 'youtube';
    if (url.includes('linkedin.com')) return 'linkedin';
    if (url.includes('x.com')) return 'twitter';
    if (url.includes('reddit.com')) return 'reddit';
    if (url.includes('quora.com')) return 'quora';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('github.com')) return 'github';
    if (url.endsWith('.pdf')) return 'pdf';
    return 'article';
  }
  return {
    id: String(dbItem.id),
    title: meta.title,
    summary: meta.summary,
    keywords: meta.keywords || [],
    emotion: meta.emotions ? meta.emotions[0] : 'neutral',
    timestamp: meta.timestamp,
    url: meta.source_url,
    type: deriveTypeFromUrl(meta.source_url),
    favorite: dbItem.favorite,
    imageDataUrl: null,
  };
}

// --- Reusable Chart Card Component ---
const ChartCard = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl transition-all hover:border-zinc-700">
    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-100">
      <Icon className="h-5 w-5 text-cyan-400" />
      {title}
    </h2>
    <div className="relative h-80">{children}</div>
  </div>
);

// --- Gradient Creator for Bar Charts ---
function createGradient(ctx: CanvasRenderingContext2D, chartArea: { top: number, bottom: number }, color1: string, color2: string) {
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  return gradient;
}

export default function AnalyticsPage() {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 3. Fetch all data on page load ---
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data, error } = await supabase
        .from('retain_auth_memory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching data:', error);
      } else if (data) {
        const transformedItems = data.map(transformDbItemToMemoryItem);
        setItems(transformedItems);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // --- 4. Process data for ALL charts ---

  // For Doughnut Chart 1: Content Type
  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      const type = item.type.charAt(0).toUpperCase() + item.type.slice(1);
      counts.set(type, (counts.get(type) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  // For Doughnut Chart 2: Emotion Breakdown
  const emotionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      const emotion = (item.emotion || 'neutral').charAt(0).toUpperCase() + (item.emotion || 'neutral').slice(1);
      counts.set(emotion, (counts.get(emotion) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  // For Bar Chart 1: Top Keywords
  const keywordCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      (item.keywords || []).forEach(keyword => {
        const kw = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        counts.set(kw, (counts.get(kw) || 0) + 1);
      });
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [items]);

  // For Bar Chart 2: Top Sources
  const sourceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      if (item.url) {
        try {
          const hostname = new URL(item.url).hostname.replace(/^www\./, '');
          counts.set(hostname, (counts.get(hostname) || 0) + 1);
        } catch (e) {
          // invalid URL
        }
      }
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [items]);


  // --- 5. Chart.js Data and Options ---

  // --- Artistic Color Palette ---
  const colors = {
    cyan: 'rgba(34, 211, 238, 0.7)',
    blue: 'rgba(59, 130, 246, 0.7)',
    purple: 'rgba(168, 85, 247, 0.7)',
    green: 'rgba(16, 185, 129, 0.7)',
    yellow: 'rgba(234, 179, 8, 0.7)',
    red: 'rgba(239, 68, 68, 0.7)',
    
    cyanFull: 'rgba(34, 211, 238, 1)',
    blueFull: 'rgba(59, 130, 246, 1)',
    purpleFull: 'rgba(168, 85, 247, 1)',
    greenFull: 'rgba(16, 185, 129, 1)',
  };

  const chartTextColor = 'rgba(228, 228, 231, 0.8)';
  const chartGridColor = 'rgba(63, 63, 70, 0.5)';

  // --- Data for Doughnut 1 (Type) ---
  const typeChartData: ChartData<'doughnut'> = {
    labels: typeCounts.map(([type]) => type),
    datasets: [
      {
        label: '# of Memories',
        data: typeCounts.map(([, count]) => count),
        backgroundColor: [colors.cyan, colors.blue, colors.purple, colors.green, colors.yellow, colors.red],
        borderColor: '#18181b', // zinc-900
        borderWidth: 4,
      },
    ],
  };

  // --- Data for Doughnut 2 (Emotion) ---
  const emotionChartData: ChartData<'doughnut'> = {
    labels: emotionCounts.map(([emotion]) => emotion),
    datasets: [
      {
        label: '# of Memories',
        data: emotionCounts.map(([, count]) => count),
        backgroundColor: [colors.green, colors.purple, colors.cyan, colors.blue, colors.yellow, colors.red],
        borderColor: '#18181b', // zinc-900
        borderWidth: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: chartTextColor,
          font: { size: 12 },
          boxWidth: 15,
          padding: 15,
        },
      },
      title: { display: false },
    },
  };

  // --- Data for Horizontal Bar (Keywords) ---
  const keywordChartData: ChartData<'bar'> = {
    labels: keywordCounts.map(([kw]) => kw),
    datasets: [
      {
        label: 'Keyword Count',
        data: keywordCounts.map(([, count]) => count),
        backgroundColor: function(context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return;
          return createGradient(ctx, chartArea, colors.cyanFull, colors.blueFull);
        },
        borderRadius: 4,
      },
    ],
  };

  const horizontalBarOptions = {
    indexAxis: 'y' as const, // This makes it horizontal
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        ticks: { color: chartTextColor },
        grid: { color: chartGridColor, drawOnChartArea: false },
      },
      x: {
        ticks: { color: chartTextColor },
        grid: { color: chartGridColor },
      },
    },
  };

  // --- Data for Vertical Bar (Sources) ---
  const sourceChartData: ChartData<'bar'> = {
    labels: sourceCounts.map(([source]) => source),
    datasets: [
      {
        label: 'Source Count',
        data: sourceCounts.map(([, count]) => count),
        backgroundColor: function(context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return;
          return createGradient(ctx, chartArea, colors.blueFull, colors.purpleFull);
        },
        borderRadius: 4,
      },
    ],
  };

  const verticalBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        ticks: { color: chartTextColor },
        grid: { color: chartGridColor },
      },
      x: {
        ticks: { color: chartTextColor, maxRotation: 45, minRotation: 45 },
        grid: { color: chartGridColor, drawOnChartArea: false },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-300">
        Loading artistic analytics...
      </div>
    );
  }

  // 6. Render the new page layout
  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-200">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-zinc-100">Analytics</h1>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          <ChartCard title="Content Type Distribution" icon={PieChart}>
            <Doughnut options={doughnutOptions} data={typeChartData} />
          </ChartCard>

          <ChartCard title="Emotion Breakdown" icon={Smile}>
            <Doughnut options={doughnutOptions} data={emotionChartData} />
          </ChartCard>

          <ChartCard title="Top Keywords" icon={Hash}>
            <Bar options={horizontalBarOptions} data={keywordChartData} />
          </ChartCard>

          <ChartCard title="Top Sources" icon={BarChart2}>
            <Bar options={verticalBarOptions} data={sourceChartData} />
          </ChartCard>
          
        </div>
      </div>
    </div>
  );
}

