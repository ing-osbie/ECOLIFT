'use client';

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

const wasteData = [
  { name: 'Household', value: 45, color: '#10b981' },
  { name: 'Recyclables', value: 25, color: '#3b82f6' },
  { name: 'Commercial', value: 15, color: '#f59e0b' },
  { name: 'Bulk / Construction', value: 10, color: '#ef4444' },
  { name: 'E-Waste', value: 5, color: '#8b5cf6' },
];

export function WasteDistributionChart() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="font-bold text-white text-base">Waste Category Distribution</h3>
        <p className="text-xs text-slate-400 font-medium">Breakdown by pickup material type</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={wasteData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {wasteData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
