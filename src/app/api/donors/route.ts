import { NextResponse } from "next/server";
import { getDonors, addDonor } from "@/lib/donors-store";

export async function GET() {
  try {
    const donors = getDonors();
    return NextResponse.json(donors);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.type) {
      return NextResponse.json({ error: "İsim ve Tip zorunludur." }, { status: 400 });
    }
    const newDonor = addDonor(body);
    return NextResponse.json(newDonor);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
