"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, Check, X, Loader2 } from "lucide-react";

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  handicap_index: number | null;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  profile: Profile;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function FriendsList({ userId }: { userId: string }) {
  const supabase = React.useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [friends, setFriends] = React.useState<Friendship[]>([]);
  const [incoming, setIncoming] = React.useState<Friendship[]>([]);
  const [outgoing, setOutgoing] = React.useState<Friendship[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Profile[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [sendingTo, setSendingTo] = React.useState<string | null>(null);
  const [respondingTo, setRespondingTo] = React.useState<string | null>(null);

  // Fetch friendships
  const fetchFriendships = React.useCallback(async () => {
    // Friendships where I'm the requester
    const { data: asRequester } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status, created_at, profile:profiles!friendships_addressee_id_fkey(id, display_name, avatar_url, handicap_index)")
      .eq("requester_id", userId);

    // Friendships where I'm the addressee
    const { data: asAddressee } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status, created_at, profile:profiles!friendships_requester_id_fkey(id, display_name, avatar_url, handicap_index)")
      .eq("addressee_id", userId);

    const normalize = (rows: any[]): Friendship[] =>
      (rows ?? []).map((r) => ({
        ...r,
        profile: Array.isArray(r.profile) ? r.profile[0] : r.profile,
      }));

    const reqRows = normalize(asRequester ?? []);
    const addRows = normalize(asAddressee ?? []);

    // Accepted = friends
    const accepted = [
      ...reqRows.filter((r) => r.status === "accepted"),
      ...addRows.filter((r) => r.status === "accepted"),
    ];

    // Incoming = pending where I'm the addressee
    const inc = addRows.filter((r) => r.status === "pending");

    // Outgoing = pending where I'm the requester
    const out = reqRows.filter((r) => r.status === "pending");

    setFriends(accepted);
    setIncoming(inc);
    setOutgoing(out);
    setLoading(false);
  }, [supabase, userId]);

  React.useEffect(() => {
    fetchFriendships();
  }, [fetchFriendships]);

  // Search users
  const handleSearch = React.useCallback(async () => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, handicap_index")
      .ilike("display_name", `%${q}%`)
      .neq("id", userId)
      .limit(10);

    setSearchResults(data ?? []);
    setSearching(false);
  }, [supabase, searchQuery, userId]);

  // Debounced search
  React.useEffect(() => {
    const timeout = setTimeout(handleSearch, 400);
    return () => clearTimeout(timeout);
  }, [handleSearch]);

  // Send friend request
  async function sendRequest(addresseeId: string) {
    setSendingTo(addresseeId);
    const { error } = await supabase.from("friendships").insert({
      requester_id: userId,
      addressee_id: addresseeId,
    });

    if (error) {
      toast({
        title: "Could not send request",
        description: error.message.includes("duplicate")
          ? "Friend request already sent."
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Friend request sent!" });
      setSearchQuery("");
      setSearchResults([]);
      fetchFriendships();
    }
    setSendingTo(null);
  }

  // Respond to request
  async function respondToRequest(friendshipId: string, status: "accepted" | "declined") {
    setRespondingTo(friendshipId);
    const { error } = await supabase
      .from("friendships")
      .update({ status })
      .eq("id", friendshipId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "accepted" ? "Friend added!" : "Request declined." });
      fetchFriendships();
    }
    setRespondingTo(null);
  }

  // Check if a search result already has a relationship
  function getRelationship(profileId: string): string | null {
    if (friends.some((f) => f.profile.id === profileId)) return "friend";
    if (outgoing.some((f) => f.profile.id === profileId)) return "pending";
    if (incoming.some((f) => f.profile.id === profileId)) return "incoming";
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search players by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Search results */}
      {searchQuery.trim().length >= 2 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Search Results</p>
          {searching ? (
            <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching...
            </div>
          ) : searchResults.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">No players found.</p>
          ) : (
            searchResults.map((profile) => {
              const rel = getRelationship(profile.id);
              return (
                <div
                  key={profile.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(profile.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{profile.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        HCP: {profile.handicap_index ?? "—"}
                      </p>
                    </div>
                  </div>
                  {rel === "friend" ? (
                    <Badge variant="secondary">Friends</Badge>
                  ) : rel === "pending" ? (
                    <Badge variant="outline">Pending</Badge>
                  ) : rel === "incoming" ? (
                    <Badge variant="outline">Respond</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendRequest(profile.id)}
                      disabled={sendingTo === profile.id}
                    >
                      {sendingTo === profile.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Add
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Friend Requests ({incoming.length})
          </p>
          {incoming.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={req.profile.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(req.profile.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{req.profile.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    HCP: {req.profile.handicap_index ?? "—"}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => respondToRequest(req.id, "accepted")}
                  disabled={respondingTo === req.id}
                >
                  {respondingTo === req.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => respondToRequest(req.id, "declined")}
                  disabled={respondingTo === req.id}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Outgoing pending */}
      {outgoing.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Sent Requests ({outgoing.length})
          </p>
          {outgoing.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={req.profile.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(req.profile.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{req.profile.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    HCP: {req.profile.handicap_index ?? "—"}
                  </p>
                </div>
              </div>
              <Badge variant="outline">Pending</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Friends list */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Friends ({friends.length})
        </p>
        {friends.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No friends yet. Search for players above to add friends.
            </CardContent>
          </Card>
        ) : (
          friends.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={f.profile.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(f.profile.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{f.profile.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    HCP: {f.profile.handicap_index ?? "—"}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Friend</Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
