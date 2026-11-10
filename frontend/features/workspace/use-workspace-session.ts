"use client";
import { useEffect, useRef, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Profile, SolverProgress, Workspace } from "./types";
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
  const [solverProgress, setSolverProgress] = useState<Record<string, SolverProgress>>({});
  const [solverRunning, setSolverRunning] = useState(false);
  const [onlineTeachers, setOnlineTeachers] = useState<string[]>([]);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const workspaceRef = useRef<Workspace | null>(null);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

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
    workspaceRef.current = workspace;
  }, [workspace]);
  useEffect(() => {
    refreshRef.current = refresh;
  });

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

  useEffect(() => {
    if (!token) {
      setOnlineTeachers([]);
      setRealtimeConnected(false);
      return;
    }

    let disposed = false;
    let retry = 0;
    let reconnectTimer: number | undefined;
    let socket: WebSocket | null = null;
    const connect = () => {
      if (disposed) return;
      const url = new URL("/ws", apiUrl);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(url);
      socket.onopen = () => {
        socket?.send(JSON.stringify({ type: "auth", token }));
      };
      socket.onmessage = (message) => {
        let event: {
          type?: string;
          teachers?: string[];
          revision?: number;
          algorithm?: string;
          step?: number;
          iterations?: number;
          hard?: number;
          soft?: number;
        };
        try {
          event = JSON.parse(message.data);
        } catch {
          setFailed(true);
          setMessage("Dữ liệu realtime không hợp lệ; đang kết nối lại.");
          socket?.close();
          return;
        }
        if (event.type === "presence:online") {
          retry = 0;
          setRealtimeConnected(true);
          setOnlineTeachers(event.teachers ?? []);
        } else if (event.type === "solver:progress" && event.algorithm) {
          setSolverProgress((current) => ({
            ...current,
            [event.algorithm!]: {
              algorithm: event.algorithm!,
              step: event.step ?? 0,
              iterations: event.iterations ?? 0,
              hard: event.hard ?? 0,
              soft: event.soft ?? 0,
            },
          }));
        } else if (
          event.type === "workspace:updated" &&
          typeof event.revision === "number" &&
          event.revision > (workspaceRef.current?.revision ?? -1)
        ) {
          refreshRef.current().catch((error: unknown) => {
            setFailed(true);
            setMessage(error instanceof Error ? error.message : "Không thể đồng bộ không gian làm việc.");
          });
        }
      };
      socket.onerror = () => setRealtimeConnected(false);
      socket.onclose = (event) => {
        setRealtimeConnected(false);
        setOnlineTeachers([]);
        if (disposed) return;
        if (event.code === 4401 || event.code === 4403) {
          setMessage("Kết nối realtime bị từ chối do phiên đăng nhập hoặc quyền truy cập không hợp lệ.");
          return;
        }
        reconnectTimer = window.setTimeout(connect, Math.min(1000 * 2 ** retry++, 15000));
      };
    };

    connect();
    return () => {
      disposed = true;
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [apiUrl, token]);

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
    const solving = action === "solve";
    if (solving) {
      setSolverProgress({});
      setSolverRunning(true);
    }
    let completed = false;
    try {
      await requestJson(apiUrl, token, "/api/commands/" + action, { revision: workspace.revision, payload });
      completed = true;
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
    } catch (error) {
      if (solving && !completed) setSolverProgress({});
      throw error;
    } finally {
      if (solving) setSolverRunning(false);
    }
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
    config, setConfig, apiUrl, refresh, perform, command, download, loginWithPassword,
    solverProgress, solverRunning, onlineTeachers, realtimeConnected };
}
