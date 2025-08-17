"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ArrowLeftRight, ArrowLeft, PieChart as PieIcon, TrendingUp, Mail } from "lucide-react";
import { ExpenseList } from "@/components/expense-list";
import { PaymentReminder } from "@/components/payment-reminder";
import { SettlementList } from "@/components/settlement-list";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Legend } from "recharts";
import { motion } from "framer-motion";


function AnimatedNumber({ value, prefix = "", decimals = 2, className = "" }) {
  const [display, setDisplay] = useState(0);
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

function TotalSpent({ userId }) {
  const { data, isLoading } = useConvexQuery(api.dashboard.getTotalSpent);
  if (isLoading) return <span className="text-2xl font-bold animate-pulse">...</span>;
  return <span className="text-2xl font-bold text-green-600">₹{data?.toLocaleString() || 0}</span>;
}

function UserGroupsCount({ userId }) {
  const { data, isLoading } = useConvexQuery(api.dashboard.getUserGroups);
  if (isLoading) return <span className="text-2xl font-bold animate-pulse">...</span>;
  return <span className="text-2xl font-bold text-teal-600">{data?.length || 0}</span>;
}

function UserContactsCount({ userId }) {
  const { data, isLoading } = useConvexQuery(api.contacts.getAllContacts);
  if (isLoading) return <span className="text-2xl font-bold animate-pulse">...</span>;
  return <span className="text-2xl font-bold text-blue-600">{data?.filter?.(c => c.type === "user").length || 0}</span>;
}

export default function PersonExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("expenses");
  const { data: currentUser, isLoading: userLoading } = useConvexQuery(api.users.getCurrentUser);
  
  // Check if user is viewing their own profile
  const isViewingSelf = currentUser?._id === params.id;
  
  // Always call the hook with consistent parameters to maintain hook order
  // Use Convex's "skip" pattern for conditional queries
  const data = useQuery(
    api.expenses.getExpensesBetweenUsers,
    !isViewingSelf && params.id ? { userId: params.id } : "skip"
  );
  const isLoading = data === undefined;
  
  // Wait for currentUser to load //
  if (userLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  // Handle self-query case
  if (isViewingSelf) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring" }}
        className="container mx-auto py-10 max-w-2xl"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Avatar className="h-28 w-28 shadow-xl border-4 border-white premium-gradient">
              <AvatarImage src={currentUser?.imageUrl} />
              <AvatarFallback className="text-4xl">
                {currentUser?.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-extrabold gradient-title mb-2">{currentUser?.name}</h1>
            <p className="text-lg text-muted-foreground mb-1">{currentUser?.email}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-6">
            <Card className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-50 dark:to-gray-100 text-center">
              <CardHeader className="pb-1">
                <CardTitle className="text-lg gradient-title">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <TotalSpent userId={currentUser._id} />
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-teal-50 to-green-50 dark:from-gray-50 dark:to-gray-100 text-center">
              <CardHeader className="pb-1">
                <CardTitle className="text-lg gradient-title">Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <UserGroupsCount userId={currentUser._id} />
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-50 dark:to-gray-100 text-center">
              <CardHeader className="pb-1">
                <CardTitle className="text-lg gradient-title">Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <UserContactsCount userId={currentUser._id} />
              </CardContent>
            </Card>
          </div>
          <div className="mt-8 w-full space-y-6">
            <Card className="bg-white/80 dark:bg-card/80 shadow-lg rounded-3xl p-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl gradient-title">Your Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-lg mb-2">Welcome to your premium Cash Crush profile! Here you can see your stats, groups, and contacts. Use the navigation below to explore your dashboard, manage groups, or add new expenses.</p>
                <div className="flex flex-wrap gap-3 justify-center mt-4">
                  <Button asChild variant="outline">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/groups">Your Groups</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/contacts">Your Contacts</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/expenses/new">Add Expense</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  const otherUser = data?.otherUser;
  const expenses = data?.expenses || [];
  const settlements = data?.settlements || [];
  const balance = data?.balance || 0;
  
  // Debug logging
  console.log('PersonExpensesPage data:', { data, otherUser, balance, expenses: expenses.length });

  const COLORS = ["#36d7b7", "#6ee7b7", "#fbbf24", "#f472b6", "#60a5fa", "#a78bfa", "#f87171", "#facc15", "#34d399", "#818cf8"];
  // Prepare chart data
  const categoryMap = {};
  expenses.forEach((e) => {
    const cat = e.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + e.splits.find(s => s.userId === otherUser.id || s.userId === undefined)?.amount || 0;
  });
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  const trendData = expenses
    .map((e) => ({
      date: new Date(e.date).toLocaleDateString(),
      amount: e.splits.find(s => s.userId === otherUser.id || s.userId === undefined)?.amount || 0,
    }))
    .reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, type: "spring" }}
      className="container mx-auto py-6 max-w-4xl"
    >
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.12, rotate: 6 }}>
              <Avatar className="h-16 w-16">
                <AvatarImage src={otherUser?.imageUrl} />
                <AvatarFallback>
                  {otherUser?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <div>
              <h1 className="text-4xl gradient-title">{otherUser?.name}</h1>
              <p className="text-muted-foreground">{otherUser?.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/settlements/user/${params.id}`}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Settle up
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/expenses/new`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add expense
              </Link>
            </Button>
            
            {balance > 0 && otherUser?.id && otherUser?.name && otherUser?.email ? (
              <PaymentReminder 
                userId={otherUser.id} 
                userName={otherUser.name} 
                userEmail={otherUser.email} 
                amount={Math.abs(balance)} 
              />
            ) : (
              <div className="border-2 border-blue-500 p-2 bg-blue-50 text-xs">
                <p>PaymentReminder not shown because:</p>
                <p>Balance &gt; 0: {balance > 0}</p>
                <p>Has otherUser.id: {!!otherUser?.id}</p>
                <p>Has otherUser.name: {!!otherUser?.name}</p>
                <p>Has otherUser.email: {!!otherUser?.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Chart Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                        <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-50 dark:to-gray-100 rounded-xl p-4 shadow">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><PieIcon className="h-5 w-5 text-green-600" /> Shared Expense Categories</h3>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={30}
                  label={({ name }) => name}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, "Total"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
                        <div className="bg-gradient-to-br from-teal-50 to-green-50 dark:from-gray-50 dark:to-gray-100 rounded-xl p-4 shadow">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-teal-600" /> Shared Expense Trend</h3>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#36d7b7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <Card className="mb-6">
        <CardHeader className="pb-2">
                                                     <CardTitle className="text-xl gradient-title">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              {balance === 0 ? (
                <p>You are all settled up</p>
              ) : balance > 0 ? (
                <p>
                  <span className="font-medium">{otherUser?.name}</span> owes
                  you
                </p>
              ) : (
                <p>
                  You owe <span className="font-medium">{otherUser?.name}</span>
                </p>
              )}
            </div>
            <div
              className={`text-2xl font-bold ${balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : ""}`}
            >
              <AnimatedNumber value={Math.abs(balance)} prefix="₹" decimals={2} />
            </div>
          </div>
        </CardContent>
      </Card>


      <Tabs
        defaultValue="expenses"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">
            Expenses ({expenses.length})
          </TabsTrigger>
          <TabsTrigger value="settlements">
            Settlements ({settlements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseList
            expenses={expenses}
            showOtherPerson={false}
            otherPersonId={params.id}
            userLookupMap={{ [otherUser.id]: otherUser }}
          />
        </TabsContent>

        <TabsContent value="settlements" className="space-y-4">
          <SettlementList
            settlements={settlements}
            userLookupMap={{ [otherUser.id]: otherUser }}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
