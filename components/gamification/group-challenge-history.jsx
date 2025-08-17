import React from 'react';
import { useConvexQuery } from '@/hooks/use-convex-query';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { History, CheckCircle2, XCircle } from 'lucide-react';

const GroupChallengeHistory = ({ groupId }) => {
  const { data: challenges, isLoading } = useConvexQuery(
    api.gamification.getChallengeHistoryForGroup,
    { groupId }
  );

  if (isLoading) {
    return <div>Loading history...</div>;
  }

  if (!challenges || challenges.length === 0) {
    return null; // No history to display
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-6 h-6 text-gray-500" />
          Challenge History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-4">
            {challenges.map(challenge => (
              <div key={challenge._id} className="flex items-center justify-between p-2 rounded-lg border">
                <div>
                  <p className="font-semibold">{challenge.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Ended on {format(new Date(challenge.endDate), 'PPP')}
                  </p>
                </div>
                <Badge variant={challenge.status === 'completed' ? 'success' : 'destructive'}>
                  {challenge.status === 'completed' ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                  {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default GroupChallengeHistory;
