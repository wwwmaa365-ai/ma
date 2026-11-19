import React, { useMemo, useState } from 'react';
import { TrendingUp, ShoppingBag, PieChart } from 'lucide-react';
import {
  DemoOrder,
  DemoPartnerProduct,
  WEEKLY_DEMO_SALES,
} from '../../data/partnerDemoData.ts';
import { Text, View } from '../rn/ReactNativePrimitives.tsx';

export type ChartRange = '7D' | '14D' | '30D';

interface DailyPoint {
  label: string;
  salesInr: number;
  orders: number;
}

interface CategorySlice {
  name: string;
  shortName: string;
  revenueInr: number;
  pct: number;
  color: string;
}

const CATEGORY_COLORS: Record<string, { color: string; shortName: string }> = {
  'Electronic Equipment': { color: '#F59E0B', shortName: 'Electronic' },
  'Musical Instruments': { color: '#4C1D95', shortName: 'Instruments' },
  'Dance Dresses': { color: '#7C3AED', shortName: 'Dance Dresses' },
  'Dance Accessories': { color: '#D97706', shortName: 'Accessories' },
};

export interface PartnerEarningsChartsProps {
  orders: DemoOrder[];
  products: DemoPartnerProduct[];
}

export const PartnerEarningsCharts: React.FC<PartnerEarningsChartsProps> = ({
  orders,
  products,
}) => {
  const [range, setRange] = useState<ChartRange>('7D');
  const [selectedIdx, setSelectedIdx] = useState<number>(6);

  const validOrders = useMemo(
    () => orders.filter((o) => o.status !== 'REJECTED'),
    [orders]
  );

  const dailySeries: DailyPoint[] = useMemo(() => {
    const liveTodayBonus = validOrders
      .filter((o) => o.createdAt.toLowerCase().includes('today'))
      .reduce((sum, o) => sum + o.subtotalInr, 0);
    const liveTodayCount = validOrders.filter((o) =>
      o.createdAt.toLowerCase().includes('today')
    ).length;

    const multiplier = range === '7D' ? 1 : range === '14D' ? 1.85 : 3.4;
    const orderMult = range === '7D' ? 1 : range === '14D' ? 2 : 4;

    return WEEKLY_DEMO_SALES.map((pt, idx) => {
      const isLast = idx === WEEKLY_DEMO_SALES.length - 1;
      return {
        label: range === '7D' ? pt.label : range === '14D' ? `D${(idx + 1) * 2}` : `W${idx + 1}`,
        salesInr: Math.round(pt.salesInr * multiplier) + (isLast ? liveTodayBonus : 0),
        orders: Math.max(1, Math.round(pt.orders * orderMult) + (isLast ? liveTodayCount : 0)),
      };
    });
  }, [range, validOrders]);

  const safeSelectedIdx = Math.min(selectedIdx, dailySeries.length - 1);
  const selectedDay = dailySeries[safeSelectedIdx] || dailySeries[0];

  const totalSales = dailySeries.reduce((s, d) => s + d.salesInr, 0);
  const totalOrders = dailySeries.reduce((s, d) => s + d.orders, 0);
  const avgOrderVal = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  // Compute Category Performance dynamically from live orders + products
  const categoryData: CategorySlice[] = useMemo(() => {
    const totals: Record<string, number> = {
      'Electronic Equipment': 48500,
      'Musical Instruments': 39200,
      'Dance Dresses': 26800,
      'Dance Accessories': 11400,
    };

    const productCategoryById = new Map(products.map((p) => [p.id, p.category]));
    validOrders.forEach((ord) => {
      ord.items.forEach((line) => {
        const cat = productCategoryById.get(line.productId) || 'Musical Instruments';
        totals[cat] = (totals[cat] || 0) + line.qty * line.unitPriceInr;
      });
    });

    const grand = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([name, revenueInr]) => ({
        name,
        shortName: CATEGORY_COLORS[name]?.shortName || name,
        revenueInr,
        pct: Math.round((revenueInr / grand) * 100),
        color: CATEGORY_COLORS[name]?.color || '#4C1D95',
      }));
  }, [validOrders, products]);

  // SVG Geometry for Area + Line Sales Chart
  const chartW = 320;
  const chartH = 156;
  const padL = 38;
  const padR = 14;
  const padT = 16;
  const padB = 26;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const maxSales = Math.max(...dailySeries.map((d) => d.salesInr), 1);

  const points = dailySeries.map((d, i) => {
    const x = padL + (i / Math.max(1, dailySeries.length - 1)) * innerW;
    const y = padT + innerH - (d.salesInr / maxSales) * innerH;
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padT + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;

  // SVG Geometry for Order Volume Bar Chart
  const barH = 136;
  const barInnerH = barH - padT - padB;
  const maxOrders = Math.max(...dailySeries.map((d) => d.orders), 1);
  const slotW = innerW / dailySeries.length;
  const barW = Math.min(24, slotW * 0.56);

  // SVG Geometry for Category Donut Chart
  const donutSize = 132;
  const radius = 48;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  let runningOffset = 0;

  return (
    <div className="w-full flex flex-col gap-3.5">
      {/* Range Toggle + KPI Strip */}
      <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-3">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-1.5 min-w-0">
            <TrendingUp className="w-4 h-4 text-purple-800 dark:text-amber-300 shrink-0" />
            <Text className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
              Daily Sales Trends
            </Text>
          </div>
          <div className="flex flex-row items-center gap-1 bg-purple-50 dark:bg-purple-950/70 p-0.5 rounded-lg">
            {(['7D', '14D', '30D'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-2 py-1 rounded-md text-[10px] font-extrabold font-mono-tabular cursor-pointer ${
                  range === r
                    ? 'bg-[#4C1D95] text-amber-300'
                    : 'text-slate-600 dark:text-purple-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Day Readout */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-xl bg-purple-50/80 dark:bg-purple-950/50 flex flex-col">
            <span className="text-[10px] text-slate-500 dark:text-purple-300">
              {selectedDay.label} Sales
            </span>
            <span className="text-xs font-extrabold font-mono-tabular text-purple-950 dark:text-amber-300 truncate">
              ₹{selectedDay.salesInr.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-purple-50/80 dark:bg-purple-950/50 flex flex-col">
            <span className="text-[10px] text-slate-500 dark:text-purple-300">
              {range} Orders
            </span>
            <span className="text-xs font-extrabold font-mono-tabular text-slate-900 dark:text-white">
              {totalOrders} orders
            </span>
          </div>
          <div className="p-2 rounded-xl bg-purple-50/80 dark:bg-purple-950/50 flex flex-col">
            <span className="text-[10px] text-slate-500 dark:text-purple-300">
              Avg Order
            </span>
            <span className="text-xs font-extrabold font-mono-tabular text-slate-900 dark:text-white truncate">
              ₹{avgOrderVal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* SVG Area + Line Chart */}
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full h-auto overflow-visible select-none"
          role="img"
          aria-label="Daily Sales Trend Chart"
        >
          <defs>
            <linearGradient id="sanjitSalesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#4C1D95" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((tick) => {
            const y = padT + innerH - tick * innerH;
            const valK = Math.round((maxSales * tick) / 1000);
            return (
              <g key={tick}>
                <line
                  x1={padL}
                  y1={y}
                  x2={chartW - padR}
                  y2={y}
                  stroke="#E9D5FF"
                  strokeOpacity="0.45"
                  strokeDasharray="3 3"
                />
                <text
                  x={padL - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#94A3B8"
                >
                  ₹{valK}k
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#sanjitSalesGrad)" />
          <path
            d={linePath}
            fill="none"
            stroke="#4C1D95"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((pt, i) => {
            const isSelected = i === safeSelectedIdx;
            return (
              <g
                key={pt.label}
                onClick={() => setSelectedIdx(i)}
                className="cursor-pointer"
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 5.5 : 3.5}
                  fill={isSelected ? '#F59E0B' : '#4C1D95'}
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                />
                <text
                  x={pt.x}
                  y={chartH - 6}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight={isSelected ? '800' : '600'}
                  fill={isSelected ? '#D97706' : '#64748B'}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </View>

      {/* Chart 2: Daily Order Volume Bar Chart */}
      <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-1.5 min-w-0">
            <ShoppingBag className="w-4 h-4 text-purple-800 dark:text-amber-300 shrink-0" />
            <Text className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
              Daily Order Volume
            </Text>
          </div>
          <span className="text-[10px] font-bold font-mono-tabular text-purple-800 dark:text-amber-300">
            Peak: {maxOrders} orders
          </span>
        </div>

        <svg
          viewBox={`0 0 ${chartW} ${barH}`}
          className="w-full h-auto overflow-visible select-none"
          role="img"
          aria-label="Daily Order Volume Bar Chart"
        >
          {[0, 0.5, 1].map((tick) => {
            const y = padT + barInnerH - tick * barInnerH;
            return (
              <line
                key={tick}
                x1={padL}
                y1={y}
                x2={chartW - padR}
                y2={y}
                stroke="#E9D5FF"
                strokeOpacity="0.4"
                strokeDasharray="3 3"
              />
            );
          })}

          {dailySeries.map((pt, i) => {
            const h = Math.max(8, (pt.orders / maxOrders) * barInnerH);
            const x = padL + i * slotW + (slotW - barW) / 2;
            const y = padT + barInnerH - h;
            const isPeak = pt.orders === maxOrders;
            const isSelected = i === safeSelectedIdx;
            return (
              <g
                key={pt.label}
                onClick={() => setSelectedIdx(i)}
                className="cursor-pointer"
              >
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={5}
                  fill={isPeak || isSelected ? '#F59E0B' : '#4C1D95'}
                />
                <text
                  x={x + barW / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill={isPeak || isSelected ? '#D97706' : '#64748B'}
                >
                  {pt.orders}
                </text>
                <text
                  x={x + barW / 2}
                  y={barH - 6}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight={isSelected ? '800' : '600'}
                  fill={isSelected ? '#D97706' : '#64748B'}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </View>

      {/* Chart 3: Top-Performing Product Categories Donut Chart */}
      <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-3">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-1.5 min-w-0">
            <PieChart className="w-4 h-4 text-purple-800 dark:text-amber-300 shrink-0" />
            <Text className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
              Top-Performing Categories
            </Text>
          </div>
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
            {categoryData[0]?.shortName} #1
          </span>
        </div>

        <div className="flex flex-row items-center gap-3">
          <div className="relative w-[124px] h-[124px] shrink-0 flex items-center justify-center">
            <svg
              viewBox={`0 0 ${donutSize} ${donutSize}`}
              className="w-full h-full -rotate-90"
              role="img"
              aria-label="Top Performing Product Categories Donut Chart"
            >
              {categoryData.map((slice) => {
                const segLen = (slice.pct / 100) * circumference;
                const dashArray = `${Math.max(2, segLen - 2)} ${circumference}`;
                const dashOffset = -runningOffset;
                runningOffset += segLen;
                return (
                  <circle
                    key={slice.name}
                    cx={donutSize / 2}
                    cy={donutSize / 2}
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[9px] font-bold text-slate-500 dark:text-purple-300">
                TOP SHARE
              </span>
              <span className="text-sm font-extrabold font-mono-tabular text-purple-950 dark:text-amber-300">
                {categoryData[0]?.pct}%
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex flex-col gap-0.5">
                <div className="flex flex-row items-center justify-between gap-1 text-[11px]">
                  <span className="flex flex-row items-center gap-1.5 min-w-0">
                    <span
                      style={{ backgroundColor: cat.color }}
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                    />
                    <span className="font-bold text-slate-800 dark:text-purple-100 truncate">
                      {cat.shortName}
                    </span>
                  </span>
                  <span className="font-mono-tabular font-extrabold text-purple-900 dark:text-amber-300 shrink-0">
                    {cat.pct}%
                  </span>
                </div>
                <span className="text-[10px] font-mono-tabular text-slate-500 dark:text-purple-300 pl-4">
                  ₹{cat.revenueInr.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </View>
    </div>
  );
};
