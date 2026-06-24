import { NextResponse } from "next/server";
import { getDonors, addDonor } from "@/lib/donors-store";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Filter by group_id so each team is isolated
    const donors = getDonors().filter(d => d.group_id === user.group_id);
    return NextResponse.json(donors);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.name || !body.type) {
      return NextResponse.json({ error: "İsim ve Tip zorunludur." }, { status: 400 });
    }

    const newDonor = addDonor({
      ...body,
      group_id: user.group_id || null
    });
    return NextResponse.json(newDonor);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
