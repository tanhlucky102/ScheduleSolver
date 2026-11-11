export async function requestJson<T>(apiUrl: string, token: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(apiUrl + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const value = await response.json();
  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Phiên đăng nhập đã hết hạn. Hãy đăng xuất và đăng nhập lại."
        : response.status === 403
        ? "Bạn chưa được cấp quyền cho thao tác này."
        : response.status === 409 && String(value.detail).includes("revision")
        ? "Dữ liệu đã thay đổi. Hãy làm mới trước khi thử lại."
        : typeof value.detail === "string"
        ? value.detail
        : JSON.stringify(value.detail)
    );
  }
  return value as T;
}

export async function previewWorkbook<T>(apiUrl: string, token: string | null, file: File): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(apiUrl + "/api/import/preview", {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    body: form,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail);
  return data as T;
}

export async function previewExternalFile<T>(apiUrl: string, token: string | null, file: File): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(apiUrl + "/api/import/external-preview", {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    body: form,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail);
  return data as T;
}

export async function exportWorkbook(apiUrl: string, token: string, source: string): Promise<Blob> {
  const response = await fetch(apiUrl + "/api/export/" + source, {
    headers: { Authorization: "Bearer " + token },
  });
  if (!response.ok) throw new Error((await response.json()).detail);
  return response.blob();
}

export async function exportTeacherWorkbook(
  apiUrl: string,
  token: string,
  opts: { teacherId?: string; source?: "draft" | "published"; weekStart?: string; weekLabel?: string } = {}
): Promise<Blob> {
  const qs = new URLSearchParams();
  if (opts.teacherId) qs.set("teacher_id", opts.teacherId);
  if (opts.source) qs.set("source", opts.source);
  if (opts.weekStart && opts.weekStart !== "all") qs.set("week_start", opts.weekStart);
  if (opts.weekLabel) qs.set("week_label", opts.weekLabel);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  const response = await fetch(`${apiUrl}/api/export-teacher${query}`, {
    headers: { Authorization: "Bearer " + token },
  });
  if (!response.ok) throw new Error((await response.json()).detail);
  return response.blob();
}
