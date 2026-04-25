'use client';

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';

interface MoodStat { date: string; avg_score: number; count: number }

export default function MoodChart({ data }: { data: MoodStat[] }) {
  const formatted = data.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('ar-LB', { month: 'short', day: 'numeric' }),
    avg:   Math.round(d.avg_score * 10) / 10,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8D5D0" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8A6070' }} />
        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#8A6070' }} />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: '1px solid #E8D5D0', fontSize: 12 }}
          formatter={(v: number) => [`${v}/5`, 'متوسط المزاج']}
          labelStyle={{ color: '#2A1520', fontWeight: 600 }}
        />
        <Line
          type="monotone"
          dataKey="avg"
          stroke="#B5586A"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: '#B5586A' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
