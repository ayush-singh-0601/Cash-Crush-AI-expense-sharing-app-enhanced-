"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, ChevronRight, Sparkles, RefreshCw, Copy, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import Link from "next/link";
import { ExpenseSummary } from "./components/expense-summary";
import { BalanceSummary } from "./components/balance-summary";
import { GroupList } from "./components/group-list";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ConfettiEffect from "@/components/confetti-effect";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList } from 'recharts';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';

export default function Dashboard() {
  const { data: balances, isLoading: balancesLoading } = useConvexQuery(
    api.dashboard.getUserBalances
  );
  const { data: groups, isLoading: groupsLoading } = useConvexQuery(
    api.dashboard.getUserGroups
  );
  const { data: totalSpent, isLoading: totalSpentLoading } = useConvexQuery(
    api.dashboard.getTotalSpent
  );
  const { data: monthlySpending, isLoading: monthlySpendingLoading } =
    useConvexQuery(api.dashboard.getMonthlySpending);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState(null);
  const [showInsights, setShowInsights] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const exportRef = useRef(null);

  const fetchInsights = async () => {
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const res = await fetch("/api/spending-insights");
      const data = await res.json();
      let html = data.html || "";
      html = html.replace(/^```html\s*/i, "").replace(/```\s*$/i, "");
      if (html) {
        setInsights(html);
        setInsightsData(data);
        setLastUpdated(new Date());
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1800);
      } else setInsightsError(data.error || "No insights available.");
    } catch (err) {
      setInsightsError("Failed to load insights.");
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleCopy = () => {
    if (insights) {
      const el = document.createElement("div");
      el.innerHTML = insights;
      navigator.clipboard.writeText(el.innerText);
    }
  };

  // PDF download handler
  const handleDownloadPDF = async () => {
    const input = exportRef.current;
    if (!input) return;
    // Patch: Override all CSS variables with safe hex values
    input.querySelectorAll('*').forEach(el => {
      el.style.setProperty('--primary', '#1e293b');
      el.style.setProperty('--background', '#fff');
      el.style.setProperty('--foreground', '#23272f');
      el.style.setProperty('--card', '#ffffff');
      el.style.setProperty('--card-foreground', '#23272f');
      el.style.setProperty('--popover', '#ffffff');
      el.style.setProperty('--popover-foreground', '#23272f');
      el.style.setProperty('--secondary', '#f3f4f6');
      el.style.setProperty('--secondary-foreground', '#1e293b');
      el.style.setProperty('--muted', '#f3f4f6');
      el.style.setProperty('--muted-foreground', '#6b7280');
      el.style.setProperty('--accent', '#f3f4f6');
      el.style.setProperty('--accent-foreground', '#1e293b');
      el.style.setProperty('--destructive', '#f87171');
      el.style.setProperty('--border', '#e5e7eb');
      el.style.setProperty('--input', '#e5e7eb');
      el.style.setProperty('--ring', '#a7f3d0');
      el.style.setProperty('--chart-1', '#34d399');
      el.style.setProperty('--chart-2', '#60a5fa');
      el.style.setProperty('--chart-3', '#fbbf24');
      el.style.setProperty('--chart-4', '#a78bfa');
      el.style.setProperty('--chart-5', '#f472b6');
    });
    const imgData = await domtoimage.toPng(input);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Add title and date
    pdf.setFontSize(18);
    pdf.text('Spending Insights Report', 40, 40);
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);
    // Add image below title
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth - 80;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 40, 80, pdfWidth, pdfHeight);
    pdf.save('spending-insights.pdf');
  };

  const isLoading =
    balancesLoading ||
    groupsLoading ||
    totalSpentLoading ||
    monthlySpendingLoading;
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-6 space-y-6">
      {/* Spending Insights Card */}
      <Card className="animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3 text-2xl">
            <Sparkles className="h-8 w-8 text-emerald-500" />
            <span className="gradient-title text-2xl md:text-3xl">Spending Insights (AI)</span>
          </div>
          <div className="flex gap-2">
            {showInsights && (
              <>
                <Button size="icon" variant="ghost" onClick={fetchInsights} title="Refresh Insights" aria-label="Refresh Insights">
                  <RefreshCw className={insightsLoading ? "animate-spin" : ""} />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleCopy} title="Copy Insights" aria-label="Copy Insights">
                  <Copy className="" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setShowInsights(false)} title="Hide" aria-label="Hide">
                  −
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        {!showInsights ? (
          <CardContent className="py-8 text-center">
            <Button size="lg" onClick={() => { setShowInsights(true); fetchInsights(); }}>
              <Sparkles className="mr-2 h-5 w-5" /> Show AI Insights
            </Button>
          </CardContent>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
            >
              <CardContent>
                {insightsLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading insights...</div>
                ) : insightsError ? (
                  <div className="py-8 text-center text-red-500">{insightsError}</div>
                ) : (
                  <>
                    <div className="max-w-none text-foreground font-sans font-semibold text-base md:text-lg leading-relaxed" style={{wordBreak: 'break-word'}} dangerouslySetInnerHTML={{ __html: insights }} />
                    {insightsData && insightsData.categories && (
                      <div className="mt-8" id="insights-pdf-section">
                        <h3 className="text-lg font-bold mb-2">Spending by Category</h3>
                        <div className="overflow-x-auto mb-4">
                          <table className="min-w-[320px] w-full border text-sm">
                            <thead>
                              <tr className="bg-muted-foreground/10">
                                <th className="px-3 py-2 text-left">Category</th>
                                <th className="px-3 py-2 text-right">Amount (₹)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(insightsData.categories).map(([cat, amt]) => (
                                <tr key={cat}>
                                  <td className="px-3 py-2">{cat}</td>
                                  <td className="px-3 py-2 text-right">₹{amt.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="w-full h-72 mb-4 bg-white rounded-lg shadow flex items-center justify-center p-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={Object.entries(insightsData.categories).map(([cat, amt]) => ({ category: cat, amount: amt }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="category" tick={{ fontSize: 14, fill: '#374151' }} />
                              <YAxis tick={{ fontSize: 14, fill: '#374151' }} />
                              <Tooltip formatter={v => `₹${Number(v).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`} contentStyle={{ background: '#f3f4f6', borderRadius: 8, color: '#111827' }} />
                              <Legend />
                              <Bar dataKey="amount" fill="#34d399" radius={[8, 8, 0, 0]}>
                                <LabelList dataKey="amount" position="top" formatter={v => `₹${Number(v).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`} style={{ fill: '#111827', fontWeight: 'bold', fontSize: 13 }} />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button variant="outline" className="mb-2" onClick={handleDownloadPDF}>Download as PDF</Button>
                    </div>
                  </>
                )}
              </CardContent>
            </motion.div>
          </AnimatePresence>
        )}
      </Card>
      {/* Owed/Owing/Total Balance Cards Row */}
      {!isLoading && balances && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <Card className="flex flex-col items-center justify-center p-6">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpCircle className="h-6 w-6 text-green-500" />
              <span className="font-semibold text-lg">You Are Owed</span>
            </div>
            <div className="text-2xl font-bold text-green-600">₹{balances.youAreOwed?.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
          </Card>
          <Card className="flex flex-col items-center justify-center p-6">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownCircle className="h-6 w-6 text-red-500" />
              <span className="font-semibold text-lg">You Owe</span>
            </div>
            <div className="text-2xl font-bold text-red-600">₹{balances.youOwe?.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
          </Card>
          <Card className="flex flex-col items-center justify-center p-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-blue-500" />
              <span className="font-semibold text-lg">Total Balance</span>
            </div>
            <div className={`text-2xl font-bold ${balances.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{balances.totalBalance?.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
          </Card>
        </div>
      )}
      {isLoading ? (
        <div className="w-full py-12 flex justify-center">
          <BarLoader width={"100%"} color="#36d7b7" />
        </div>
      ) : (
        <>
          <div className="flex justify-between flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="text-5xl gradient-title">Dashboard</h1>
            <Button asChild>
              <Link href="/expenses/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add expense
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <ExpenseSummary
                monthlySpending={monthlySpending}
                totalSpent={totalSpent}
              />
            </div>
            <div className="flex flex-col items-center justify-start">
              <div className="w-full flex flex-col items-center">
                <BalanceSummary balances={balances} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-2">
            <Card className="h-full min-h-[420px] flex flex-col col-span-1 lg:col-span-2 w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Your Groups</CardTitle>
                  <Button variant="link" asChild className="p-0">
                    <Link href="/contacts">
                      View all
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <GroupList groups={groups} />
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full mt-4">
                  <Link href="/contacts?createGroup=true">
                    <Users className="mr-2 h-4 w-4" />
                    Create new group
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div
          ref={exportRef}
          id="pdf-export-section"
          style={{
            width: '700px',
            background: '#fff',
            color: '#23272f',
            padding: '32px',
            borderRadius: '16px',
            fontFamily: 'Inter, Sora, sans-serif',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}
        >
          {/* Branding */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            <img src="/logos/logo.png" alt="App Logo" style={{ height: 48, marginRight: 16 }} />
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-1px' }}>AI Expense Sharing</div>
              <div style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 500 }}>Your Smart Expense Manager</div>
            </div>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>Spending Insights (AI)</h2>
          {insights && (
            <div
              style={{ marginBottom: 24, fontSize: '1rem', lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: insights }}
            />
          )}
          {insightsData && insightsData.categories && (
            <>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>Spending by Category</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e7eb' }}>Category</th>
                    <th style={{ textAlign: 'right', padding: '8px', border: '1px solid #e5e7eb' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(insightsData.categories).map(([cat, amt]) => (
                    <tr key={cat}>
                      <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{cat}</td>
                      <td style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'right' }}>₹{amt.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ width: '100%', height: 320, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(insightsData.categories).map(([cat, amt]) => ({ category: cat, amount: amt }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="category" tick={{ fontSize: 14, fill: '#374151' }} />
                    <YAxis tick={{ fontSize: 14, fill: '#374151' }} />
                    <Tooltip formatter={v => `₹${Number(v).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`} contentStyle={{ background: '#f3f4f6', borderRadius: 8, color: '#111827' }} />
                    <Legend />
                    <Bar dataKey="amount" fill="#34d399" radius={[8, 8, 0, 0]}>
                      <LabelList dataKey="amount" position="top" formatter={v => `₹${Number(v).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`} style={{ fill: '#111827', fontWeight: 'bold', fontSize: 13 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
          <div className="flex justify-end">
            <Button variant="outline" className="mb-2" onClick={handleDownloadPDF}>Download as PDF</Button>
          </div>
        </div>
      </div>
    </div>
  );
}