import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";

const { width } = Dimensions.get("window");

export interface WeightData {
  date: string;
  value: number;
}

interface PremiumWeightChartProps {
  data: WeightData[];
  goal?: number;
}

const fillAndSmoothData = (rawData: WeightData[]) => {
  if (!rawData || rawData.length === 0) return [];

  // Sort data by chronological date
  const sorted = [...rawData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Pad missing dates smoothly
  const filled: WeightData[] = [];
  let current = new Date(sorted[0].date);
  const end = new Date(sorted[sorted.length - 1].date);
  let sortedIndex = 0;

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];

    if (sortedIndex < sorted.length && sorted[sortedIndex].date === dateStr) {
      filled.push(sorted[sortedIndex]);
      sortedIndex++;
      while (
        sortedIndex < sorted.length &&
        sorted[sortedIndex].date === dateStr
      ) {
        sortedIndex++; // Skip duplicates
      }
    } else {
      filled.push({
        date: dateStr,
        value: filled[filled.length - 1].value, // Hold last known weight
      });
    }
    current.setDate(current.getDate() + 1);
  }

  // Smooth using moving average of last 3 points
  const smoothed = filled.map((d, i, arr) => {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - 2); j <= i; j++) {
      sum += arr[j].value;
      count++;
    }
    return { ...d, value: count > 0 ? sum / count : d.value };
  });

  return smoothed;
};

export const PremiumWeightChart: React.FC<PremiumWeightChartProps> = React.memo(
  ({ data, goal }) => {
    const chartData = useMemo(() => {
      const smoothed = fillAndSmoothData(data);

      // Generate label & dynamic point logic
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      let lastMonth = -1;

      return smoothed.map((d, index) => {
        const dObj = new Date(d.date);
        const m = dObj.getMonth();
        let label = "";

        // Keep x-axis labels sparse & clean
        if (m !== lastMonth || index === 0) {
          label = monthNames[m];
          lastMonth = m;
        }

        const isLast = index === smoothed.length - 1;

        return {
          value: d.value,
          label,
          dateStr: dObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          hideDataPoint: !isLast,
          customDataPoint: isLast
            ? () => <View style={styles.glowingDot} />
            : undefined,
        };
      });
    }, [data]);

    const { maxValue, minValue } = useMemo(() => {
      if (!chartData.length) return { maxValue: 100, minValue: 0 };

      let max = Math.max(...chartData.map((d) => d.value));
      let min = Math.min(...chartData.map((d) => d.value));

      if (goal) {
        max = Math.max(max, goal);
        min = Math.min(min, goal);
      }

      const padding = (max - min) * 0.2 || 10;
      return {
        maxValue: Math.ceil(max + padding),
        minValue: Math.floor(Math.max(0, min - padding)),
      };
    }, [chartData, goal]);

    if (!chartData.length) return null;

    const splitIndex = Math.floor(chartData.length * 0.8);

    return (
      <View style={styles.container}>
        <LineChart
          areaChart
          curved
          isAnimated
          animationDuration={1200}
          // Data sets mapping across timelines
          data={chartData}
          data2={chartData}
          startIndex={0}
          endIndex={splitIndex}
          startIndex2={splitIndex}
          endIndex2={chartData.length - 1}
          // Layout fixing
          width={width - 60}
          height={250}
          adjustToWidth
          initialSpacing={20}
          endSpacing={30}
          // Axes logic
          maxValue={maxValue}
          yAxisOffset={minValue}
          noOfSections={4}
          yAxisLabelTexts={Array.from({ length: 5 }).map((_, i) =>
            String(Math.round(minValue + ((maxValue - minValue) / 4) * i)),
          )}
          // Segment coloring
          color1="#22C55E"
          color2="#111827"
          thickness1={3}
          thickness2={3}
          startFillColor1="#22C55E"
          startFillColor2="#22C55E"
          startOpacity={0.25}
          endFillColor1="transparent"
          endFillColor2="transparent"
          endOpacity={0}
          // Clean Grid
          yAxisColor="transparent"
          xAxisColor="#E5E7EB"
          xAxisThickness={1}
          rulesType="dashed"
          rulesColor="rgba(0,0,0,0.05)"
          // Premium Typography
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={{ ...styles.axisText, marginTop: 10 }}
          xAxisLabelsHeight={30}
          xAxisLabelsVerticalShift={5}
          hideDataPoints={false}
          // Goal Line
          showReferenceLine1={goal !== undefined}
          referenceLine1Position={goal || 0}
          referenceLine1Config={{
            color: "#22C55E",
            thickness: 2,
            type: "dashed",
            dashWidth: 4,
            dashGap: 4,
          }}
          // Interactive Tooltip
          pointerConfig={{
            pointerStripUptoDataPoint: true,
            pointerStripColor: "#D1D5DB",
            pointerStripWidth: 2,
            strokeDashArray: [4, 4],
            pointerColor: "#111827",
            radius: 6,
            pointerLabelWidth: 100,
            pointerLabelHeight: 60,
            activatePointersOnLongPress: true,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: any) => {
              const item = items[0] || items[1];
              if (!item) return null;
              return (
                <View style={styles.tooltipContainer}>
                  <Text style={styles.tooltipValue}>
                    {Number(item.value).toFixed(1)}
                  </Text>
                  <Text style={styles.tooltipDate}>{item.dateStr}</Text>
                </View>
              );
            },
          }}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    marginLeft: 0,
  },
  axisText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#9CA3AF",
  },
  tooltipContainer: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginTop: -35,
  },
  tooltipValue: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    lineHeight: 24,
  },
  tooltipDate: {
    color: "#9CA3AF",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
  glowingDot: {
    width: 16,
    height: 16,
    backgroundColor: "#D1FAE5",
    borderWidth: 3,
    borderColor: "#22C55E",
    borderRadius: 8,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
    marginLeft: -8, // Centers the dot natively on the data point
    marginTop: -6, // Ensures vertical center alignment
  },
});
