import { useState, useEffect, useCallback } from "react";
import {
  Bell, PaperPlaneTilt, CircleNotch, Buildings,
  Door, Warning, ArrowLeft,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, apiJson } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── constants ──────────────────────────────────────────── */

const TARGET_OPTIONS = [
  { value: "building", label: "Toàn bộ tòa nhà", icon: Buildings },
  { value: "room", label: "Phòng cụ thể", icon: Door },
];

/* ── Main Page ──────────────────────────────────────────── */

export default function BMNotificationCreatePage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("building");
  const [roomId, setRoomId] = useState("");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  /* ── fetch occupied rooms ────────────────────────────── */

  const fetchRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const res = await api.get("/api/rooms?limit=999");
      const all = res.data || [];
      setRooms(all.filter((r) => r.status === "OCCUPIED"));
    } catch {
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  /* ── send notification ───────────────────────────────── */

  const handleSend = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError("Vui lòng nhập tiêu đề và nội dung.");
      return;
    }
    if (target === "room" && !roomId) {
      setError("Vui lòng chọn phòng.");
      return;
    }

    setSending(true);
    try {
      const body = { title: title.trim(), content: content.trim(), target };
      if (target === "room") body.room_id = roomId;

      await apiJson("/api/notifications/send", {
        method: "POST",
        body,
      });
      toast.success("Đã gửi thông báo thành công!");
      navigate("/building-manager/notifications");
    } catch (err) {
      toast.error(err.message || "Gửi thông báo thất bại.");
    } finally {
      setSending(false);
    }
  };

  /* ── render ──────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="pt-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="size-8 shrink-0"
          onClick={() => navigate("/building-manager/notifications")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gửi thông báo mới</h1>
          <p className="text-sm text-muted-foreground">Gửi thông báo đến cư dân trong tòa nhà của bạn</p>
        </div>
      </div>

      {/* Send form */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <PaperPlaneTilt className="size-5 text-primary" />
          <h2 className="text-base font-bold">Nội dung thông báo</h2>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          {/* Target */}
          <div className="space-y-1.5">
            <Label>Gửi đến</Label>
            <div className="grid grid-cols-2 gap-3">
              {TARGET_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = target === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setTarget(opt.value); if (opt.value === "building") setRoomId(""); }}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                      selected ? "bg-primary/10" : "bg-muted"
                    }`}>
                      <Icon className={`size-4.5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <span className={`text-sm font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Room picker (when target = room) */}
          {target === "room" && (
            <div className="space-y-1.5">
              <Label>Chọn phòng</Label>
              {loadingRooms ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <CircleNotch className="size-4 animate-spin" /> Đang tải...
                </div>
              ) : rooms.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Không có phòng nào đang có cư dân.</p>
              ) : (
                <Select value={roomId || undefined} onValueChange={setRoomId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phòng" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        Phòng {r.room_number}
                        {r.room_type?.name && ` — ${r.room_type.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Tiêu đề</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề thông báo..."
              maxLength={255}
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label>Nội dung</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung thông báo..."
              rows={5}
              maxLength={2000}
            />
            <p className="text-[11px] text-muted-foreground text-right">{content.length}/2000</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <Warning className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline"
              onClick={() => navigate("/building-manager/notifications")}>
              Hủy
            </Button>
            <Button type="submit" disabled={sending} className="gap-2">
              {sending ? <CircleNotch className="size-4 animate-spin" /> : <PaperPlaneTilt className="size-4" />}
              {sending ? "Đang gửi..." : "Gửi thông báo"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Info note */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1.5">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground">Lưu ý</p>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
          <li>Thông báo sẽ được gửi đến tất cả cư dân có hợp đồng đang hiệu lực hoặc sắp hết hạn.</li>
          <li>Chọn &quot;Toàn bộ tòa nhà&quot; để gửi cho tất cả cư dân, hoặc chọn phòng cụ thể.</li>
        </ul>
      </div>
    </div>
  );
}
