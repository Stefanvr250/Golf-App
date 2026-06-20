import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FriendsPageClient } from "./FriendsPageClient";

export default async function FriendsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <FriendsPageClient userId={user.id} />;
}
