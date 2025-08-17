import React from 'react';
import { useConvexQuery } from '@/hooks/use-convex-query';
import { api } from '@/convex/_generated/api';
import { Flame, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StreaksDisplay = () => {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);

  const currentStreak = currentUser?.currentStreak || 0;
  const longestStreak = currentUser?.longestStreak || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Streaks</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg">
          <Flame className="w-10 h-10 text-orange-500 mb-2" />
          <p className="text-2xl font-bold">{currentStreak}</p>
          <p className="text-sm text-muted-foreground">Current Streak</p>
        </div>
        <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg">
          <Star className="w-10 h-10 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold">{longestStreak}</p>
          <p className="text-sm text-muted-foreground">Longest Streak</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreaksDisplay;
