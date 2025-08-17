"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ArrowLeftRight, ArrowLeft, Users, Edit, Trash2, Mail, MessageCircle } from "lucide-react";
import { ExpenseList } from "@/components/expense-list";
import { SettlementList } from "@/components/settlement-list";
import { GroupBalances } from "@/components/group-balances";
import { GroupMembers } from "@/components/group-members";
import { PaymentReminder } from "@/components/payment-reminder";
import { motion } from "framer-motion";
import React, { Component } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import GroupChallengeDisplay from "@/components/gamification/group-challenge-display";
import CreateGroupChallengeForm from "@/components/gamification/create-group-challenge-form";
import GroupChallengeHistory from "@/components/gamification/group-challenge-history";

function AnimatedNumber({ value, prefix = "", decimals = 2, className = "" }) {
  const [display, setDisplay] = useState(0);
  React.useEffect(() => {
    let start = display;
    let end = value;
    if (start === end) return;
    let raf;
    const duration = 800;
    const startTime = performance.now();
    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(start + (end - start) * progress);
      if (progress < 1) raf = requestAnimationFrame(animate);
      else setDisplay(end);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, [value]);
  return (
    <span className={className}>{prefix}{display.toFixed(decimals)}</span>
  );
}

// ErrorBoundary component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // You can log errorInfo here if needed
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[40vh]">
          <h2 className="text-2xl font-bold mb-4 text-destructive">{this.state.error?.message?.includes("not found") ? "Group not found or has been deleted." : this.state.error?.message || String(this.state.error)}</h2>
          <Button onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function GroupExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id;
  const isValidGroupId = typeof groupId === "string" && groupId.length > 0;
  const [activeTab, setActiveTab] = useState("expenses");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [queryError, setQueryError] = useState(null);


  const result = useConvexQuery(api.groups.getGroupExpenses, { groupId });
  const data = result.data;
  const isLoading = result.isLoading;
  const error = result.error;
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);

  if (!isValidGroupId) {
    return (
      <div className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[40vh]">
        <h2 className="text-2xl font-bold mb-4 text-destructive">Invalid or missing group ID in the URL.</h2>
        <Button onClick={() => router.push("/groups")}>Go to Groups</Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[40vh]">
        <h2 className="text-2xl font-bold mb-4 text-destructive">{error.message || error || "This group could not be loaded. It may not exist, or you may not be a member."}</h2>
        <Button onClick={() => router.push("/groups")}>Go to Groups</Button>
      </div>
    );
  }

  const group = data?.group;
  const members = data?.members || [];
  const expenses = data?.expenses || [];
  const settlements = data?.settlements || [];
  const balances = data?.balances || [];
  const userLookupMap = data?.userLookupMap || {};

  const isAdmin = members.some(
    (m) => m.id === currentUser?._id && m.role === "admin"
  );

  const editGroup = useConvexMutation(api.groups.editGroup);
  const deleteGroup = useConvexMutation(api.groups.deleteGroup);
  const removeMember = useConvexMutation(api.groups.removeGroupMember);

  // Edit modal state
  const [editName, setEditName] = useState(group?.name || "");
  const [editDescription, setEditDescription] = useState(group?.description || "");
  const [editImageUrl, setEditImageUrl] = useState(group?.imageUrl || "");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  React.useEffect(() => {
    setEditName(group?.name || "");
    setEditDescription(group?.description || "");
    setEditImageUrl(group?.imageUrl || "");
  }, [group]);

  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      await editGroup.mutate({
        groupId: group.id,
        name: editName,
        description: editDescription,
        imageUrl: editImageUrl,
      });
      toast.success("Group updated");
      setShowEditModal(false);
    } catch (e) {
      toast.error(e.message || "Failed to update group");
    }
    setEditLoading(false);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteGroup.mutate({ groupId: group.id });
      toast.success("Group deleted");
      router.push("/dashboard");
    } catch (e) {
      toast.error(e.message || "Failed to delete group");
    }
    setDeleteLoading(false);
    setShowDeleteConfirm(false);
  };

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring" }}
        className="container mx-auto py-6 max-w-4xl"
      >
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            className="mb-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              {/* Group profile picture */}
              <Avatar className="h-20 w-20 shadow-md">
                <AvatarImage src={group?.imageUrl} alt={group?.name} />
                <AvatarFallback>{group?.name?.charAt(0) || "G"}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-4xl gradient-title flex items-center gap-2">{group?.name}
                  {isAdmin && (
                    <Button size="icon" variant="ghost" className="ml-2" onClick={() => setShowEditModal(true)}>
                      <Edit className="h-5 w-5" />
                    </Button>
                  )}
                </h1>
                <p className="text-muted-foreground">{group?.description}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {members.length} members
                </p>
              </div>
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              {isAdmin && <CreateGroupChallengeForm groupId={groupId} />}
              <Button asChild variant="outline">
                <Link href={`/groups/${params.id}/social`}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Social Hub
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/settlements/group/${params.id}`}>
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Settle up
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/expenses/new`}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add expense
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Group Challenge Display */}
        <div className="my-6">
            <GroupChallengeDisplay groupId={groupId} />
            <GroupChallengeHistory groupId={groupId} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl gradient-title">Group Balances</CardTitle>
              </CardHeader>
              <CardContent>
                <GroupBalances balances={balances} />
                {balances && balances.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-medium">Send Payment Reminders</h3>
                      {/* Optionally, you can add a main reminder button here for all */}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {balances.filter(b => b.amount < 0).length > 0 ? (
                        balances.filter(b => b.amount < 0).map(balance => (
                          <PaymentReminder
                            key={balance.userId}
                            userId={balance.userId}
                            userName={balance.userName}
                            userEmail={userLookupMap[balance.userId]?.email}
                            amount={Math.abs(balance.amount)}
                            isGroup={true}
                          />
                        ))
                      ) : (
                        <Button variant="outline" size="sm" disabled title="No one owes money right now">
                          <Mail className="h-4 w-4" />
                          Send Reminder
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl gradient-title">Members</CardTitle>
              </CardHeader>
              <CardContent>
                <GroupMembers members={members} groupId={group?.id} />
              </CardContent>
            </Card>
          </div>
        </div>
        <Tabs
          defaultValue="expenses"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expenses">
              Expenses ({expenses.length})
            </TabsTrigger>
            <TabsTrigger value="settlements">
              Settlements ({settlements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4">
            <ExpenseList
              expenses={expenses}
              showOtherPerson={true}
              isGroupExpense={true}
              userLookupMap={userLookupMap}
            />
          </TabsContent>

          <TabsContent value="settlements" className="space-y-4">
            <SettlementList
              settlements={settlements}
              isGroupSettlement={true}
              userLookupMap={userLookupMap}
            />
          </TabsContent>
        </Tabs>

        {/* Edit Group Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-2">
                <Label>Group Profile Picture</Label>
                <Avatar className="h-16 w-16 mb-2">
                  <AvatarImage src={editImageUrl} />
                  <AvatarFallback>{editName?.charAt(0) || "G"}</AvatarFallback>
                </Avatar>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setEditImageUrl(ev.target.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Group Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Members</Label>
                <div className="flex flex-col gap-2">
                  {members.map((member) => {
                    const isCurrentUser = member.id === currentUser?._id;
                    return (
                      <div key={member.id} className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={member.imageUrl} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{isCurrentUser ? "You" : member.name}</span>
                          {member.role === "admin" && (
                            <span className="text-xs text-muted-foreground ml-1">Admin</span>
                          )}
                        </div>
                        {!isCurrentUser && (
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={removingId === member.id}
                            onClick={async () => {
                              setRemovingId(member.id);
                              try {
                                await removeMember.mutate({ groupId: group.id, userId: member.id });
                                toast.success("Member removed");
                              } catch (e) {
                                toast.error(e.message || "Failed to remove member");
                              }
                              setRemovingId(null);
                            }}
                          >
                            {removingId === member.id ? (
                              <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-destructive rounded-full inline-block" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={editLoading}>
                Cancel
              </Button>
              <Button onClick={handleEditSave} loading={editLoading ? true : undefined} disabled={editLoading}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </ErrorBoundary>
  );
}
