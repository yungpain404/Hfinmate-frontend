import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { CategoryBreakdownItem } from '../models/analytics.model';

interface DonutCategoryChartProps {
  categories: CategoryBreakdownItem[];
  dominantPercentageFormatted: string;
  dominantCategoryName: string;
  size?: number;
  strokeWidth?: number;
}

export const DonutCategoryChart: React.FC<DonutCategoryChartProps> = ({
  categories,
  dominantPercentageFormatted,
  dominantCategoryName,
  size = 118,
  strokeWidth = 14,
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Filter categories with valid amount & compute stroke segments
  const segments = useMemo(() => {
    const validCategories = categories.filter((c) => c.amount > 0);
    const totalAmount = validCategories.reduce((sum, c) => sum + c.amount, 0);

    return validCategories.map((cat, idx) => {
      const ratio = totalAmount > 0 ? cat.amount / totalAmount : 0;
      const arcLength = ratio * circumference;
      const priorLength = validCategories
        .slice(0, idx)
        .reduce(
          (sum, prev) =>
            sum + (totalAmount > 0 ? (prev.amount / totalAmount) * circumference : 0),
          0
        );

      return {
        id: cat.id,
        color: cat.color,
        arcLength,
        strokeDashoffset: -priorLength,
      };
    });
  }, [categories, circumference]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track circle */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="#EAEFEA"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Rotated Group to start from 12 o'clock (-90 degrees) */}
        <G rotation="-90" origin={`${cx}, ${cy}`}>
          {segments.map((seg) => (
            <Circle
              key={`segment-${seg.id}`}
              cx={cx}
              cy={cy}
              r={radius}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${Math.max(0, seg.arcLength)} ${circumference}`}
              strokeDashoffset={seg.strokeDashoffset}
              fill="none"
              strokeLinecap="butt"
            />
          ))}
        </G>
      </Svg>

      {/* Center Label (Percentage & Dominant category) */}
      <View style={styles.centerContainer} pointerEvents="none">
        <Text style={styles.percentageText} numberOfLines={1}>
          {dominantPercentageFormatted}
        </Text>
        <Text style={styles.labelText} numberOfLines={1}>
          {dominantCategoryName}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  percentageText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#17271F',
    letterSpacing: -0.5,
  },
  labelText: {
    fontSize: 11,
    color: '#71857A',
    fontWeight: '600',
    marginTop: 2,
  },
});
