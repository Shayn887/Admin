import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// GET: Mengambil daftar pesan
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get("recipient_id");

    let query = supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (recipientId) {
      query = query.eq("recipient_id", recipientId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// POST: Mengirim pesan baru
export async function POST(request) {
  try {
    const body = await request.json();
    const { recipient_id, message, is_anonymous, sender_name, sender_ig } = body;

    if (!recipient_id || !message) {
      return NextResponse.json(
        { message: "Recipient ID dan pesan wajib diisi." },
        { status: 400 }
      );
    }

    const payload = {
      recipient_id,
      message,
      is_anonymous,
      sender_name: is_anonymous ? null : sender_name,
      sender_ig: is_anonymous ? null : sender_ig,
    };

    const { data, error } = await supabase
      .from("messages")
      .insert([payload])
      .select();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Pesan berhasil dikirim!", data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}