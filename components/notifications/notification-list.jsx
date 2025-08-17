"use client";

import { useRouter } from 'next/navigation';
import { useConvexMutation } from '@/hooks/use-convex-query';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function NotificationItem({ notification, onNotificationClick }) {
  const router = useRouter();
  const markAsRead = useConvexMutation(api.notifications.markAsRead);

  const handleClick = () => {
    if (!notification.read) {
      markAsRead.mutate({ notificationId: notification._id });
    }
    if (notification.link) {
      router.push(notification.link);
    }
    onNotificationClick();
  };

  return (
    <div
      className={`p-3 flex items-start gap-3 hover:bg-muted/50 cursor-pointer transition-colors ${
        notification.read ? 'opacity-60' : ''
      }`}
      onClick={handleClick}
    >
      {!notification.read && (
        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
      )}
      <div className="flex-grow ml-2">
        <p className="font-semibold text-sm">{notification.title}</p>
        <p className="text-xs text-muted-foreground">{notification.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

export function NotificationList({ notifications, closePopover }) {
  const markAllAsRead = useConvexMutation(api.notifications.markAllAsRead);

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    markAllAsRead.mutate({});
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex justify-between items-center">
        <h4 className="font-semibold">Notifications</h4>
        <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
          <CheckCheck className="h-4 w-4 mr-2" />
          Mark all as read
        </Button>
      </div>
      <ScrollArea className="flex-grow h-[300px]">
        {notifications && notifications.length > 0 ? (
          notifications.map(n => (
            <NotificationItem key={n._id} notification={n} onNotificationClick={closePopover} />
          ))
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            You have no notifications.
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
