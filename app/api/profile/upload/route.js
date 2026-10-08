import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ========================================
// KONFIGURASI SLOT FOTO
// ========================================

const SLOT_CONFIG = {
  image: {
    column: "image",
    filename: "profile.webp",
  },

  image2: {
    column: "image2",
    filename: "gallery-1.webp",
  },

  image3: {
    column: "image3",
    filename: "gallery-2.webp",
  },
};

// ========================================
// HELPER: CARI STUDENT DARI TOKEN
// ========================================

async function getStudentFromToken(token) {
  if (!token) {
    return {
      error: "Token wajib diisi.",
      status: 400,
    };
  }

  // 1. Cari token
  // Tidak menggunakan relationship Supabase
  const { data: tokenData, error: tokenError } = await supabase
    .from("students_edit_tokens")
    .select("student_id")
    .eq("token", token)
    .maybeSingle();

  if (tokenError) {
    console.error("Token lookup error:", tokenError);

    return {
      error: "Gagal memeriksa token.",
      status: 500,
    };
  }

  if (!tokenData) {
    return {
      error: "Token tidak valid.",
      status: 401,
    };
  }

  // 2. Cari data student berdasarkan student_id
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select(`
      id,
      slug,
      class_id,
      image,
      image2,
      image3
    `)
    .eq("id", tokenData.student_id)
    .maybeSingle();

  if (studentError) {
    console.error("Student lookup error:", studentError);

    return {
      error: "Gagal mengambil data siswa.",
      status: 500,
    };
  }

  if (!student) {
    return {
      error: "Data siswa tidak ditemukan.",
      status: 404,
    };
  }

  // 3. Cari data class
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("slug")
    .eq("id", student.class_id)
    .maybeSingle();

  if (classError) {
    console.error("Class lookup error:", classError);

    return {
      error: "Gagal mengambil data kelas.",
      status: 500,
    };
  }

  if (!classData?.slug) {
    return {
      error: "Class student tidak ditemukan.",
      status: 400,
    };
  }

  return {
    student,
    classSlug: classData.slug,
  };
}

// ========================================
// POST - UPLOAD / GANTI FOTO
// ========================================

export async function POST(request) {
  try {
    const formData = await request.formData();

    const token = formData.get("token");
    const file = formData.get("file");
    const slot = formData.get("slot");

    // -------------------------------
    // Validasi input
    // -------------------------------

    if (!token || !file || !slot) {
      return NextResponse.json(
        {
          error: "Token, file, dan slot wajib diisi.",
        },
        { status: 400 }
      );
    }

    const config = SLOT_CONFIG[slot];

    if (!config) {
      return NextResponse.json(
        {
          error: "Slot foto tidak valid.",
        },
        { status: 400 }
      );
    }

    // -------------------------------
    // Validasi file
    // -------------------------------

    if (file.type !== "image/webp") {
      return NextResponse.json(
        {
          error: "File harus berupa WebP.",
        },
        { status: 400 }
      );
    }

    if (file.size > 400 * 1024) {
      return NextResponse.json(
        {
          error: "Ukuran foto maksimal 400 KB.",
        },
        { status: 400 }
      );
    }

    // -------------------------------
    // Verifikasi token
    // -------------------------------

    const result = await getStudentFromToken(token);

    if (result.error) {
      return NextResponse.json(
        {
          error: result.error,
        },
        { status: result.status }
      );
    }

    const { student, classSlug } = result;

    // -------------------------------
    // Tentukan path Storage
    // -------------------------------

    const path = `${classSlug}/${student.slug}/${config.filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // -------------------------------
    // Upload / replace file
    // -------------------------------

    const { error: uploadError } = await supabase.storage
      .from("student-photos")
      .upload(path, buffer, {
        contentType: "image/webp",
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("❌ STORAGE UPLOAD ERROR:", uploadError);

      return NextResponse.json(
        {
          error: uploadError.message || "Gagal mengupload foto.",
        },
        { status: 500 }
      );
    }

    // -------------------------------
    // Ambil public URL
    // -------------------------------

    const { data: publicData } = supabase.storage
      .from("student-photos")
      .getPublicUrl(path);

    const publicUrl = `${publicData.publicUrl}?v=${Date.now()}`;

    // -------------------------------
    // Update database
    // -------------------------------

    const { error: updateError } = await supabase
      .from("students")
      .update({
        [config.column]: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", student.id);

    if (updateError) {
      console.error("Student update error:", updateError);

      return NextResponse.json(
        {
          error:
            "Foto berhasil diupload tetapi database gagal diperbarui.",
        },
        { status: 500 }
      );
    }

    // -------------------------------
    // Berhasil
    // -------------------------------

    return NextResponse.json({
      message: "Foto berhasil diupload.",
      url: publicUrl,
      size: file.size,
      slot,
    });
  } catch (error) {
    console.error("❌ UPLOAD ERROR DETAIL:", error);

    return NextResponse.json(
      {
        error: error?.message || "Gagal mengupload foto.",
        details: error,
      },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE - HAPUS FOTO
// ========================================

export async function DELETE(request) {
  try {
    const body = await request.json();

    const { token, slot } = body;

    // -------------------------------
    // Validasi input
    // -------------------------------

    if (!token || !slot) {
      return NextResponse.json(
        {
          error: "Token dan slot wajib diisi.",
        },
        { status: 400 }
      );
    }

    const config = SLOT_CONFIG[slot];

    if (!config) {
      return NextResponse.json(
        {
          error: "Slot foto tidak valid.",
        },
        { status: 400 }
      );
    }

    // -------------------------------
    // Verifikasi token
    // -------------------------------

    const result = await getStudentFromToken(token);

    if (result.error) {
      return NextResponse.json(
        {
          error: result.error,
        },
        { status: result.status }
      );
    }

    const { student, classSlug } = result;

    // -------------------------------
    // Tentukan path Storage
    // -------------------------------

    const path = `${classSlug}/${student.slug}/${config.filename}`;

    // -------------------------------
    // Hapus file dari Storage
    // -------------------------------

    const { error: removeError } = await supabase.storage
      .from("student-photos")
      .remove([path]);

    if (removeError) {
      console.error("Storage remove error:", removeError);

      return NextResponse.json(
        {
          error: "Gagal menghapus foto dari Storage.",
        },
        { status: 500 }
      );
    }

    // -------------------------------
    // Hapus URL dari database
    // -------------------------------

    const { error: updateError } = await supabase
      .from("students")
      .update({
        [config.column]: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", student.id);

    if (updateError) {
      console.error("Student update error:", updateError);

      return NextResponse.json(
        {
          error:
            "Foto dihapus dari Storage tetapi database gagal diperbarui.",
        },
        { status: 500 }
      );
    }

    // -------------------------------
    // Berhasil
    // -------------------------------

    return NextResponse.json({
      message: "Foto berhasil dihapus.",
      slot,
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);

    return NextResponse.json(
      {
        error: "Terjadi kesalahan server.",
      },
      { status: 500 }
    );
  }
}