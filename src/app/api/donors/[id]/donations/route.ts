import { NextResponse } from "next/server";
import { addDonation, getDonors } from "@/lib/donors-store";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if donor belongs to user's group
    const donors = getDonors();
    const donor = donors.find(d => d.id === id);
    if (!donor || donor.group_id !== user.group_id) {
      return NextResponse.json(
        { error: "Bağışçı bulunamadı veya yetkisiz erişim." },
        { status: 404 }
      );
    }

    const body = await request.json();
    if (!body.type || !body.details) {
      return NextResponse.json(
        { error: "Bağış Türü ve Açıklama zorunludur." },
        { status: 400 }
      );
    }
    const newDonation = addDonation(id, body);
    if (!newDonation) {
      return NextResponse.json({ error: "Bağış kaydedilemedi." }, { status: 500 });
    }
    return NextResponse.json(newDonation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
