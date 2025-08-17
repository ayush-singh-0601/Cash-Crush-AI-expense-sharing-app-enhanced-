import React from 'react';
import { useConvexQuery } from '@/hooks/use-convex-query';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar, Flag } from 'lucide-react';
import { format } from 'date-fns';

const GroupChallengeDisplay = ({ groupId }) => {
  const { data: challenge, isLoading } = useConvexQuery(
    api.gamification.getActiveChallengeForGroup,
    { groupId }
  );

  if (isLoading) {
    return <div>Loading challenge...</div>;
  }

  if (!challenge) {
    return null; // No active challenge to display
  }

  const progress = Math.min((challenge.currentAmount / challenge.goalAmount) * 100, 100);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="w-6 h-6 text-green-600" />
          Active Group Challenge: {challenge.name}
        </CardTitle>
        <CardDescription>{challenge.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-muted-foreground">Progress</span>
            <span className="text-sm font-bold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span>Goal: ₹{challenge.goalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Ends: {format(new Date(challenge.endDate), 'PPP')}</span>
          </div>
        </div>
        <div className="text-center text-xs text-muted-foreground pt-2">
          Current: ₹{challenge.currentAmount.toLocaleString('en-IN')} / ₹{challenge.goalAmount.toLocaleString('en-IN')}
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupChallengeDisplay;
