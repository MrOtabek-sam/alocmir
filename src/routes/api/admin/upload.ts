import { createFileRoute } from "@tanstack/react-router";
import { put } from "@vercel/blob";

import { isAdminRequest } from "@/lib/store/auth.server";

const ALLOWED: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export const Route = createFileRoute("/api/admin/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAdminRequest(request))) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
        if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ ok: false, error: "storage_missing" }, { status: 500 });
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) return Response.json({ ok: false, error: "missing_file" }, { status: 400 });
        const ext = ALLOWED[file.type];
        if (!ext) return Response.json({ ok: false, error: "bad_type" }, { status: 400 });
        if (file.size > 4 * 1024 * 1024) return Response.json({ ok: false, error: "too_big (max 4 MB)" }, { status: 400 });
        const blob = await put(`products/${crypto.randomUUID()}.${ext}`, file, { access: "public", contentType: file.type });
        return Response.json({ ok: true, url: blob.url });
      },
    },
  },
});
