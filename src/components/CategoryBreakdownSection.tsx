import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryBreakdownSectionData } from '../models/analytics.model';
import { DonutCategoryChart } from './DonutCategoryChart';
import { theme } from '../theme';

interface CategoryBreakdownSectionProps {
  data: CategoryBreakdownSectionData;
  onPressCategoryTab?: () => void;
}

export const CategoryBreakdownSection: React.FC<CategoryBreakdownSectionProps> = ({
  data,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. Header: "Tiền đi đâu?" & "Theo loại chi" */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{data.title || 'Tiền đi đâu?'}</Text>
        <Text style={styles.headerRightLink}>
          {data.headerLinkText || 'Theo loại chi'}
        </Text>
      </View>

      {/* 2. Hero Summary Card with Donut Chart */}
      <View style={styles.heroCard}>
        {/* Left: Donut Chart */}
        <View style={styles.chartCol}>
          <DonutCategoryChart
            categories={data.categories}
            dominantPercentageFormatted={data.dominantPercentageFormatted}
            dominantCategoryName={data.dominantCategoryName}
            size={118}
            strokeWidth={14}
          />
        </View>

        {/* Right: Insights Text */}
        <View style={styles.insightsCol}>
          <Text style={styles.insightsTitle}>{data.dominantTitle}</Text>
          <Text style={styles.insightsSubtitle}>{data.dominantSubtitle}</Text>
        </View>
      </View>

      {/* 3. Breakdown List of Categories */}
      <View style={styles.categoriesList}>
        {data.categories.map((cat, index) => {
          return (
            <View
              key={cat.id || `cat-${index}`}
              style={[
                styles.categoryRow,
                index < data.categories.length - 1 && styles.categoryRowBorder,
              ]}
            >
              {/* Dot indicator */}
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: cat.color || theme.colors.primary },
                ]}
              />

              {/* Center: Name & Items detail note */}
              <View style={styles.categoryInfoCol}>
                <Text style={styles.categoryName}>{cat.name}</Text>
                {cat.note ? (
                  <Text style={styles.categoryNote} numberOfLines={1}>
                    {cat.note}
                  </Text>
                ) : null}
              </View>

              {/* Right: Amount & Percentage */}
              <View style={styles.categoryAmountCol}>
                <Text style={styles.categoryAmount}>{cat.amountFormatted}</Text>
                <Text style={styles.categoryPercentage}>
                  {cat.percentageFormatted}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* 4. Bottom Info Note Callout */}
      {data.infoNote ? (
        <View style={styles.infoAlertCard}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#71857A"
            style={styles.infoAlertIcon}
          />
          <Text style={styles.infoAlertText}>{data.infoNote}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#17271F',
    letterSpacing: -0.3,
  },
  headerRightLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A6A4C',
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#F4FAF6',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EFEA',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartCol: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17271F',
    marginBottom: 6,
    lineHeight: 22,
  },
  insightsSubtitle: {
    fontSize: 12.5,
    color: '#71857A',
    lineHeight: 18,
    fontWeight: '400',
  },

  // Categories List
  categoriesList: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  categoryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7F6',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  categoryInfoCol: {
    flex: 1,
    paddingRight: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17271F',
    marginBottom: 2,
  },
  categoryNote: {
    fontSize: 12,
    color: '#71857A',
    lineHeight: 16,
  },
  categoryAmountCol: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17271F',
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#71857A',
    fontWeight: '400',
  },

  // Info Alert Callout
  infoAlertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F7F6',
    borderWidth: 1,
    borderColor: '#E8EFEA',
    borderRadius: 14,
    padding: 13,
  },
  infoAlertIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  infoAlertText: {
    flex: 1,
    fontSize: 12,
    color: '#71857A',
    lineHeight: 18,
  },
});
