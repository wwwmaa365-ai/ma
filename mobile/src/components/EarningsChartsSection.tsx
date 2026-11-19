import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  VictoryArea,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLine,
  VictoryPie,
  VictoryScatter,
} from 'victory-native';
import { Ionicons } from '@expo/vector-icons';
import { DEMO_SALES_SERIES } from '../data/demoData';
import { COLORS, RADIUS, rs, SPACING } from '../theme/theme';
import { PartnerOrder, PartnerProduct } from '../types';

type ChartRange = '7D' | '14D' | '30D';

interface DailyChartDatum {
  x: string;
  salesInr: number;
  orders: number;
}

interface CategoryChartDatum {
  x: string;
  y: number;
  fullName: string;
  pct: number;
  color: string;
}

const CATEGORY_META: Record<string, { shortName: string; color: string }> = {
  'Electronic Equipment': { shortName: 'Electronic', color: '#F59E0B' },
  'Musical Instruments': { shortName: 'Instruments', color: '#4C1D95' },
  'Dance Dresses': { shortName: 'Dance Dresses', color: '#7C3AED' },
  'Dance Accessories': { shortName: 'Accessories', color: '#D97706' },
};

interface EarningsChartsSectionProps {
  orders: PartnerOrder[];
  products: PartnerProduct[];
}

export const EarningsChartsSection: React.FC<EarningsChartsSectionProps> = ({
  orders,
  products,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const [range, setRange] = useState<ChartRange>('7D');
  const [selectedIndex, setSelectedIndex] = useState<number>(6);

  // Responsive chart width calibrated for 320px–430px Android screens
  const chartWidth = Math.max(256, Math.min(windowWidth - 56, 380));
  const pieSize = Math.max(120, Math.min(Math.round(chartWidth * 0.42), 152));

  const validOrders = useMemo(
    () => orders.filter((o) => o.status !== 'REJECTED'),
    [orders]
  );

  const dailySeries: DailyChartDatum[] = useMemo(() => {
    const liveTodaySales = validOrders
      .filter((o) => o.createdAt.toLowerCase().includes('today'))
      .reduce((sum, o) => sum + o.subtotalInr, 0);
    const liveTodayOrders = validOrders.filter((o) =>
      o.createdAt.toLowerCase().includes('today')
    ).length;

    const salesMultiplier = range === '7D' ? 1 : range === '14D' ? 1.85 : 3.4;
    const orderMultiplier = range === '7D' ? 1 : range === '14D' ? 2 : 4;

    return DEMO_SALES_SERIES.map((pt, idx) => {
      const isLast = idx === DEMO_SALES_SERIES.length - 1;
      return {
        x:
          range === '7D'
            ? pt.label
            : range === '14D'
            ? `D${(idx + 1) * 2}`
            : `W${idx + 1}`,
        salesInr: Math.round(pt.salesInr * salesMultiplier) + (isLast ? liveTodaySales : 0),
        orders: Math.max(
          1,
          Math.round(pt.orders * orderMultiplier) + (isLast ? liveTodayOrders : 0)
        ),
      };
    });
  }, [range, validOrders]);

  const safeIdx = Math.min(selectedIndex, dailySeries.length - 1);
  const selectedDay = dailySeries[safeIdx] || dailySeries[0];
  const totalSales = dailySeries.reduce((s, d) => s + d.salesInr, 0);
  const totalOrders = dailySeries.reduce((s, d) => s + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  const maxOrders = Math.max(...dailySeries.map((d) => d.orders), 1);

  const categoryData: CategoryChartDatum[] = useMemo(() => {
    const totals: Record<string, number> = {
      'Electronic Equipment': 48500,
      'Musical Instruments': 39200,
      'Dance Dresses': 26800,
      'Dance Accessories': 11400,
    };

    const productCatMap = new Map(products.map((p) => [p.id, p.category]));
    validOrders.forEach((ord) => {
      ord.items.forEach((line) => {
        const cat = productCatMap.get(line.productId) || 'Musical Instruments';
        totals[cat] = (totals[cat] || 0) + line.qty * line.unitPriceInr;
      });
    });

    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([fullName, y]) => ({
        x: CATEGORY_META[fullName]?.shortName || fullName,
        y,
        fullName,
        pct: Math.round((y / grandTotal) * 100),
        color: CATEGORY_META[fullName]?.color || COLORS.purplePrimary,
      }));
  }, [validOrders, products]);

  return (
    <View style={styles.container}>
      {/* Chart 1: Daily Sales Trends (VictoryArea + VictoryLine + VictoryScatter) */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.titleRow}>
            <Ionicons name="trending-up-outline" size={18} color={COLORS.purplePrimary} />
            <Text style={styles.sectionTitle}>Daily Sales Trends</Text>
          </View>
          <View style={styles.rangeSwitch}>
            {(['7D', '14D', '30D'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRange(r)}
                style={[styles.rangeChip, range === r && styles.rangeChipActive]}
              >
                <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiLabel}>{selectedDay.x} Sales</Text>
            <Text numberOfLines={1} style={styles.kpiValPurple}>
              ₹{selectedDay.salesInr.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiLabel}>{range} Orders</Text>
            <Text style={styles.kpiVal}>{totalOrders}</Text>
          </View>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiLabel}>Avg Order</Text>
            <Text numberOfLines={1} style={styles.kpiVal}>
              ₹{avgOrderValue.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.chartWrap}>
          <Svg width={chartWidth} height={190}>
            <Defs>
              <LinearGradient id="salesAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
                <Stop offset="100%" stopColor="#4C1D95" stopOpacity="0.02" />
              </LinearGradient>
            </Defs>
            <VictoryChart
              standalone={false}
              width={chartWidth}
              height={190}
              padding={{ top: 18, bottom: 32, left: 46, right: 16 }}
            >
              <VictoryAxis
                style={{
                  axis: { stroke: COLORS.purpleBorder },
                  tickLabels: { fill: COLORS.inkSecondary, fontSize: 10, fontWeight: '700' },
                }}
              />
              <VictoryAxis
                dependentAxis
                tickCount={4}
                tickFormat={(t: number) => `₹${Math.round(t / 1000)}k`}
                style={{
                  axis: { stroke: 'transparent' },
                  grid: { stroke: COLORS.purpleBorder, strokeDasharray: '4,4' },
                  tickLabels: { fill: COLORS.inkMuted, fontSize: 9, fontWeight: '600' },
                }}
              />
              <VictoryArea
                data={dailySeries}
                x="x"
                y="salesInr"
                interpolation="monotoneX"
                style={{
                  data: { fill: 'url(#salesAreaGradient)', stroke: 'transparent' },
                }}
              />
              <VictoryLine
                data={dailySeries}
                x="x"
                y="salesInr"
                interpolation="monotoneX"
                style={{
                  data: { stroke: COLORS.purplePrimary, strokeWidth: 2.6 },
                }}
              />
              <VictoryScatter
                data={dailySeries}
                x="x"
                y="salesInr"
                size={({ index }: { index?: string | number }) =>
                  Number(index) === safeIdx ? 6 : 4
                }
                style={{
                  data: {
                    fill: ({ index }: { index?: string | number }) =>
                      Number(index) === safeIdx ? COLORS.goldPrimary : COLORS.purplePrimary,
                    stroke: COLORS.white,
                    strokeWidth: 1.8,
                  },
                }}
              />
            </VictoryChart>
          </Svg>
        </View>

        {/* Touch-friendly day selector strip */}
        <View style={styles.daySelectorRow}>
          {dailySeries.map((pt, idx) => {
            const active = idx === safeIdx;
            return (
              <TouchableOpacity
                key={pt.x}
                onPress={() => setSelectedIndex(idx)}
                style={[styles.dayPill, active && styles.dayPillActive]}
              >
                <Text style={[styles.dayPillText, active && styles.dayPillTextActive]}>
                  {pt.x}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Chart 2: Daily Order Volume (VictoryBar) */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.titleRow}>
            <Ionicons name="bag-handle-outline" size={18} color={COLORS.purplePrimary} />
            <Text style={styles.sectionTitle}>Daily Order Volume</Text>
          </View>
          <Text style={styles.badgeCaption}>Peak: {maxOrders} orders</Text>
        </View>

        <View style={styles.chartWrap}>
          <VictoryChart
            width={chartWidth}
            height={176}
            domainPadding={{ x: 18, y: [0, 16] }}
            padding={{ top: 18, bottom: 32, left: 36, right: 16 }}
          >
            <VictoryAxis
              style={{
                axis: { stroke: COLORS.purpleBorder },
                tickLabels: { fill: COLORS.inkSecondary, fontSize: 10, fontWeight: '700' },
              }}
            />
            <VictoryAxis
              dependentAxis
              tickCount={4}
              style={{
                axis: { stroke: 'transparent' },
                grid: { stroke: COLORS.purpleBorder, strokeDasharray: '4,4' },
                tickLabels: { fill: COLORS.inkMuted, fontSize: 9 },
              }}
            />
            <VictoryBar
              data={dailySeries}
              x="x"
              y="orders"
              barRatio={0.62}
              cornerRadius={{ top: 6 }}
              labels={({ datum }: { datum?: DailyChartDatum }) =>
                datum ? `${datum.orders}` : ''
              }
              style={{
                data: {
                  fill: ({
                    datum,
                    index,
                  }: {
                    datum?: DailyChartDatum;
                    index?: string | number;
                  }) =>
                    datum?.orders === maxOrders || Number(index) === safeIdx
                      ? COLORS.goldPrimary
                      : COLORS.purplePrimary,
                },
                labels: {
                  fill: COLORS.inkSecondary,
                  fontSize: 9,
                  fontWeight: '700',
                },
              }}
            />
          </VictoryChart>
        </View>
      </View>

      {/* Chart 3: Top-Performing Product Categories (VictoryPie Donut) */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.titleRow}>
            <Ionicons name="pie-chart-outline" size={18} color={COLORS.purplePrimary} />
            <Text style={styles.sectionTitle}>Top-Performing Categories</Text>
          </View>
          <Text style={styles.badgeCaption}>{categoryData[0]?.x} #1</Text>
        </View>

        <View style={styles.pieRow}>
          <View style={{ width: pieSize, height: pieSize, alignItems: 'center', justifyContent: 'center' }}>
            <VictoryPie
              width={pieSize}
              height={pieSize}
              data={categoryData}
              colorScale={categoryData.map((c) => c.color)}
              innerRadius={Math.round(pieSize * 0.28)}
              padAngle={2}
              padding={6}
              labels={() => ''}
            />
            <View style={styles.pieCenterLabel} pointerEvents="none">
              <Text style={styles.pieCenterSub}>TOP</Text>
              <Text style={styles.pieCenterPct}>{categoryData[0]?.pct}%</Text>
            </View>
          </View>

          <View style={styles.legendCol}>
            {categoryData.map((cat) => (
              <View key={cat.fullName} style={styles.legendItem}>
                <View style={styles.rowBetween}>
                  <View style={styles.legendNameRow}>
                    <View style={[styles.dot, { backgroundColor: cat.color }]} />
                    <Text numberOfLines={1} style={styles.legendName}>
                      {cat.x}
                    </Text>
                  </View>
                  <Text style={styles.legendPct}>{cat.pct}%</Text>
                </View>
                <Text style={styles.legendAmt}>
                  ₹{cat.y.toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: SPACING.md, marginBottom: SPACING.md },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  sectionTitle: { fontSize: rs(14), fontWeight: '800', color: COLORS.ink },
  badgeCaption: { fontSize: rs(11), fontWeight: '700', color: COLORS.goldDark },
  rangeSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.purpleSoft,
    padding: 2,
    borderRadius: 8,
    gap: 2,
  },
  rangeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rangeChipActive: { backgroundColor: COLORS.purplePrimary },
  rangeText: { fontSize: rs(10), fontWeight: '700', color: COLORS.inkSecondary },
  rangeTextActive: { color: COLORS.goldPrimary },
  kpiRow: { flexDirection: 'row', gap: 6 },
  kpiTile: {
    flex: 1,
    backgroundColor: COLORS.canvas,
    borderRadius: RADIUS.sm,
    padding: 8,
    gap: 2,
  },
  kpiLabel: { fontSize: rs(10), color: COLORS.inkSecondary },
  kpiValPurple: { fontSize: rs(12), fontWeight: '800', color: COLORS.purplePrimary },
  kpiVal: { fontSize: rs(12), fontWeight: '800', color: COLORS.ink },
  chartWrap: { alignItems: 'center', justifyContent: 'center' },
  daySelectorRow: { flexDirection: 'row', gap: 4 },
  dayPill: {
    flex: 1,
    minHeight: 30,
    borderRadius: 8,
    backgroundColor: COLORS.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillActive: { backgroundColor: COLORS.purplePrimary },
  dayPillText: { fontSize: rs(10), fontWeight: '700', color: COLORS.purplePrimary },
  dayPillTextActive: { color: COLORS.goldPrimary },
  pieRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pieCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenterSub: { fontSize: rs(9), fontWeight: '700', color: COLORS.inkMuted },
  pieCenterPct: { fontSize: rs(14), fontWeight: '800', color: COLORS.purplePrimary },
  legendCol: { flex: 1, gap: 8 },
  legendItem: { gap: 1 },
  legendNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendName: { fontSize: rs(11), fontWeight: '700', color: COLORS.ink, flex: 1 },
  legendPct: { fontSize: rs(11), fontWeight: '800', color: COLORS.purplePrimary },
  legendAmt: { fontSize: rs(10), color: COLORS.inkSecondary, paddingLeft: 15 },
});
