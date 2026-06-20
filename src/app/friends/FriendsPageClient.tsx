"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FriendsList } from "@/components/social/FriendsList";
import { ActivityFeed } from "@/components/social/ActivityFeed";
import { Users, Activity } from "lucide-react";

export function FriendsPageClient({ userId }: { userId: string }) {
  return (
    <div className="container max-w-2xl space-y-6 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Friends</h1>

      <Tabs defaultValue="friends">
        <TabsList className="w-full">
          <TabsTrigger value="friends" className="flex-1">
            <Users className="mr-1.5 h-4 w-4" />
            Friends
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">
            <Activity className="mr-1.5 h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-4">
          <FriendsList userId={userId} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ActivityFeed userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
