import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function DELETE() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client to guarantee profile + auth deletion
    const serviceClient = createServiceRoleClient();

    const { error } = await serviceClient.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("Account deletion (auth) failed:", error.message);
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    const { error: profileDeleteError } = await serviceClient
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (profileDeleteError) {
      console.error("Account deletion (profile) failed:", profileDeleteError.message);
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Account deletion error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
