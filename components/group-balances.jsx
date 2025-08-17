"use client";

import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpCircle, ArrowDownCircle, User } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend } from "recharts";
import { motion } from "framer-motion";
import React from "react";

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

export function GroupBalances({ balances }) {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  if (!balances?.length || !currentUser) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No balance information available
      </div>
    );
  }
  const me = balances.find((b) => b.id === currentUser._id);
  if (!me) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        You're not part of this group
      </div>
    );
  }

  const COLORS = ["#36d7b7", "#6ee7b7", "#fbbf24", "#f472b6", "#60a5fa", "#a78bfa", "#f87171", "#facc15", "#34d399", "#818cf8"];
  const userMap = Object.fromEntries(balances.map((b) => [b.id, b]));
  const chartData = balances.map((b) => ({
    name: b.name,
    value: Math.abs(b.totalBalance),
    imageUrl: b.imageUrl,
    id: b.id,
  }));
  const barData = balances.map((b) => ({
    name: b.name,
    Owes: b.owes.reduce((sum, o) => sum + o.amount, 0),
    OwedBy: b.owedBy.reduce((sum, o) => sum + o.amount, 0),
  }));

  const owedByMembers = me.owedBy
    .map(({ from, amount }) => ({ ...userMap[from], amount }))
    .sort((a, b) => b.amount - a.amount);
  const owingToMembers = me.owes
    .map(({ to, amount }) => ({ ...userMap[to], amount }))
    .sort((a, b) => b.amount - a.amount);

  const isAllSettledUp =
    me.totalBalance === 0 &&
    owedByMembers.length === 0 &&
    owingToMembers.length === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, type: "spring" }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-50 dark:to-gray-100 rounded-xl p-4 shadow">
          <h3 className="font-semibold mb-2 flex items-center gap-2 gradient-title"><User className="h-5 w-5 text-green-600" /> Group Balance Overview</h3>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={30}
                  label={({ name }) => name}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`₹${value.toFixed(2)}`, "Net Balance"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-green-50 dark:from-gray-50 dark:to-gray-100 rounded-xl p-4 shadow">
          <h3 className="font-semibold mb-2 flex items-center gap-2 gradient-title"><User className="h-5 w-5 text-teal-600" /> Contributions</h3>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Owes" fill="#f87171" radius={[8, 8, 0, 0]} />
                <Bar dataKey="OwedBy" fill="#36d7b7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="text-center pb-4 border-b">
          <p className="text-sm text-muted-foreground mb-1">Your balance</p>
          <p
            className={`text-2xl font-bold ${
              me.totalBalance > 0
                ? "text-green-600"
                : me.totalBalance < 0
                  ? "text-red-600"
                  : ""
            }`}
          >
            <AnimatedNumber value={me.totalBalance} prefix={me.totalBalance > 0 ? "+₹" : me.totalBalance < 0 ? "-₹" : "₹"} decimals={2} />
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {me.totalBalance > 0
              ? "You are owed money"
              : me.totalBalance < 0
                ? "You owe money"
                : "You are all settled up"}
          </p>
        </div>

        {isAllSettledUp ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Everyone is settled up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {owedByMembers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium flex items-center mb-3">
                  <ArrowUpCircle className="h-4 w-4 text-green-500 mr-2" />
                  Owed to you
                </h3>
                <div className="space-y-3">
                  {owedByMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <motion.div whileHover={{ scale: 1.15, rotate: 6 }}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.imageUrl} />
                            <AvatarFallback>
                              {member.name?.charAt(0) ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                        <span className="text-sm">{member.name}</span>
                      </div>
                      <span className="font-medium text-green-600">
                        ₹{member.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {owingToMembers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium flex items-center mb-3">
                  <ArrowDownCircle className="h-4 w-4 text-red-500 mr-2" />
                  You owe
                </h3>
                <div className="space-y-3">
                  {owingToMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <motion.div whileHover={{ scale: 1.15, rotate: 6 }}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.imageUrl} />
                            <AvatarFallback>
                              {member.name?.charAt(0) ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                        <span className="text-sm">{member.name}</span>
                      </div>
                      <span className="font-medium text-red-600">
                        ₹{member.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
