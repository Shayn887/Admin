import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Token diperlukan" },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from("students_edit_tokens")
            .select(`
        token,
        student:students (
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
          spotify_track_id_3,
          image,
          image2,
          image3
        )
      `)
            .eq("token", token)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { error: "Token tidak valid" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            student: data.student,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Terjadi kesalahan server" },
            { status: 500 }
        );
    }
}

export async function PATCH(request) {
    try {
        const body = await request.json();

        const { token, ...fields } = body;

        if (!token) {
            return NextResponse.json(
                { error: "Token diperlukan" },
                { status: 400 }
            );
        }

        // Cari siswa berdasarkan token
        const { data: tokenData, error: tokenError } =
            await supabaseAdmin
                .from("students_edit_tokens")
                .select("student_id")
                .eq("token", token)
                .single();

        if (tokenError || !tokenData) {
            return NextResponse.json(
                { error: "Token tidak valid" },
                { status: 401 }
            );
        }

        // Field yang boleh diedit siswa
        const allowedFields = [
            "name",
            "nickname",
            "birthdate",
            "favorite_food",
            "about",
            "quote",
            "instagram",
            "twitter_x",
            "tiktok",
            "spotify_track_id",
            "spotify_track_id_2",
            "spotify_track_id_3",
        ];

        const updateData = {};

        for (const field of allowedFields) {
            if (fields[field] !== undefined) {
                updateData[field] = fields[field];
            }
        }

        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from("students")
            .update(updateData)
            .eq("id", tokenData.student_id)
            .select()
            .single();

        if (error) {
            console.error("Update student error:", error);

            return NextResponse.json(
                { error: "Gagal menyimpan profile" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "Profile berhasil diperbarui",
            student: data,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Terjadi kesalahan server" },
            { status: 500 }
        );
    }
}