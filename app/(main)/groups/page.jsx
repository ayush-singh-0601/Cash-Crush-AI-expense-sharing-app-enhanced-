"use client";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, PlusCircle, GroupIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { CreateGroupModal } from "@/app/(main)/contacts/components/create-group-modal";

export default function GroupsPage() {
  const { data: groups, isLoading } = useConvexQuery(api.dashboard.getUserGroups);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  return (
    <>
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring" }}
        className="container mx-auto py-10 max-w-4xl"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold gradient-title mb-1">Your Groups</h1>
            <p className="text-muted-foreground text-lg">All the groups you are a part of, with balances and details.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/groups/join">
                <Users className="mr-2 h-5 w-5" /> Join Group
              </Link>
            </Button>
            <Button onClick={() => setIsCreateGroupModalOpen(true)}>
              <PlusCircle className="mr-2 h-5 w-5" /> Create Group
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="animate-pulse h-40" />
            ))
          ) : groups && groups.length > 0 ? (
            groups.map((group) => (
              <Card key={group.id} className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-50 dark:to-gray-100 shadow-xl rounded-3xl border-2 border-white/80">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={group.imageUrl} />
                    <AvatarFallback className="text-2xl">
                      {group.name?.charAt(0) || <GroupIcon />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl font-bold gradient-title mb-1">{group.name}</CardTitle>
                    <p className="text-gray-600 dark:text-gray-700 text-base line-clamp-2">{group.description || "No description provided."}</p>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 mt-2">
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-600 dark:text-gray-600" />
                      <span className="font-semibold text-gray-600 dark:text-gray-600">{group.memberCount || group.members?.length || 1} members</span>
                    </div>
                    <div className={`rounded-full px-4 py-1 font-semibold text-lg shadow ${group.balance > 0 ? "bg-green-100 text-green-700" : group.balance < 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                      {group.balance === 0 ? "Settled" : group.balance > 0 ? `You are owed ₹${group.balance.toLocaleString()}` : `You owe ₹${Math.abs(group.balance).toLocaleString()}`}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href={`/groups/${group.id}`}>View Group</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-2 text-center py-12">
              <CardContent>
                <h2 className="text-2xl font-bold mb-2">You are not part of any groups yet.</h2>
                <p className="text-muted-foreground mb-4">Join or create a group to start sharing expenses with friends!</p>
                <div className="flex gap-2 justify-center">
                  <Button asChild variant="outline">
                    <Link href="/groups/join">Join Group</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/groups/new">Create Group</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </>
  );
} 