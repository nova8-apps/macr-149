import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Line, Text as SvgText, Circle } from 'react-native-svg';
import { Text } from '@/components/ui/text';
import { TrendingUp, Flame, Scale, Trophy, Target, Activity, TrendingDown } from 'lucide-react-native';
import { useMe, useWeightLogs, useStatsSummary, useAnalyticsTrends } from '@/lib/api-hooks';
import { colors } from '@/lib/theme';
import { hapticLight } from '@/lib/haptics';

const TABS = ['Week', 'Month', '3 Months'] as const;
type Tab = typeof TABS[number];

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 72;
const CHART_H = 160;

function SimpleBarChart({ data, color, maxVal }: { data: { label: string; value: number }[]; color: string; maxVal: number }) {
  const barWidth = Math.min(28, (CHART_W - 20) / data.length - 6);
  const max = maxVal || Math.max(...data.map(d => d.value), 1);

  return (
    <Svg width={CHART_W} height={CHART_H + 30}>
      {data.map((d, i) => {
        const x = 10 + i * ((CHART_W - 20) / data.length) + ((CHART_W - 20) / data.length - barWidth) / 2;
        const h = (d.value / max) * CHART_H;
        const y = CHART_H - h;
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={y} width={barWidth} height={h} rx={6} fill={color} opacity={0.85} />
            <SvgText x={x + barWidth / 2} y={CHART_H + 18} fontSize={10} fill={colors.textSecondary} textAnchor="middle">{d.label}</SvgText>
          </React.Fragment>
        );
      })}
      <Line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} stroke={colors.border} strokeWidth={1} />
    </Svg>
  );
}

function SimpleLineChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;

  const points = data.map((d, i) => ({
    x: 20 + i * ((CHART_W - 40) / Math.max(data.length - 1, 1)),
    y: CHART_H - ((d.value - min) / range) * (CHART_H - 20) - 10,
  }));

  return (
    <Svg width={CHART_W} height={CHART_H + 30}>
      {points.map((p, i) => {
        if (i === 0) return null;
        return (
          <Line key={i} x1={points[i - 1].x} y1={points[i - 1].y} x2={p.x} y2={p.y} stroke={color} strokeWidth={2.5} />
        );
      })}
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={4} fill={color} />
      ))}
      {data.map((d, i) => (
        <SvgText key={i} x={points[i].x} y={CHART_H + 18} fontSize={10} fill={colors.textSecondary} textAnchor="middle">{d.label}</SvgText>
      ))}
      <Line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} stroke={colors.border} strokeWidth={1} />
    </Svg>
  );
}

export default function ProgressScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('Week');
  const { data: meData } = useMe();
  const weightRange = activeTab === 'Week' ? 'week' as const : activeTab === 'Month' ? 'month' as const : '3months' as const;
  const { data: weightLogsData } = useWeightLogs();
  const analyticsRange = activeTab === 'Week' ? 'week' as const : activeTab === 'Month' ? 'month' as const : '3months' as const;
  const { data: analyticsData } = useAnalyticsTrends(analyticsRange);
  const today = new Date().toISOString().split('T')[0];
  const { data: todayStats } = useStatsSummary(today);

  const goals = meData?.goals;
  const streak = meData?.streak ?? { currentStreak: 0, longestStreak: 0, lastLoggedDate: '' };
  const weightLogs = Array.isArray(weightLogsData) ? weightLogsData : (weightLogsData?.logs ?? []);
  const trends = analyticsData?.trends ?? [];
  const averages = analyticsData?.averages;
  const daysOnTrack = analyticsData?.daysOnTrack ?? 0;
  const totalDays = analyticsData?.totalDays ?? 7;

  // Calorie chart data — using real data from analytics
  const calorieData = useMemo(() => {
    if (trends.length === 0) return [];

    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    if (activeTab === 'Week') {
      // Show last 7 days with real data
      return trends.slice(-7).map((t, i) => ({
        label: labels[i] || new Date(t.date).getDate().toString(),
        value: t.caloriesConsumed,
      }));
    } else if (activeTab === 'Month') {
      // Group into 4 weeks
      const weeks: { label: string; value: number }[] = [];
      for (let w = 0; w < 4; w++) {
        const weekData = trends.slice(w * 7, (w + 1) * 7);
        const avgCal = weekData.length > 0
          ? weekData.reduce((s, d) => s + d.caloriesConsumed, 0) / weekData.length
          : 0;
        weeks.push({ label: `W${w + 1}`, value: Math.round(avgCal) });
      }
      return weeks;
    } else {
      // 3 months — group by week
      const weeks: { label: string; value: number }[] = [];
      for (let w = 0; w < 12; w++) {
        const weekData = trends.slice(w * 7, (w + 1) * 7);
        const avgCal = weekData.length > 0
          ? weekData.reduce((s, d) => s + d.caloriesConsumed, 0) / weekData.length
          : 0;
        if (weekData.length > 0) {
          const firstDay = new Date(weekData[0].date);
          weeks.push({ label: `${firstDay.getMonth() + 1}/${firstDay.getDate()}`, value: Math.round(avgCal) });
        }
      }
      return weeks;
    }
  }, [activeTab, trends]);

  // Weight chart data
  const weightData = useMemo(() => {
    if (weightLogs.length === 0) {
      const currentW = goals?.currentWeightKg ?? 75;
      return [
        { label: 'Start', value: currentW + 2 },
        { label: 'Now', value: currentW },
      ];
    }
    return weightLogs.slice(0, 7).reverse().map((w: any) => ({
      label: new Date(w.loggedAt).getDate().toString(),
      value: w.weightKg,
    }));
  }, [weightLogs, goals]);

  // Macro chart data — using real data
  const macroData = useMemo(() => {
    if (trends.length === 0) return [];

    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    if (activeTab === 'Week') {
      return trends.slice(-7).map((t, i) => ({
        label: labels[i] || new Date(t.date).getDate().toString(),
        protein: t.proteinConsumed,
        carbs: t.carbsConsumed,
        fat: t.fatConsumed,
      }));
    } else {
      // Group into weeks
      const weeks: { label: string; protein: number; carbs: number; fat: number }[] = [];
      const weeksCount = activeTab === 'Month' ? 4 : 12;
      for (let w = 0; w < weeksCount; w++) {
        const weekData = trends.slice(w * 7, (w + 1) * 7);
        if (weekData.length === 0) continue;
        const avgPro = weekData.reduce((s, d) => s + d.proteinConsumed, 0) / weekData.length;
        const avgCarb = weekData.reduce((s, d) => s + d.carbsConsumed, 0) / weekData.length;
        const avgFat = weekData.reduce((s, d) => s + d.fatConsumed, 0) / weekData.length;
        weeks.push({
          label: activeTab === 'Month' ? `W${w + 1}` : `${new Date(weekData[0].date).getMonth() + 1}/${new Date(weekData[0].date).getDate()}`,
          protein: Math.round(avgPro),
          carbs: Math.round(avgCarb),
          fat: Math.round(avgFat),
        });
      }
      return weeks;
    }
  }, [activeTab, trends]);

  const hasData = trends.length > 0 && trends.some(t => t.caloriesConsumed > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <TrendingUp size={22} color={colors.primary} />
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 }}>Progress</Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={{ flexDirection: 'row', marginHorizontal: 20, backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 4, marginBottom: 20 }}>
          {TABS.map(t => (
            <Pressable
              key={t}
              onPress={() => { hapticLight(); setActiveTab(t); }}
              accessibilityLabel={`View ${t}`}
              testID={`tab-${t.toLowerCase().replace(' ', '-')}`}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center',
                backgroundColor: activeTab === t ? colors.surface : 'transparent',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: activeTab === t ? colors.textPrimary : colors.textSecondary }}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {/* Streak Banner */}
        <View style={{ marginHorizontal: 20, backgroundColor: `${colors.primary}12`, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.primary }}>{streak.currentStreak} day streak</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>Longest: {streak.longestStreak} days</Text>
          </View>
        </View>

        {/* Analytics Summary Cards */}
        {averages && (
          <View style={{ marginHorizontal: 20, gap: 12, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Days on Track */}
              <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Target size={16} color={colors.primary} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>On Track</Text>
                </View>
                <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 }}>{daysOnTrack}/{totalDays}</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  {totalDays > 0 ? Math.round((daysOnTrack / totalDays) * 100) : 0}% adherence
                </Text>
              </View>

              {/* Avg Meals/Day */}
              <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Activity size={16} color={colors.carbs} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>Avg Meals</Text>
                </View>
                <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 }}>{(averages as any).meals?.toFixed(1) ?? '0.0'}</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>per day</Text>
              </View>
            </View>

            {/* Weekly Averages Row */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
                {activeTab} Averages
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Calories</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.carbs }}>{(averages as any).calories ?? averages.caloriesConsumed}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Protein</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.protein }}>{(averages as any).protein ?? averages.proteinConsumed}g</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Carbs</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.carbs }}>{(averages as any).carbs ?? averages.carbsConsumed}g</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Fat</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.fat }}>{(averages as any).fat ?? averages.fatConsumed}g</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Calorie Chart */}
        <View style={{ marginHorizontal: 20, backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Flame size={18} color={colors.carbs} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>Calories</Text>
          </View>
          {hasData ? (
            <SimpleBarChart data={calorieData} color={colors.carbs} maxVal={goals?.dailyCalories ?? 2000} />
          ) : (
            <View style={{ height: CHART_H, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>Log meals to see calorie trends</Text>
            </View>
          )}
        </View>

        {/* Weight Chart */}
        <View style={{ marginHorizontal: 20, backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Scale size={18} color={colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>Weight</Text>
          </View>
          <SimpleLineChart data={weightData} color={colors.primary} />
        </View>

        {/* Macro Stacked */}
        <View style={{ marginHorizontal: 20, backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>Macros</Text>
          {hasData ? (
            <View>
              <Svg width={CHART_W} height={CHART_H + 30}>
                {macroData.map((d, i) => {
                  const barW = Math.min(28, (CHART_W - 20) / macroData.length - 6);
                  const x = 10 + i * ((CHART_W - 20) / macroData.length) + ((CHART_W - 20) / macroData.length - barW) / 2;
                  const total = d.protein + d.carbs + d.fat;
                  const max = (goals?.proteinG ?? 150) + (goals?.carbsG ?? 250) + (goals?.fatG ?? 65);
                  const scale = total > 0 ? CHART_H / Math.max(max, total) : 0;

                  const fatH = d.fat * scale;
                  const carbH = d.carbs * scale;
                  const proH = d.protein * scale;

                  return (
                    <React.Fragment key={i}>
                      <Rect x={x} y={CHART_H - proH - carbH - fatH} width={barW} height={proH} rx={0} fill={colors.protein} />
                      <Rect x={x} y={CHART_H - carbH - fatH} width={barW} height={carbH} rx={0} fill={colors.carbs} />
                      <Rect x={x} y={CHART_H - fatH} width={barW} height={fatH} rx={i === macroData.length - 1 ? 6 : 0} fill={colors.fat} />
                      <SvgText x={x + barW / 2} y={CHART_H + 18} fontSize={10} fill={colors.textSecondary} textAnchor="middle">{d.label}</SvgText>
                    </React.Fragment>
                  );
                })}
                <Line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} stroke={colors.border} strokeWidth={1} />
              </Svg>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.protein }} />
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Protein</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.carbs }} />
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Carbs</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.fat }} />
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Fat</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ height: CHART_H, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>Log meals to see macro breakdown</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
