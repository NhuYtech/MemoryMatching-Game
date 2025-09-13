// src/components/ui/chart.tsx
export const ChartContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className="w-full h-[350px]">{children}</div>;
};

export const ChartTooltip = () => null;
export const ChartLegend = () => null;