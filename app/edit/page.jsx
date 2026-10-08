"use client";

import { useEffect, useMemo, useState } from "react";
import ImageUploader from "@/app/edit/components/ImageUploader";

export default function AdminEditPage() {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const [search, setSearch] = useState("");

    const [token, setToken] = useState("");
    const [verified, setVerified] = useState(false);

    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    // ============================
    // LOAD STUDENTS
    // ============================

    useEffect(() => {
        async function loadStudents() {
            try {
                const response = await fetch("/api/admin/students");
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Gagal mengambil data.");
                }

                setStudents(data.students || []);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        loadStudents();
    }, []);

    // ============================
    // SEARCH
    // ============================

    const filteredStudents = useMemo(() => {
        const keyword = search.toLowerCase().trim();
        if (!keyword) return students;

        return students.filter((student) =>
            student.name.toLowerCase().includes(keyword)
        );
    }, [students, search]);

    // ============================
    // SELECT STUDENT
    // ============================

    const selectStudent = (student) => {
        setSelectedStudent(student);
        setToken("");
        setVerified(false);
        setError("");
    };

    // ============================
    // VERIFY TOKEN
    // ============================

    const verifyToken = async () => {
        if (!selectedStudent) return;

        if (!token.trim()) {
            setError("Masukkan token terlebih dahulu.");
            return;
        }

        try {
            setVerifying(true);
            setError("");

            const response = await fetch("/api/admin/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    studentId: selectedStudent.id,
                    token: token.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setVerified(false);
                throw new Error(data.error || "Token tidak valid.");
            }

            setVerified(true);
            setError("");
        } catch (error) {
            setError(error.message);
        } finally {
            setVerifying(false);
        }
    };

    // ============================
    // SAVE PROFILE TO API
    // ============================

    const saveProfile = async () => {
        if (!selectedStudent) return;

        try {
            setSaving(true);
            setError("");

            const response = await fetch("/api/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    name: selectedStudent.name,
                    nickname: selectedStudent.nickname,
                    birthdate: selectedStudent.birthdate,
                    favorite_food: selectedStudent.favorite_food,
                    about: selectedStudent.about,
                    quote: selectedStudent.quote,
                    instagram: selectedStudent.instagram,
                    twitter_x: selectedStudent.twitter_x,
                    tiktok: selectedStudent.tiktok,
                    spotify_track_id: selectedStudent.spotify_track_id,
                    spotify_track_id_2: selectedStudent.spotify_track_id_2,
                    spotify_track_id_3: selectedStudent.spotify_track_id_3,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal menyimpan data.");
            }

            alert("Data berhasil disimpan!");
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    // ============================
    // UPDATE LOCAL DATA
    // ============================

    const updateStudent = (updates) => {
        setSelectedStudent((prev) => ({
            ...prev,
            ...updates,
        }));

        setStudents((prev) =>
            prev.map((student) =>
                student.id === selectedStudent.id
                    ? { ...student, ...updates }
                    : student
            )
        );
    };

    // ============================
    // BACK
    // ============================

    const backToList = () => {
        setSelectedStudent(null);
        setToken("");
        setVerified(false);
        setError("");
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-100 flex items-center justify-center">
                <p className="text-slate-500">Memuat anggota...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-100 text-slate-900 px-4 py-10">
            <div className="max-w-6xl mx-auto">
                {/* HEADER */}
                <header className="mb-8">
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                        Admin / Edit
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-800">
                        Student Profile Manager
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Pilih anggota untuk melihat dan mengubah data profil.
                    </p>
                </header>

                {/* ERROR */}
                {error && (
                    <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* ============================
                    LIST STUDENTS
                ============================ */}
                {!selectedStudent && (
                    <section>
                        {/* SEARCH */}
                        <div className="mb-6">
                            <input
                                type="text"
                                placeholder="Cari nama anggota..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-slate-400"
                            />
                        </div>

                        {/* LIST */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredStudents.map((student) => (
                                <button
                                    key={student.id}
                                    type="button"
                                    onClick={() => selectStudent(student)}
                                    className="text-left bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-400 hover:shadow-md transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                            {student.image ? (
                                                <img
                                                    src={student.image}
                                                    alt={student.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xl">
                                                    👤
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <h2 className="font-bold text-slate-800 truncate">
                                                {student.name}
                                            </h2>
                                            <p className="text-sm text-slate-500 truncate">
                                                {student.nickname || "Belum ada nickname"}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Klik untuk membuka
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {filteredStudents.length === 0 && (
                            <p className="text-center text-slate-500 py-10">
                                Anggota tidak ditemukan.
                            </p>
                        )}
                    </section>
                )}

                {/* ============================
                    DETAIL STUDENT
                ============================ */}
                {selectedStudent && (
                    <section>
                        {/* BACK */}
                        <button
                            type="button"
                            onClick={backToList}
                            className="mb-6 text-sm font-semibold text-slate-600 hover:text-slate-900"
                        >
                            ← Kembali ke daftar
                        </button>

                        {/* STUDENT HEADER */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-6">
                            <div className="flex flex-col sm:flex-row items-center gap-5">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100">
                                    {selectedStudent.image ? (
                                        <img
                                            src={selectedStudent.image}
                                            alt={selectedStudent.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl">
                                            👤
                                        </div>
                                    )}
                                </div>

                                <div className="text-center sm:text-left">
                                    <p className="text-xs uppercase tracking-widest text-slate-400">
                                        Anggota
                                    </p>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {selectedStudent.name}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {selectedStudent.role || "Student"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* VERIFICATION */}
                        {!verified && (
                            <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-xl">
                                <h2 className="text-xl font-bold text-slate-800">
                                    Verifikasi Token
                                </h2>
                                <p className="text-sm text-slate-500 mt-2 mb-5">
                                    Untuk mengedit data <strong>{selectedStudent.name}</strong>, masukkan token edit miliknya.
                                </p>

                                <input
                                    type="password"
                                    placeholder="Masukkan token..."
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") verifyToken();
                                    }}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-slate-400 font-mono text-sm"
                                />

                                <button
                                    type="button"
                                    onClick={verifyToken}
                                    disabled={verifying}
                                    className="mt-4 w-full rounded-xl bg-slate-900 text-white py-3 font-semibold disabled:opacity-50"
                                >
                                    {verifying ? "Memverifikasi..." : "Verifikasi Token"}
                                </button>
                            </div>
                        )}

                        {/* EDIT FORM */}
                        {verified && (
                            <div className="space-y-6">
                                {/* VERIFIED NOTIFICATION */}
                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                                    <p className="text-sm font-semibold text-emerald-700">
                                        ✓ Token berhasil diverifikasi
                                    </p>
                                    <p className="text-xs text-emerald-600 mt-1">
                                        Sekarang kamu dapat mengubah data profil anggota ini.
                                    </p>
                                </div>

                                {/* DATA PROFIL CARD */}
                                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                                    <h2 className="text-xl font-bold mb-3 text-slate-800">
                                        Data Profil
                                    </h2>

                                    {/* BUKU PETUNJUK PENEMPILAN LINK */}
                                    <div className="mb-6 p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-3">
                                        <span className="text-lg">💡</span>
                                        <div className="text-xs sm:text-sm text-sky-900">
                                            <p className="font-semibold mb-0.5">Petunjuk Pengisian Link:</p>
                                            <p>
                                                Untuk <strong>Instagram</strong>, <strong>TikTok</strong>, <strong>Twitter/X</strong>, atau <strong>Spotify</strong>, bisa langsung tempel (paste) link resminya secara langsung.
                                            </p>
                                        </div>
                                    </div>

                                    {/* GRID INPUT FIELD */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <Input
                                            label="Nama"
                                            value={selectedStudent.name}
                                            onChange={(value) => updateStudent({ name: value })}
                                        />

                                        <Input
                                            label="Nickname"
                                            value={selectedStudent.nickname || ""}
                                            onChange={(value) => updateStudent({ nickname: value })}
                                        />

                                        <Input
                                            label="Tanggal Lahir"
                                            value={selectedStudent.birthdate || ""}
                                            onChange={(value) => updateStudent({ birthdate: value })}
                                        />

                                        <Input
                                            label="Favorite Food"
                                            value={selectedStudent.favorite_food || ""}
                                            onChange={(value) => updateStudent({ favorite_food: value })}
                                        />

                                        <Input
                                            label="Instagram"
                                            value={selectedStudent.instagram || ""}
                                            onChange={(value) => updateStudent({ instagram: value })}
                                            placeholder="https://instagram.com/username"
                                        />

                                        <Input
                                            label="Twitter / X"
                                            value={selectedStudent.twitter_x || ""}
                                            onChange={(value) => updateStudent({ twitter_x: value })}
                                            placeholder="https://x.com/username"
                                        />

                                        <Input
                                            label="TikTok"
                                            value={selectedStudent.tiktok || ""}
                                            onChange={(value) => updateStudent({ tiktok: value })}
                                            placeholder="https://tiktok.com/@username"
                                        />

                                        <Input
                                            label="Spotify Track ID #1"
                                            value={selectedStudent.spotify_track_id || ""}
                                            onChange={(value) => updateStudent({ spotify_track_id: value })}
                                            placeholder="https://open.spotify.com/track/..."
                                        />

                                        <Input
                                            label="Spotify Track ID #2"
                                            value={selectedStudent.spotify_track_id_2 || ""}
                                            onChange={(value) => updateStudent({ spotify_track_id_2: value })}
                                            placeholder="https://open.spotify.com/track/..."
                                        />

                                        <div>
                                            <Input
                                                label="Spotify Track ID #3"
                                                value={selectedStudent.spotify_track_id_3 || ""}
                                                onChange={(value) => updateStudent({ spotify_track_id_3: value })}
                                                placeholder="Sedang bermasalah..."
                                                disabled={true}
                                                note="⚠️ Sedang Bug"
                                            />
                                            <p className="mt-1.5 text-xs text-amber-600 font-medium">
                                                * Fitur Spotify Track #3 sedang mengalami kendala/bug dan dinonaktifkan sementara.
                                            </p>
                                        </div>
                                    </div>

                                    {/* ABOUT & QUOTE */}
                                    <div className="mt-5 space-y-5">
                                        <Textarea
                                            label="About"
                                            value={selectedStudent.about || ""}
                                            onChange={(value) => updateStudent({ about: value })}
                                        />

                                        <Textarea
                                            label="Quote"
                                            value={selectedStudent.quote || ""}
                                            onChange={(value) => updateStudent({ quote: value })}
                                        />
                                    </div>

                                    {/* SIMPAN BUTTON */}
                                    <button
                                        type="button"
                                        onClick={saveProfile}
                                        disabled={saving}
                                        className="mt-6 w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 transition"
                                    >
                                        {saving ? "Menyimpan..." : "Simpan Perubahan"}
                                    </button>
                                </div>

                                {/* PHOTOS CARD */}
                                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                                    <h2 className="text-xl font-bold text-slate-800">
                                        Foto Anggota
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-1 mb-6">
                                        Maksimal 3 foto.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <ImageUploader
                                            token={token}
                                            slot="image"
                                            label="Foto 1"
                                            currentImage={selectedStudent.image}
                                            aspect={1}
                                            onUploaded={(url) => updateStudent({ image: url })}
                                            onDeleted={() => updateStudent({ image: null })}
                                        />

                                        <ImageUploader
                                            token={token}
                                            slot="image2"
                                            label="Foto 2"
                                            currentImage={selectedStudent.image2}
                                            aspect={1}
                                            onUploaded={(url) => updateStudent({ image2: url })}
                                            onDeleted={() => updateStudent({ image2: null })}
                                        />

                                        <ImageUploader
                                            token={token}
                                            slot="image3"
                                            label="Foto 3"
                                            currentImage={selectedStudent.image3}
                                            aspect={1}
                                            onUploaded={(url) => updateStudent({ image3: url })}
                                            onDeleted={() => updateStudent({ image3: null })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </main>
    );
}

// ========================================
// INPUT COMPONENT
// ========================================
function Input({ label, value, onChange, placeholder, disabled, note }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">
                    {label}
                </label>
                {note && <span className="text-xs text-amber-600 font-semibold">{note}</span>}
            </div>
            <input
                type="text"
                value={value || ""}
                disabled={disabled}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 outline-none transition text-slate-800 font-medium ${
                    disabled
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : "border-slate-200 focus:border-slate-400"
                }`}
            />
        </div>
    );
}

// ========================================
// TEXTAREA COMPONENT
// ========================================
function Textarea({ label, value, onChange }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
                {label}
            </label>
            <textarea
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-slate-400 text-slate-800 resize-none font-medium"
            />
        </div>
    );
}