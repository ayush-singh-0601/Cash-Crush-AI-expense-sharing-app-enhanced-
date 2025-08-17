"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { PieChart as PieIcon, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";
import { motion, AnimatePresence } from "framer-motion";
import ConfettiEffect from "@/components/confetti-effect";

const COLORS = ["#36d7b7", "#6ee7b7", "#fbbf24", "#f472b6", "#60a5fa", "#a78bfa", "#f87171", "#facc15", "#34d399", "#818cf8"];

function renderCustomizedLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#222"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={13}
      fontWeight={600}
    >
      {percent > 0 ? `${(percent * 100).toFixed(0)}%` : ""}
    </text>
  );
}

function CustomLegend({ payload }) {
  return (
    <ul className="flex flex-wrap gap-4 mt-2 justify-center">
      {payload.map((entry, idx) => {
        const cat = Object.values(EXPENSE_CATEGORIES).find(c => c.name === entry.value);
        const Icon = cat?.icon;
        return (
          <li key={entry.value} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: entry.color }} />
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            <span className="text-sm font-medium">{entry.value}</span>
          </li>
        );
      })}
    </ul>
  );
}

function AnimatedNumber({ value, prefix = "", decimals = 2, className = "" }) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    let start = display;
    let end = value;
    if (start === end) return;
    let raf;
    const duration = 800;
    const startTime = performance.now();
    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(start + (end - start) * progress);
      if (progress < 1) raf = requestAnimationFrame(animate);
      else setDisplay(end);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, [value]);
  return (
    <span className={className}>{prefix}{display.toFixed(decimals)}</span>
  );
}

export function ExpenseSummary({ monthlySpending, totalSpent, categorySummary = [], isAllSettled }) {
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const chartData =
    monthlySpending?.map((item) => {
      const date = new Date(item.month);
      return {
        name: monthNames[date.getMonth()],
        amount: item.total,
      };
    }) || [];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Example category summary (should be passed as prop or fetched)
  // [{ name: 'Food', value: 1200 }, { name: 'Travel', value: 800 }, ...]
  const pieData = categorySummary.length > 0 ? categorySummary : [
    { name: "Food", value: 1200 },
    { name: "Travel", value: 800 },
    { name: "Shopping", value: 600 },
    { name: "Other", value: 400 },
  ];

  // For line chart (spending trend)
  const lineData = useMemo(() => chartData.map((d, i) => ({ ...d, trend: d.amount })), [chartData]);

  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, type: "spring" }}
    >
      <Card className="glass premium-gradient shadow-2xl border-0 animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="text-green-600" /> Expense Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 space-y-4 flex flex-col items-center justify-center gap-6">
              <div className="bg-gradient-to-r from-green-200 to-teal-200 dark:from-green-900 dark:to-teal-900 rounded-xl p-4 shadow flex flex-col items-center justify-center w-full min-w-[140px] min-h-[70px]">
                <p className="text-xs text-gray-600 dark:text-gray-300 text-center">Total this month</p>
                <h3 className="text-2xl font-extrabold mt-1 text-green-700 dark:text-green-300 text-center break-words">
                  <AnimatedNumber value={monthlySpending?.[currentMonth]?.total || 0} prefix="₹" decimals={2} />
                </h3>
              </div>
              <div className="bg-gradient-to-r from-teal-200 to-green-200 dark:from-teal-900 dark:to-green-900 rounded-xl p-4 shadow flex flex-col items-center justify-center w-full min-w-[140px] min-h-[70px]">
                <p className="text-xs text-gray-600 dark:text-gray-300 text-center">Total this year</p>
                <h3 className="text-2xl font-extrabold mt-1 text-teal-700 dark:text-teal-300 text-center break-words">
                  <AnimatedNumber value={totalSpent || 0} prefix="₹" decimals={2} />
                </h3>
              </div>
            </div>
            <div className="col-span-1 flex flex-col items-center justify-center">
              <div className="w-full h-32 flex flex-col items-center justify-center mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={50}
                      innerRadius={28}
                      fill="#36d7b7"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      isAnimationActive={true}
                      animationDuration={900}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, "Total"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="min-h-[32px] mt-2 w-full flex justify-center">
                  <CustomLegend payload={pieData.map((d, i) => ({ value: d.name, color: COLORS[i % COLORS.length] }))} />
                </div>
              </div>
            </div>
            <div className="col-span-1 flex flex-col items-center justify-center">
              <div className="w-full h-32 flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="trend" stroke="#36d7b7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-teal-500" /> Spending Trend
              </div>
            </div>
          </div>
          <div className="h-64 mt-8 rounded-xl bg-white/80 dark:bg-black/30 shadow-inner p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`₹${value.toFixed(2)}`, "Amount"]}
                  labelFormatter={() => "Spending"}
                />
                <Bar dataKey="amount" fill="#36d7b7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Monthly spending for {currentYear}
          </p>
          {isAllSettled && <ConfettiEffect />}
        </CardContent>
      </Card>
    </motion.div>
  );
}
