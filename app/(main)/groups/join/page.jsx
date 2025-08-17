"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function JoinGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get("groupId");
  const isValidGroupId = typeof groupId === "string" && /^[A-Za-z0-9_-]{22}$/.test(groupId);
  const joinGroup = useConvexMutation(api.groups.joinGroupById);
  const { data: group, isLoading: groupLoading, error: groupError } = isValidGroupId ? useConvexQuery(api.groups.getGroupById, { groupId }) : { data: null, isLoading: false, error: "Invalid or missing group ID" };
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    async function join() {
      if (!isValidGroupId) {
        setStatus("error");
        setError("Invalid or missing group ID.");
        return;
      }
      try {
        await joinGroup.mutate({ groupId });
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setError(err.message || "Failed to join group.");
      }
    }
    join();
    // eslint-disable-next-line
  }, [groupId]);

  if (!isValidGroupId || groupError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 dark:from-[#1a2e2b] dark:to-[#1a1f1e]">
        <Card className="glass premium-gradient shadow-2xl max-w-md w-full p-6">
          <CardHeader>
            <CardTitle>Join Group</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="text-lg font-semibold text-red-600">Invalid or missing group ID, or group not found.</div>
            <Button className="mt-2" variant="outline" onClick={() => router.push("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 dark:from-[#1a2e2b] dark:to-[#1a1f1e]">
      <Card className="glass premium-gradient shadow-2xl max-w-md w-full p-6">
        <CardHeader>
          <CardTitle>Join Group</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <div>Joining group...</div>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div className="text-lg font-semibold text-green-700">Successfully joined the group!</div>
              {group && <div className="text-white font-bold text-xl">{group.name}</div>}
              <Button className="mt-2" onClick={() => router.push(`/groups/${groupId}`)}>
                Go to Group
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="text-lg font-semibold text-red-600">{error}</div>
              <Button className="mt-2" variant="outline" onClick={() => router.push("/")}>Go Home</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 