"use client";

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useConvexQuery } from '@/hooks/use-convex-query';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationList } from './notification-list';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export function NotificationBell() {
  const { data: notifications } = useConvexQuery(api.notifications.getMyNotifications, {});
  const [isOpen, setIsOpen] = useState(false);
  const [toastedIds, setToastedIds] = useState(new Set());

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  useEffect(() => {
    if (notifications) {
      const newUnread = notifications.filter(n => !n.read && !toastedIds.has(n._id));
      if (newUnread.length > 0) {
        const latestNotification = newUnread.sort((a, b) => b.createdAt - a.createdAt)[0];
        toast.info(latestNotification.title, {
          description: latestNotification.description,
        });
        setToastedIds(prev => new Set([...prev, ...newUnread.map(n => n._id)]));
      }
    }
  }, [notifications, toastedIds]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
              >
                {unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <NotificationList notifications={notifications} closePopover={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
