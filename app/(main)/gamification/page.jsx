import React from 'react';
import StreaksDisplay from '@/components/gamification/streaks-display';
import AchievementsList from '@/components/gamification/achievements-list';
import Leaderboard from '@/components/gamification/leaderboard';
import { PageHeader, PageHeaderTitle, PageHeaderDescription } from '@/components/page-header';

const GamificationPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader>
        <PageHeaderTitle>Your Gamification Hub</PageHeaderTitle>
        <PageHeaderDescription>
          Track your spending streaks and celebrate your achievements!
        </PageHeaderDescription>
      </PageHeader>

      <div className="space-y-8">
        <StreaksDisplay />
        <AchievementsList />
        <Leaderboard />
      </div>
    </div>
  );
};

export default GamificationPage;
