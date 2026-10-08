"use client";

import { useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedBlob } from "@/lib/imageProcessor";

export default function ImageUploader({
  token,
  slot,
  label,
  currentImage,
  onUploaded,
  onDeleted,
  aspect = 1,
}) {
  const inputRef = useRef(null);

  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }

    const url = URL.createObjectURL(file);

    setImageSrc(url);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setUploading(true);
      setError("");

      const result = await getCroppedBlob(
        imageSrc,
        croppedAreaPixels
      );

      if (result.blob.size > 400 * 1024) {
        throw new Error(
          "Foto masih terlalu besar. Silakan gunakan foto lain."
        );
      }

      const formData = new FormData();

      formData.append("token", token);
      formData.append("slot", slot);
      formData.append(
        "file",
        result.blob,
        "photo.webp"
      );

      const response = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type");

      let data;

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { error: text };
      }

      if (!response.ok) {
        console.error("UPLOAD API ERROR:", {
          status: response.status,
          data,
        });

        throw new Error(
          data.error || data.message || "Gagal mengupload foto."
        );
      }

      onUploaded(data.url);

      setImageSrc(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (error) {
      console.error(error);

      setError(
        error.message || "Gagal mengupload foto."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Yakin ingin menghapus foto ini?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch("/api/profile/upload", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          slot,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Gagal menghapus foto."
        );
      }

      onDeleted();
    } catch (error) {
      console.error(error);

      setError(
        error.message || "Gagal menghapus foto."
      );
    } finally {
      setDeleting(false);
    }
  };

  const cancelCrop = () => {
    setImageSrc(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">

      {/* TITLE */}
      <div>
        <h3 className="font-semibold text-slate-800">
          {label}
        </h3>

        <p className="text-xs text-slate-500">
          Maksimal 300 KB • Format WebP
        </p>
      </div>


      {/* PREVIEW / CROP */}
      {imageSrc ? (
        <div className="space-y-4">

          <div className="relative w-full h-[350px] bg-black rounded-2xl overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>

          {/* ZOOM */}
          <div>
            <label className="text-sm text-slate-600">
              Zoom
            </label>

            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) =>
                setZoom(Number(e.target.value))
              }
              className="w-full"
            />
          </div>

          {/* BUTTON */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelCrop}
              disabled={uploading}
              className="flex-1 px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-sm font-semibold"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold"
            >
              {uploading
                ? "Mengupload..."
                : "Simpan Foto"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* CURRENT PHOTO */}
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">

            {currentImage ? (
              <>
                <img
                  src={currentImage}
                  alt={label}
                  className="w-full h-full object-cover"
                />

                {/* DELETE BUTTON */}
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="absolute top-3 right-3 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold shadow-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting
                    ? "Menghapus..."
                    : "Hapus"}
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-center p-6">
                <div>
                  <div className="text-4xl mb-2">
                    📷
                  </div>

                  <p className="text-sm text-slate-400">
                    Belum ada foto
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SELECT PHOTO */}
          <button
            type="button"
            onClick={() =>
              inputRef.current?.click()
            }
            className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            {currentImage
              ? "Ganti Foto"
              : "Pilih Foto"}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}

      {/* ERROR */}
      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}