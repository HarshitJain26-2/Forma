import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useWorkout } from '../../context/WorkoutContext';
import { displayWeightValue } from '../../utils/units';
import { Scale } from 'lucide-react';

export const BodyWeightChart: React.FC = () => {
  const { measurements, settings } = useWorkout();

  const chartData = useMemo(() => {
    const sorted = [...measurements].sort((a, b) => a.timestamp - b.timestamp);
    return sorted.map(m => ({
      date: m.date,
      displayWeight: displayWeightValue(m.bodyWeightKg, settings.units),
      bodyFat: m.bodyFatPercent,
    }));
  }, [measurements, settings.units]);

  return (
    <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
      <div>
        <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase flex items-center">
          <Scale className="w-3.5 h-3.5 mr-1" /> BODY COMPOSITION
        </span>
        <h3 className="text-base font-display font-bold text-white uppercase mt-0.5">
          Weight & Body Metrics
        </h3>
      </div>

      {chartData.length > 1 ? (
        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#666666" 
                fontSize={10} 
                tickLine={false} 
                axisLine={{ stroke: '#222222' }}
              />
              <YAxis 
                stroke="#666666" 
                fontSize={10} 
                tickLine={false} 
                axisLine={{ stroke: '#222222' }}
                domain={['dataMin - 1', 'dataMax + 1']}
                unit={` ${settings.units.toUpperCase()}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-surface/95 border border-primary/40 backdrop-blur-md rounded-xl p-3 shadow-xl text-xs font-mono">
                        <div className="text-text-secondary font-bold mb-1">{label}</div>
                        <div className="text-primary font-bold text-sm">
                          Weight: {payload[0]?.value} {settings.units.toUpperCase()}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="displayWeight"
                stroke="#CCFF00"
                strokeWidth={3}
                dot={{ fill: '#CCFF00', stroke: '#000000', strokeWidth: 2, r: 4 }}
                activeDot={{ fill: '#FFFFFF', stroke: '#CCFF00', strokeWidth: 3, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-36 bg-surface/40 border border-dashed border-border rounded-2xl flex items-center justify-center text-center p-4">
          <span className="text-xs font-mono text-text-secondary">
            Log at least 2 body weight measurements to view trends.
          </span>
        </div>
      )}
    </div>
  );
};
