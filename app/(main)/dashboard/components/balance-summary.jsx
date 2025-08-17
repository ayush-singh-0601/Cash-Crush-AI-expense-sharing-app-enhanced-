import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

export function BalanceSummary({ balances }) {
  if (!balances) return null;

  const { oweDetails } = balances;
  const hasOwed = oweDetails.youAreOwedBy.length > 0;
  const hasOwing = oweDetails.youOwe.length > 0;

  const isAllSettled = !hasOwed && !hasOwing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, type: "spring" }}
      className="rounded-3xl p-6 space-y-4 bg-gradient-to-br from-green-300 via-teal-300 to-blue-300 shadow-xl flex flex-col items-center justify-center min-w-[280px] min-h-[420px] max-w-[340px] mx-auto"
      style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)' }}
    >
      <AnimatePresence>
        {isAllSettled && (
          <motion.div
            key="confetti"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="flex justify-center items-center"
          >
            <span className="text-3xl mr-2">🎉</span>
            <span className="text-green-600 font-bold text-lg">All Settled Up!</span>
            <span className="text-3xl ml-2">🎉</span>
          </motion.div>
        )}
      </AnimatePresence>
      {!hasOwed && !hasOwing && (
        <div className="text-center py-6">
          <p className="text-muted-foreground">You're all settled up!</p>
        </div>
      )}

      {hasOwed && (
        <div className="w-full">
          <h3 className="text-base font-semibold flex items-center mb-3 text-green-700">
            <ArrowUpCircle className="h-5 w-5 text-green-500 mr-2" />
            Owed to you
          </h3>
          <div className="space-y-3">
            {oweDetails.youAreOwedBy.map((item) => (
              <Link
                href={`/person/${item.userId}`}
                key={item.userId}
                className="flex items-center justify-between hover:bg-white/20 p-2 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <motion.div whileHover={{ scale: 1.15, rotate: 6 }}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={item.imageUrl} />
                      <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <span className="text-sm font-semibold text-white drop-shadow-lg">{item.name}</span>
                </div>
                <span className="font-bold text-green-600 text-lg">
                  <AnimatedNumber value={item.amount} prefix="₹" decimals={2} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasOwing && (
        <div className="w-full mt-6">
          <h3 className="text-base font-semibold flex items-center mb-3 text-red-700">
            <ArrowDownCircle className="h-5 w-5 text-red-500 mr-2" />
            You owe
          </h3>
          <div className="space-y-3">
            {oweDetails.youOwe.map((item) => (
              <Link
                href={`/person/${item.userId}`}
                key={item.userId}
                className="flex items-center justify-between hover:bg-white/20 p-2 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <motion.div whileHover={{ scale: 1.15, rotate: 6 }}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={item.imageUrl} />
                      <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <span className="text-sm font-semibold text-white drop-shadow-lg">{item.name}</span>
                </div>
                <span className="font-bold text-red-600 text-lg">
                  <AnimatedNumber value={item.amount} prefix="₹" decimals={2} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
