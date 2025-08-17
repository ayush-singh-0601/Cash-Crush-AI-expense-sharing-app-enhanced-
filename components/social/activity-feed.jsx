"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Receipt, 
  DollarSign, 
  MessageCircle, 
  Heart, 
  Users, 
  TrendingUp,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export function ActivityFeed({ groupId }) {
  const activities = useQuery(api.social.getGroupFeed, { groupId, limit: 20 });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case "expense_added":
        return <Receipt className="h-5 w-5 text-green-600" />;
      case "expense_updated":
        return <Receipt className="h-5 w-5 text-blue-600" />;
      case "settlement_made":
        return <DollarSign className="h-5 w-5 text-purple-600" />;
      case "comment_added":
        return <MessageCircle className="h-5 w-5 text-orange-600" />;
      case "reaction_added":
        return <Heart className="h-5 w-5 text-red-600" />;
      default:
        return <TrendingUp className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityColor = (activityType) => {
    switch (activityType) {
      case "expense_added":
        return "bg-green-50 border-green-200";
      case "expense_updated":
        return "bg-blue-50 border-blue-200";
      case "settlement_made":
        return "bg-purple-50 border-purple-200";
      case "comment_added":
        return "bg-orange-50 border-orange-200";
      case "reaction_added":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const renderActivityContent = (activity) => {
    switch (activity.activityType) {
      case "expense_added":
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">{activity.description}</p>
            {activity.relatedExpense && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {activity.relatedExpense.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.metadata?.category && (
                      <Badge variant="secondary" className="mr-2 text-xs">
                        {activity.metadata.category}
                      </Badge>
                    )}
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {new Date(activity.relatedExpense.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(activity.relatedExpense.amount)}
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case "settlement_made":
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">{activity.description}</p>
            {activity.relatedSettlement && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Settlement Payment</p>
                  <p className="text-sm text-gray-500">
                    {activity.relatedSettlement.note || "No note provided"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-600">
                    {formatCurrency(activity.relatedSettlement.amount)}
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case "comment_added":
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">{activity.description}</p>
            {activity.relatedExpense && (
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-sm font-medium text-gray-900">
                  On: {activity.relatedExpense.description}
                </p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(activity.relatedExpense.amount)}
                </p>
              </div>
            )}
          </div>
        );

      case "reaction_added":
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">{activity.description}</p>
            {activity.relatedExpense && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {activity.relatedExpense.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{activity.metadata?.emoji}</span>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(activity.relatedExpense.amount)}
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <p className="text-sm text-gray-700">{activity.description}</p>
        );
    }
  };

  if (!activities) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No activity yet
            </h3>
            <p className="text-gray-500">
              Start adding expenses and interacting with your group to see activity here!
            </p>
          </CardContent>
        </Card>
      ) : (
        activities.map((activity, index) => (
          <motion.div
            key={activity._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-l-4 ${getActivityColor(activity.activityType)}`}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {/* User Avatar */}
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={activity.user.imageUrl} />
                    <AvatarFallback>
                      {activity.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    {/* Activity Header */}
                    <div className="flex items-center gap-2 mb-2">
                      {getActivityIcon(activity.activityType)}
                      <h4 className="font-medium text-gray-900 text-sm">
                        {activity.title}
                      </h4>
                      <span className="text-xs text-gray-500 ml-auto">
                        {formatDistanceToNow(new Date(activity.createdAt), { 
                          addSuffix: true 
                        })}
                      </span>
                    </div>

                    {/* Activity Content */}
                    {renderActivityContent(activity)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  );
}
