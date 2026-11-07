"use client";
import { useEffect, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Profile, Workspace } from "./types";
import { requestJson, exportWorkbook } from "./api-client";

let browserAuth: SupabaseClient | null = null;

export function useWorkspaceSession() {
  const [auth, setAuth] = useState<SupabaseClient | null>(null);
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [config, setConfig] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      setFailed(true);
      setMessage("Cần cấu hình kết nối Supabase trước khi đăng nhập.");
      return;
    }
    const client =
      browserAuth ??
      (browserAuth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: true } }));
    setAuth(client);
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || "");
      if (!session) {
        setProfile(null);
        setWorkspace(null);
        setMessage("");
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function refresh() {
    const [p, w] = await Promise.all([requestJson<Profile>(apiUrl, token, "/api/me"), requestJson<Workspace>(apiUrl, token, "/api/workspace")]);
    setProfile(p);
    setWorkspace(w);
    if (w.state?.config) setConfig(JSON.stringify(w.state?.config, null, 2));
  }

  useEffect(() => {
    if (token) {
      setLoading(true);
      refresh()
        .catch((e) => {
          setFailed(true);
          setMessage(e.message);
        })
        .finally(() => setLoading(false));
    }
  }, [token]); // eslint-disable-line

  async function perform(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setFailed(false);
    try {
      await fn();
    } catch (e) {
      setFailed(true);
      setMessage(e instanceof Error ? e.message : "Không thể xử lý thao tác này.");
    } finally {
      setBusy(false);
    }
  }

  async function command(action: string, payload: unknown = {}) {
    if (!workspace) return;
    await requestJson(apiUrl, token, "/api/commands/" + action, { revision: workspace.revision, payload });
    await refresh();
    setMessage(
      ({
        solve: "Đã tìm được phương án xếp lịch hợp lệ với phòng cụ thể.",
        assign: "Đã lưu phân công giảng viên.",
        submit: "Đã nộp phân công cho giáo vụ.",
        send: "Đã gửi kế hoạch cho bộ môn.",
        return: "Đã gửi yêu cầu điều chỉnh cho bộ môn.",
        publish: "Đã công bố thời khóa biểu chính thức.",
        external: "Đã lưu lịch công tác ngoài.",
        "department-save": "Đã lưu thông tin bộ môn.",
        "department-delete": "Đã xóa bộ môn thành công.",
        "teacher-save": "Đã lưu thông tin giảng viên.",
        "teacher-delete": "Đã xóa giảng viên thành công.",
        "rooms-preset": "Đã khởi tạo thành công 17 phòng học mẫu từ danh mục.",
        balance: "Đã chia đều các lớp học phần cho giảng viên đủ năng lực.",
        "capabilities-preset": "Đã tự động cập nhật năng lực giảng viên theo thời khóa biểu gốc.",
      } as Record<string, string>)[action] ?? "Đã lưu thay đổi thành công."
    );
  }

  async function download(source: string) {
    const url = URL.createObjectURL(await exportWorkbook(apiUrl, token, source));
    const a = document.createElement("a");
    a.href = url;
    a.download = "Timetable-" + source + ".xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function loginWithPassword(email: string, password: string) {
    await perform(async () => {
      if (!auth) throw new Error("Chưa kết nối dịch vụ xác thực Supabase.");
      const { error } = await auth.auth.signInWithPassword({ email, password });
      if (error) throw error;
    });
  }

  return { auth, token, profile, workspace, message, setMessage, failed, loading, busy,
    config, setConfig, apiUrl, refresh, perform, command, download, loginWithPassword };
}
