import Link from "next/link";
import { Users } from "lucide-react";
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

export function GroupList({ groups }) {
  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No groups yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a group to start tracking shared expenses
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, type: "spring" }}
      className="glass shadow-lg p-4 flex flex-col gap-3 w-full h-full flex-1"
      style={{ minHeight: '100%' }}
    >
      {groups.map((group) => {
        const balance = group.balance || 0;
        const hasBalance = balance !== 0;

        return (
          <Link
            href={`/groups/${group.id}`}
            key={group.id}
            className="flex flex-col gap-0 bg-white rounded-2xl px-4 py-3 shadow-sm hover:bg-gray-50 transition-colors w-full flex-1"
            style={{ overflow: 'hidden', minHeight: '72px' }}
          >
            <div className="flex flex-row items-center justify-between min-w-0 w-full">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="bg-gray-100 rounded-full p-2 flex items-center justify-center">
                  <Users className="h-6 w-6 text-gray-500" />
                </div>
                <span className="font-semibold text-base truncate max-w-[180px] text-gray-900">{group.name}</span>
              </div>
              {hasBalance && (
                <span
                  className={`text-base font-semibold whitespace-nowrap ml-2 ${
                    balance > 0 ? "text-green-600" : "text-red-600"
                  }`}
                  style={{ flexShrink: 0 }}
                >
                  <span className="mr-1">{balance > 0 ? "+" : "-"}</span>
                  ₹{Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1 ml-12 truncate">
              {group.members.length} members
            </div>
          </Link>
        );
      })}
    </motion.div>
  );
}
