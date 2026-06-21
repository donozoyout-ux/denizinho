import { NextResponse } from "next/server";
import { addDonation } from "@/lib/donors-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.type || !body.details) {
      return NextResponse.json(
        { error: "Bağış Türü ve Açıklama zorunludur." },
        { status: 400 }
      );
    }
    const newDonation = addDonation(id, body);
    if (!newDonation) {
      return NextResponse.json({ error: "Bağışçı bulunamadı." }, { status: 404 });
    }
    return NextResponse.json(newDonation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
