import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DailyRhythmBar } from '../models/dashboard.model';
import { theme } from '../theme';

interface DailyRhythmChartProps {
  bars: (DailyRhythmBar & { heightPercent: number })[];
  highestText?: string;
  noteText?: string;
}

export const DailyRhythmChart: React.FC<DailyRhythmChartProps> = ({
  bars,
  noteText = '',
}) => {
  const xAxisDays = [1, 5, 10, 15, 20, 25, 30];

  return (
    <View style={styles.container}>
      {/* Chart Canvas Area */}
      <View style={styles.chartArea}>
        {/* Y Axis Labels & Grid Lines */}
        <View style={styles.yAxisContainer}>
          <View style={styles.gridRow}>
            <Text style={styles.yAxisText}>160</Text>
            <View style={styles.gridLine} />
          </View>
          <View style={styles.gridRow}>
            <Text style={styles.yAxisText}>80</Text>
            <View style={styles.gridLine} />
          </View>
          <View style={styles.gridRow}>
            <Text style={styles.yAxisText}>0</Text>
            <View style={styles.gridLine} />
          </View>
        </View>

        {/* Bars Container */}
        <View style={styles.barsWrapper}>
          {bars.map((item) => {
            return (
              <View key={`day-${item.day}`} style={styles.barCol}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${item.heightPercent}%`,
                      backgroundColor: item.isPeak
                        ? theme.colors.chartBarPeak
                        : item.hasRecord
                        ? theme.colors.chartBar
                        : theme.colors.chartBarEmpty,
                    },
                    !item.hasRecord && styles.emptyBar,
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* X Axis Labels */}
      <View style={styles.xAxisRow}>
        <View style={styles.xAxisSpacer} />
        <View style={styles.xAxisLabels}>
          {xAxisDays.map((dayNum) => (
            <Text key={`x-${dayNum}`} style={styles.xAxisText}>
              {dayNum}
            </Text>
          ))}
        </View>
      </View>

      {/* Footnote / Legend */}
      {noteText ? (
        <View style={styles.legendRow}>
          <View style={styles.emptySquare} />
          <Text style={styles.legendText}>{noteText}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  chartArea: {
    height: 110,
    position: 'relative',
    justifyContent: 'space-between',
  },
  yAxisContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  yAxisText: {
    fontSize: 10,
    color: '#8CA095',
    width: 24,
    textAlign: 'left',
  },
  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EDF3F0',
  },
  barsWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 28, // Offset past the Y-axis labels
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 2,
    paddingBottom: 1, // Sit directly on 0 grid line
  },
  barCol: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 1,
  },
  bar: {
    width: '100%',
    maxWidth: 6.5,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  emptyBar: {
    height: 2,
    borderRadius: 1,
  },
  xAxisRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  xAxisSpacer: {
    width: 28,
  },
  xAxisLabels: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  xAxisText: {
    fontSize: 10,
    color: '#8CA095',
    fontWeight: '500',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
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
});
