import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("students")
      .select(`
        id,
        slug,
        name,
        nickname,
        role,
        birthdate,
        favorite_food,
        about,
        quote,
        instagram,
        twitter_x,
        tiktok,
        spotify_track_id,
        spotify_track_id_2,
        image,
        image2,
        image3
      `)
      .order("name", { ascending: true });

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: "Gagal mengambil data anggota." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      students: data || [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}