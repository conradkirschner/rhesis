'use client';

import React, { useMemo } from 'react';
import { Paper, Typography, CircularProgress, Alert, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';

import type { TestResultStatsAll, TestResultStatsMode } from '@/api-client/types.gen';

import { generateTestResultStatsTestResultsStatsGetOptions } from '@/api-client/@tanstack/react-query.gen';

interface DimensionRadarChartProps {
  // Only `months` is used from filters for this query
  filters: Partial<{ months: number }>;
  dimension: 'behavior' | 'category' | 'topic';
  title: string;
}

/** -------- Utilities -------- **/

const calculateLineCount = (text: string, maxLineLength: number = 14): number => {
  if (!text) return 1;
  const words = text.split(' ');
  let line = '';
  let count = 0;
  for (const w of words) {
    if ((line + w).length <= maxLineLength) {
      line += (line ? ' ' : '') + w;
    } else {
      if (line) count++;
      line = w;
    }
  }
  if (line) count++;
  return Math.max(count, 1);
};

const remToPx = (remLike: string | number): number =>
    typeof remLike === 'number' ? remLike : parseFloat(remLike) * 16;

type TickProps = {
  payload?: { value?: string };
  x?: number;
  y?: number;
  textAnchor?: 'start' | 'middle' | 'end';
  cx?: number;
  cy?: number;
};

const createCustomTick = (chartTickFontSize: string | number, fillColor: string) => {
  const fontSizePx = remToPx(chartTickFontSize);

  const CustomTick: React.FC<TickProps> = ({ payload, x, y, cx, cy }) => {
    const value = payload?.value ?? '';
    const words = value.split(' ');
    const lines: string[] = [];
    let line = '';
    const maxLineLength = 14;

    for (const w of words) {
      if ((line + w).length <= maxLineLength) {
        line += (line ? ' ' : '') + w;
      } else {
        if (line) lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);

    const X = x ?? 0;
    const Y = y ?? 0;
    const CX = cx ?? 0;
    const CY = cy ?? 0;

    const dx = X - CX;
    const dy = Y - CY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const baseOffset = 5;
    const extraOffset = (lines.length - 1) * 4;
    const totalOffset = baseOffset + extraOffset;

    const ux = dx / dist;
    const uy = dy / dist;

    const ax = X + ux * totalOffset;
    const ay = Y + uy * totalOffset;

    let anchor: 'start' | 'middle' | 'end' = 'middle';
    if (ax < CX - 10) anchor = 'end';
    else if (ax > CX + 10) anchor = 'start';

    return (
        <g>
          {lines.map((ln, i) => (
              <text
                  key={i}
                  x={ax}
                  y={ay + i * 12 - (lines.length - 1) * 6}
                  textAnchor={anchor}
                  fontSize={fontSizePx}
                  fill={fillColor}
                  dominantBaseline="middle"
              >
                {ln}
              </text>
          ))}
        </g>
    );
  };

  CustomTick.displayName = 'CustomTick';
  return CustomTick;
};

// Inline pass/fail entry (your schema doesn’t export a PassFail type)
type PassFailEntry = { passed?: number | null; failed?: number | null };

const transformDimensionDataForRadar = (
    dimensionData?: Record<string, PassFailEntry>,
    dimensionName: string = 'Item',
) => {
  if (!dimensionData) {
    return [
      { subject: `${dimensionName} A (90%)`, passRate: 90 },
      { subject: `${dimensionName} B (76%)`, passRate: 76 },
      { subject: `${dimensionName} C (87%)`, passRate: 87 },
      { subject: `${dimensionName} D (60%)`, passRate: 60 },
      { subject: `${dimensionName} E (84%)`, passRate: 84 },
    ];
  }

  return Object.entries(dimensionData)
      .map(([name, s]) => {
        const total = (s?.passed ?? 0) + (s?.failed ?? 0);
        const passRate = total > 0 ? Math.round(((s?.passed ?? 0) / total) * 100) : 0;
        return { subject: `${name || 'Unknown'} (${passRate}%)`, passRate };
      })
      .filter((d) => d.passRate > 0)
      .sort((a, b) => b.passRate - a.passRate)
      .slice(0, 5);
};

/** -------- Component -------- **/

export default function DimensionRadarChart({
                                              filters,
                                              dimension,
                                              title,
                                            }: DimensionRadarChartProps) {
  const theme = useTheme();

  const queryParams = useMemo(
      () => ({
        mode: dimension as TestResultStatsMode,
        months: filters.months ?? 6,
      }),
      [dimension, filters.months],
  );

  const statsQuery = useQuery({
    ...generateTestResultStatsTestResultsStatsGetOptions({
      query: queryParams,
    }),
    staleTime: 60_000,
  });

  const tickFontSize = theme.typography.caption.fontSize ?? 12;
  const CustomTick = useMemo(
      () => createCustomTick(tickFontSize, theme.palette.text.primary),
      [tickFontSize, theme.palette.text.primary],
  );

  const stats = statsQuery.data as TestResultStatsAll | undefined;

  const chartData = useMemo(() => {
    const source: Record<string, PassFailEntry> | undefined =
        dimension === 'behavior'
            ? (stats?.behavior_pass_rates as Record<string, PassFailEntry> | undefined)
            : dimension === 'category'
                ? (stats?.category_pass_rates as Record<string, PassFailEntry> | undefined)
                : (stats?.topic_pass_rates as Record<string, PassFailEntry> | undefined);

    return transformDimensionDataForRadar(source, dimension);
  }, [stats, dimension]);

  const chartSpacing = useMemo(() => {
    const maxLines = Math.max(...chartData.map((d) => calculateLineCount(d.subject)), 1);
    const baseMargin = 20;
    const extraPerLine = 6;
    const margin = Math.min(baseMargin + (maxLines - 1) * extraPerLine, 50);
    return { margin, maxLines };
  }, [chartData]);

  if (statsQuery.isLoading) {
    return (
        <Paper elevation={1} sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Pass rates for the top 5 performing {dimension === 'category' ? 'categories' : `${dimension}s`}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress size={24} />
            <Typography variant="caption" sx={{ ml: 1.5 }}>
              Loading {dimension}…
            </Typography>
          </Box>
        </Paper>
    );
  }

  if (statsQuery.isError) {
    const msg = statsQuery.error.message;
    return (
        <Paper elevation={1} sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Error occurred
          </Typography>
          <Alert severity="error">{msg}</Alert>
        </Paper>
    );
  }

  return (
      <Paper elevation={1} sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Pass rates for the top 5 performing {dimension === 'category' ? 'categories' : `${dimension}s`}
        </Typography>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
                data={chartData}
                margin={{
                  top: chartSpacing.margin,
                  right: chartSpacing.margin,
                  bottom: chartSpacing.margin,
                  left: chartSpacing.margin,
                }}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={<CustomTick />} />
              <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{
                    fontSize: Math.max(8, remToPx(tickFontSize) - 2),
                    fill: theme.palette.text.primary,
                  }}
                  tickFormatter={(v) => `${v}%`}
                  tickCount={4}
              />
              <Radar
                  name="Pass Rate"
                  dataKey="passRate"
                  stroke={theme.palette.primary.main}
                  fill={theme.palette.primary.main}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  dot={false}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
  );
}
