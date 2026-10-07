import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_BYTES = 5 * 1024 * 1024;

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const token = request.headers.get("authorization");
  if (!token?.toLowerCase().startsWith("bearer ")) {
    return Response.json({ message: "Sign in as staff before uploading an image." }, { status: 401 });
  }

  const api = process.env.API_PROXY_TARGET ?? "http://localhost:5205";
  let role = "";
  try {
    const me = await fetch(`${api}/api/auth/me`, {
      headers: { Authorization: token },
      cache: "no-store",
    });
    if (!me.ok) {
      return Response.json({ message: "Sign in as staff before uploading an image." }, { status: 401 });
    }
    const profile = (await me.json()) as { data?: { role?: string } };
    role = profile.data?.role ?? "";
  } catch {
    return Response.json({ message: "The yard API is not reachable. Check that it is running on port 5205." }, { status: 503 });
  }

  if (role.toLowerCase() !== "admin") {
    return Response.json({ message: "Sign in as staff before uploading an image." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ message: "Choose an image file." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ message: "Choose an image file." }, { status: 400 });
  }

  const extension = TYPES[file.type];
  if (!extension) {
    return Response.json({ message: "Use a JPEG, PNG, WebP, or GIF." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ message: "Images must be 5 MB or smaller." }, { status: 400 });
  }

  const filename = `${randomUUID()}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    return Response.json({ message: "The image address could not be built." }, { status: 500 });
  }
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}/uploads/${filename}`;
  if (url.length > 500) {
    return Response.json({ message: "The image address is too long to save." }, { status: 400 });
  }

  return Response.json({ url });
}
