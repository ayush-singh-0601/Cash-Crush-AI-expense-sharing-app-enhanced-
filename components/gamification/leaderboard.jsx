"use client";

import React from 'react';
import { useConvexQuery } from '@/hooks/use-convex-query';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Star } from 'lucide-react';

const Leaderboard = () => {
  const { data: leaderboard, isLoading } = useConvexQuery(api.gamification.getLeaderboard);

  if (isLoading) {
    return <div>Loading leaderboard...</div>;
  }

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-400';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Spenders Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {leaderboard && leaderboard.map((user, index) => (
            <li key={user.rank} className="flex items-center gap-4 p-2 rounded-lg bg-gray-50">
              <div className={`flex items-center justify-center w-8 font-bold text-lg ${getRankColor(user.rank)}`}>
                {user.rank === 1 ? <Crown /> : user.rank}
              </div>
              <Avatar>
                <AvatarImage src={user.imageUrl} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <p className="font-semibold flex-grow">{user.name}</p>
              <div className="flex items-center gap-2 text-yellow-500">
                <Star className="w-5 h-5" />
                <span className="font-bold">{user.longestStreak}</span>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
