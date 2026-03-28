"use client";

import { TableCell } from "@/components/ui/table";
import { useAtom } from "jotai";
import { show10DAtom } from "../atoms";
import { bloombergColors, cn } from "../lib/theme-config";
import type { MarketItem } from "../types";
import { Sparkline } from "./sparkline";

type SparklineCellProps = {
  item: MarketItem;
  region: string;
  isDarkMode: boolean;
  isHighlighted: boolean;
};

export function SparklineCell({ item, region, isDarkMode, isHighlighted }: SparklineCellProps) {
  const [show10D] = useAtom(show10DAtom);
  const colors = isDarkMode ? bloombergColors.dark : bloombergColors.light;

  const hasIntradayData = item.sparkline1 !== null && item.sparkline1 !== undefined;
  const has10DData = item.historicalData10D !== null && item.historicalData10D !== undefined;
  const hasData = show10D ? has10DData : hasIntradayData;

  const displayData1 = show10D
    ? item.historicalData10D
      ? item.historicalData10D.slice(0, 8)
      : null
    : item.sparkline1 || null;

  const displayData2 = show10D
    ? item.historicalData10D
      ? item.historicalData10D.slice(-8)
      : null
    : item.sparkline2 || null;

  if (!hasData) {
    return (
      <TableCell
        className={cn(
          `px-2 py-1 w-[100px] bg-[${colors.surface}]`,
          isHighlighted && "bg-blue-300 dark:bg-blue-900 transition-colors duration-500"
        )}
      >
        <div className="flex items-center justify-center h-5 text-xs text-gray-400">No data</div>
      </TableCell>
    );
  }

  return (
    <TableCell
      className={cn(
        `px-2 py-1 w-[100px] bg-[${colors.surface}]`,
        isHighlighted && "bg-blue-300 dark:bg-blue-900 transition-colors duration-500"
      )}
    >
      <div className="flex justify-center">
        <Sparkline
          data1={displayData1 || []}
          data2={displayData2 || []}
          width={80}
          height={20}
          color1={colors.sparklineGray}
          color2={item.change > 0 ? colors.positive : colors.negative}
          isRealData={!!item.sparklineUpdated}
        />
        {show10D && <div className="absolute top-0 right-0 text-[8px] text-gray-500">10D</div>}
      </div>
    </TableCell>
  );
}
