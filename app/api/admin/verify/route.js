import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();

    const { studentId, token } = body;

    if (!studentId || !token) {
      return NextResponse.json(
        {
          error: "Student dan token wajib diisi.",
        },
        { status: 400 }
      );
    }

    // 1. Cek token
    const { data: tokenData, error: tokenError } = await supabase
      .from("students_edit_tokens")
      .select("token, student_id")
      .eq("student_id", studentId)
      .eq("token", token)
      .maybeSingle();

    if (tokenError) {
      console.error("Token error:", tokenError);

      return NextResponse.json(
        {
          error: "Gagal melakukan verifikasi.",
        },
        { status: 500 }
      );
    }

    // Token tidak ditemukan
    if (!tokenData) {
      return NextResponse.json(
        {
          verified: false,
          error: "Token salah.",
        },
        { status: 401 }
      );
    }

    // 2. Ambil data siswa secara terpisah
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, slug, name")
      .eq("id", tokenData.student_id)
      .maybeSingle();

    if (studentError) {
      console.error("Student error:", studentError);

      return NextResponse.json(
        {
          error: "Data siswa tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    if (!student) {
      return NextResponse.json(
        {
          verified: false,
          error: "Data siswa tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // 3. Berhasil
    return NextResponse.json({
      verified: true,
      student,
    });
  } catch (error) {
    console.error("Verify error:", error);

    return NextResponse.json(
      {
        error: "Terjadi kesalahan server.",
      },
      { status: 500 }
    );
  }
}