"use client";

import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import React from "react";

export function GroupMembers({ members, groupId }) {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const removeMember = useConvexMutation(api.groups.removeGroupMember);
  const isAdmin = members.some((m) => m.id === currentUser?._id && m.role === "admin");
  const [removingId, setRemovingId] = React.useState(null);

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No members in this group
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isCurrentUser = member.id === currentUser?._id;
        const isMemberAdmin = member.role === "admin";
        return (
          <div key={member.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.imageUrl} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {isCurrentUser ? "You" : member.name}
                  </span>
                  {isCurrentUser && (
                    <Badge variant="outline" className="text-xs py-0 h-5">
                      You
                    </Badge>
                  )}
                </div>
                {isMemberAdmin && (
                  <span className="text-xs text-muted-foreground">Admin</span>
                )}
              </div>
            </div>
            {/* Remove member button for admin, not for self */}
            {isAdmin && !isCurrentUser && (
              <button
                className="ml-2 text-destructive hover:text-red-700 p-1 rounded transition-colors"
                title="Remove member"
                disabled={removingId === member.id}
                onClick={async () => {
                  setRemovingId(member.id);
                  await removeMember.mutate({ groupId, userId: member.id });
                  setRemovingId(null);
                }}
              >
                {removingId === member.id ? (
                  <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-destructive rounded-full inline-block" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
