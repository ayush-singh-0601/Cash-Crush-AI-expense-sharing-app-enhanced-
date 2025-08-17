import React from 'react';
import { useConvexQuery } from '@/hooks/use-convex-query';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trophy } from 'lucide-react';

const AchievementItem = ({ achievement }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center justify-center p-2 text-center">
          <span className="text-4xl">{achievement.icon}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-bold">{achievement.name}</p>
        <p>{achievement.description}</p>
        <p className="text-xs text-muted-foreground">
          Achieved on: {new Date(achievement.achievedAt).toLocaleDateString()}
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const AchievementsList = () => {
  const { data: achievements, isLoading } = useConvexQuery(api.gamification.getMyAchievements);

  if (isLoading) {
    return <div>Loading achievements...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        {achievements && achievements.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
            {achievements.map((ach) => (
              <AchievementItem key={ach._id} achievement={ach} />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Trophy className="w-12 h-12 mx-auto mb-2" />
            <p>No achievements unlocked yet.</p>
            <p className="text-sm">Keep adding expenses to earn them!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementsList;
