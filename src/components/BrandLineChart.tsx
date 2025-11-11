import React, {useMemo} from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Path,
  Circle,
  Line,
} from 'react-native-svg';

import {useTheme} from '../hooks';
import Block from './Block';
import Text from './Text';

interface BrandLineChartProps {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  showPoints?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BrandLineChart = ({
  data,
  labels,
  width,
  height = 140,
  showPoints = true,
  style,
}: BrandLineChartProps) => {
  const {sizes, gradients, colors} = useTheme();
  const gradientPrimary = gradients?.primary ?? ['#0B3D4D', '#60CB58'];
  const chartWidth = width ?? sizes.width - sizes.padding * 2;
  const gradientId = useMemo(
    () => `chartGradient-${Math.random().toString(36).substring(2, 9)}`,
    [],
  );

  const {points, linePath, areaPath} = useMemo(() => {
    const safeData = data.length ? data : [0];
    const maxValue = Math.max(100, ...safeData);
    const step = safeData.length > 1 ? chartWidth / (safeData.length - 1) : 0;

    const computedPoints = safeData.map((value, index) => {
      const x = index * step;
      const normalized = value / maxValue;
      const y = height - normalized * height;
      return {x, y, value};
    });

    const line = computedPoints.reduce((acc, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `${acc} L ${point.x} ${point.y}`;
    }, '');

    const area =
      line +
      ` L ${computedPoints[computedPoints.length - 1]?.x ?? 0} ${height}` +
      ` L 0 ${height} Z`;

    return {points: computedPoints, linePath: line, areaPath: area};
  }, [data, chartWidth, height]);

  return (
    <Block style={style}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <SvgLinearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%">
            <Stop offset="0%" stopColor={gradientPrimary[0]} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={gradientPrimary[1]} stopOpacity={0.05} />
          </SvgLinearGradient>
        </Defs>

        <Line
          x1={0}
          y1={height}
          x2={chartWidth}
          y2={height}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />

        <Path d={areaPath} fill={`url(#${gradientId})`} />
        <Path
          d={linePath}
          stroke={gradientPrimary[0]}
          strokeWidth={3}
          fill="transparent"
          strokeLinecap="round"
        />

        {showPoints
          ? points.map(point => (
              <Circle
                key={`${point.x}-${point.y}`}
                cx={point.x}
                cy={point.y}
                r={4}
                fill={colors.white}
                stroke={gradientPrimary[0]}
                strokeWidth={2}
              />
            ))
          : null}
      </Svg>

      {labels ? (
        <Block row justify="space-between" marginTop={sizes.xs}>
          {labels.map(label => (
            <Text
              key={`label-${label}`}
              size={sizes.p - 3}
              color="rgba(255,255,255,0.6)">
              {label}
            </Text>
          ))}
        </Block>
      ) : null}
    </Block>
  );
};

export default BrandLineChart;

