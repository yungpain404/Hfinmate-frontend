import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MonthAnalyticsItem } from '../models/analytics.model';

interface YearlyBarChartProps {
  months: MonthAnalyticsItem[];
  maxMillions?: number;
  noteText?: string;
}

const DRAWABLE_HEIGHT = 130; // Pixel height for bar canvas
const COLUMN_WIDTH = 52; // Generous width per month column to prevent any wrapping or overflow
const HEADER_SPACE = 34; // Top space so value badges sit fully above the 3.0 gridline without clipping

const formatMillions = (val: number): string => {
  if (!val || val <= 0) return '0';
  return val.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
};

export const YearlyBarChart: React.FC<YearlyBarChartProps> = ({
  months,
  maxMillions = 3,
  noteText = 'Chưa có dữ liệu, không phải chi tiêu 0đ',
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const yTicks = [3, 2, 1, 0];
  const chartWidth = Math.max(months.length * COLUMN_WIDTH + 16, 624);

  // Auto-scroll to the first month with data (e.g. Month 9) on mount
  useEffect(() => {
    const activeIndex = months.findIndex((m) => m.hasData && m.amountMillions > 0);
    if (activeIndex !== -1 && scrollViewRef.current) {
      const targetX = Math.max(0, activeIndex * COLUMN_WIDTH - 110);
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: targetX, animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [months]);

  return (
    <View style={styles.container}>
      {/* Main Chart Body: Fixed Y-axis on left + Horizontal ScrollView on right */}
      <View style={styles.chartBodyRow}>
        {/* 1. Left Fixed Y-Axis */}
        <View style={styles.yAxisColumn}>
          {yTicks.map((tick) => (
            <Text key={`tick-${tick}`} style={styles.yAxisText}>
              {tick}
            </Text>
          ))}
        </View>

        {/* 2. Scrollable Canvas: Grid Lines + Bars + X-Axis */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={true}
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { width: chartWidth },
          ]}
        >
          {/* Background Grid Lines spanning full chart width */}
          <View style={[styles.gridContainer, { width: chartWidth }]}>
            {yTicks.map((tick, idx) => {
              const topRatio = idx / (yTicks.length - 1);
              return (
                <View
                  key={`line-${tick}`}
                  style={[
                    styles.gridLine,
                    {
                      top: HEADER_SPACE + topRatio * DRAWABLE_HEIGHT,
                      width: chartWidth,
                    },
                    tick === 0 && styles.baselineGridLine,
                  ]}
                />
              );
            })}
          </View>

          {/* 12 Months Columns: Bars & Values */}
          <View style={styles.barsRow}>
            {months.map((item) => {
              const hasData = item.hasData && item.amountMillions > 0;
              const barHeight = hasData
                ? Math.max(16, Math.min(DRAWABLE_HEIGHT, Math.round((item.amountMillions / maxMillions) * DRAWABLE_HEIGHT)))
                : 0;

              return (
                <View key={`col-${item.month}`} style={styles.monthColumn}>
                  {hasData ? (
                    <View style={styles.activeBarWrapper}>
                      {/* Value Badge positioned cleanly above the bar */}
                      <View style={styles.tooltipBadge}>
                        <Text style={styles.tooltipText} numberOfLines={1}>
                          {formatMillions(item.amountMillions)}
                        </Text>
                      </View>

                      {/* Main Bar */}
                      <View style={[styles.barFill, { height: barHeight }]} />
                    </View>
                  ) : (
                    <View style={styles.emptyCapsuleWrapper}>
                      <View style={styles.emptyCapsule} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* X Axis Month Numbers (1 .. 12) aligned under each column */}
          <View style={styles.xAxisRow}>
            {months.map((item) => {
              const isHighlight = item.hasData;
              return (
                <View key={`xlabel-${item.month}`} style={styles.xAxisCol}>
                  <View
                    style={[
                      styles.xAxisPill,
                      isHighlight && styles.xAxisPillHighlight,
                    ]}
                  >
                    <Text
                      style={[
                        styles.xAxisText,
                        isHighlight && styles.xAxisTextHighlight,
                      ]}
                    >
                      {item.month}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Footer: Legend Note & Horizontal Scroll Hint */}
      <View style={styles.footerRow}>
        {noteText ? (
          <View style={styles.legendLeft}>
            <View style={styles.emptySquare} />
            <Text style={styles.legendText}>{noteText}</Text>
          </View>
        ) : null}

        <View style={styles.scrollHintRow}>
          <Ionicons name="swap-horizontal" size={13} color="#8CA095" style={{ marginRight: 4 }} />
          <Text style={styles.scrollHintText}>Vuốt xem 12 tháng</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  chartBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  // Fixed Left Y-Axis
  yAxisColumn: {
    width: 26,
    height: DRAWABLE_HEIGHT + 14,
    marginTop: HEADER_SPACE - 7, // Center tick numbers around grid line Y coordinates
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  yAxisText: {
    fontSize: 11,
    color: '#8CA095',
    fontWeight: '500',
  },
  // Horizontal Scrollable Chart Area
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    position: 'relative',
    paddingRight: 16,
  },
  // Grid Lines
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_SPACE + DRAWABLE_HEIGHT,
    zIndex: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#EDF3F0',
  },
  baselineGridLine: {
    backgroundColor: '#DDE7E1',
  },
  // Bars Row
  barsRow: {
    height: HEADER_SPACE + DRAWABLE_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  monthColumn: {
    width: COLUMN_WIDTH,
    height: HEADER_SPACE + DRAWABLE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  activeBarWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tooltipBadge: {
    backgroundColor: '#EAF5EF',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BDE2CF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    shadowColor: '#1A6A4C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tooltipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A6A4C',
  },
  barFill: {
    width: 22,
    backgroundColor: '#1A6A4C',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  emptyCapsuleWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 0,
  },
  emptyCapsule: {
    width: 16,
    height: 5,
    borderRadius: 2.5,
    borderWidth: 1,
    borderColor: '#CDE2D7',
    backgroundColor: '#FFFFFF',
    marginBottom: 0,
  },
  // X-Axis
  xAxisRow: {
    flexDirection: 'row',
    marginTop: 8,
    height: 26,
    alignItems: 'center',
  },
  xAxisCol: {
    width: COLUMN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xAxisPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xAxisPillHighlight: {
    backgroundColor: '#EAF5EF',
  },
  xAxisText: {
    fontSize: 11,
    color: '#8CA095',
    fontWeight: '500',
    textAlign: 'center',
  },
  xAxisTextHighlight: {
    color: '#1A6A4C',
    fontWeight: '800',
    fontSize: 11,
  },
  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 4,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  emptySquare: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: '#8CA095',
    marginRight: 6,
    borderRadius: 1.5,
  },
  legendText: {
    fontSize: 11,
    color: '#71857A',
  },
  scrollHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollHintText: {
    fontSize: 10,
    color: '#8CA095',
    fontWeight: '500',
  },
});
