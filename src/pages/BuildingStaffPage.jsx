import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    MagnifyingGlass, CircleNotch, UserPlus, UserMinus, MapPin,
    Envelope, Phone, ArrowLeft, Users
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { apiJson } from "@/lib/apiClient";
import defaultBuildingImg from "@/assets/default_building_img.jpg";
import defaultUserImg from "@/assets/default_user_img.jpg";

const thumb = (b) => b.thumbnail_url || defaultBuildingImg;

export default function BuildingStaffPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [building, setBuilding] = useState(null);
    const [loading, setLoading] = useState(true);
    const [staffList, setStaffList] = useState([]);
    const [staffLoading, setStaffLoading] = useState(true);

    // Assign dialog
    const [assignOpen, setAssignOpen] = useState(false);
    const [assignRole, setAssignRole] = useState(null);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [availLoading, setAvailLoading] = useState(false);
    const [assignSearch, setAssignSearch] = useState("");
    const [assigning, setAssigning] = useState(null);

    // Custom confirm dialog
    const [confirmRemove, setConfirmRemove] = useState(null);
    const [removing, setRemoving] = useState(false);

    // Message dialog
    const [msgDialog, setMsgDialog] = useState(null);

    // Fetch building info
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await apiJson(`/api/buildings/${id}`);
                setBuilding(res.data || res);
            } catch { setBuilding(null); }
            finally { setLoading(false); }
        })();
    }, [id]);

    // Fetch staff
    const fetchStaff = useCallback(async () => {
        setStaffLoading(true);
        try {
            const res = await apiJson(`/api/users?building_id=${id}&limit=100`);
            const all = res.data?.data || [];
            setStaffList(all.filter(u => u.role === "BUILDING_MANAGER" || u.role === "STAFF"));
        } catch { setStaffList([]); }
        finally { setStaffLoading(false); }
    }, [id]);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    const managers = useMemo(() => staffList.filter(u => u.role === "BUILDING_MANAGER"), [staffList]);
    const staff = useMemo(() => staffList.filter(u => u.role === "STAFF"), [staffList]);
    const hasBM = managers.length > 0;

    const openAssign = async (role) => {
        setAssignRole(role);
        setAssignOpen(true);
        setAvailLoading(true);
        setAssignSearch("");
        try {
            const res = await apiJson("/api/users?building_id=none&limit=200");
            const all = res.data?.data || [];
            setAvailableUsers(all.filter(u => u.role === role && u.is_active));
        } catch { setAvailableUsers([]); }
        finally { setAvailLoading(false); }
    };

    const handleAssign = async (userId) => {
        setAssigning(userId);
        try {
            await apiJson(`/api/users/${userId}/building`, {
                method: "PATCH",
                body: { building_id: id },
            });
            await fetchStaff();
            setAssignOpen(false);
        } catch (err) {
            setMsgDialog({ title: "Lỗi", message: err?.message || "Không thể gán nhân sự" });
        } finally { setAssigning(null); }
    };

    const handleRemoveConfirmed = async () => {
        if (!confirmRemove) return;
        setRemoving(true);
        try {
            await apiJson(`/api/users/${confirmRemove.id}/building`, {
                method: "PATCH",
                body: { building_id: null },
            });
            await fetchStaff();
            setConfirmRemove(null);
        } catch (err) {
            setConfirmRemove(null);
            setMsgDialog({ title: "Lỗi", message: err?.message || "Không thể gỡ nhân sự" });
        } finally { setRemoving(false); }
    };

    const filteredAvail = useMemo(() => {
        if (!assignSearch.trim()) return availableUsers;
        const q = assignSearch.toLowerCase();
        return availableUsers.filter(u =>
            `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
        );
    }, [availableUsers, assignSearch]);

    const UserRow = ({ user }) => (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-3">
                <img src={user.avatar_url || defaultUserImg} alt=""
                    className="size-10 rounded-lg object-cover ring-1 ring-border"
                    onError={e => { e.target.src = defaultUserImg; }} />
                <div>
                    <span className="font-semibold text-sm">{user.first_name} {user.last_name}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        {user.email && <span className="flex items-center gap-1"><Envelope className="size-3" />{user.email}</span>}
                        {user.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{user.phone}</span>}
                    </div>
                </div>
            </div>
            <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 size-8"
                onClick={() => setConfirmRemove(user)}>
                <UserMinus className="size-4" />
            </Button>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <CircleNotch className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!building) {
        return (
            <div className="mx-auto max-w-4xl py-12 text-center">
                <p className="text-sm text-muted-foreground">Không tìm thấy tòa nhà.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/buildings")}>
                    Quay lại
                </Button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/buildings")}>
                    <ArrowLeft className="size-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold">{building.name}</h1>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="size-3" />{building.address || building.location?.name || "—"}
                    </p>
                </div>
            </div>

            {/* Building thumbnail + info */}
            <Card className="overflow-hidden py-0 gap-0">
                <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-52 shrink-0 bg-muted">
                        <img src={thumb(building)} alt={building.name}
                            className="w-full h-full min-h-36 object-cover"
                            onError={e => { e.target.src = defaultBuildingImg; }} />
                    </div>
                    <div className="flex-1 p-5 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className={`size-2 rounded-full ${building.is_active ? "bg-success" : "bg-muted-foreground/30"}`} />
                            <span className={`text-xs font-medium ${building.is_active ? "text-success" : "text-muted-foreground"}`}>
                                {building.is_active ? "Hoạt động" : "Vô hiệu"}
                            </span>
                            {building.location?.name && (
                                <span className="text-xs text-muted-foreground ml-2 flex items-center gap-1">
                                    <MapPin className="size-3" />{building.location.name}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">{building.description || "Không có mô tả."}</p>
                    </div>
                </div>
            </Card>

            {staffLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                    <CircleNotch className="size-4 animate-spin" /> Đang tải nhân sự...
                </div>
            ) : (
                <>
                    {/* Quản lý (BM) */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-bold">Quản lý tòa nhà</h2>
                            {!hasBM && (
                                <Button size="sm" className="gap-1.5" onClick={() => openAssign("BUILDING_MANAGER")}>
                                    <UserPlus className="size-3.5" /> Thêm quản lý
                                </Button>
                            )}
                        </div>
                        {managers.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2 pl-1">Chưa có quản lý được gán.</p>
                        ) : (
                            <div className="space-y-2">
                                {managers.map(u => <UserRow key={u.id} user={u} />)}
                            </div>
                        )}
                        {hasBM && (
                            <p className="text-[11px] text-muted-foreground mt-2 pl-1">
                                Mỗi tòa nhà chỉ được có 1 quản lý. Gỡ quản lý hiện tại trước khi gán người mới.
                            </p>
                        )}
                    </section>

                    {/* Nhân viên (Staff) */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-bold">Nhân viên</h2>
                            <Button size="sm" className="gap-1.5" onClick={() => openAssign("STAFF")}>
                                <UserPlus className="size-3.5" /> Thêm nhân viên
                            </Button>
                        </div>
                        {staff.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2 pl-1">Chưa có nhân viên được gán.</p>
                        ) : (
                            <div className="space-y-2">
                                {staff.map(u => <UserRow key={u.id} user={u} />)}
                            </div>
                        )}
                    </section>
                </>
            )}

            {/* Assign Dialog */}
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {assignRole === "BUILDING_MANAGER" ? "Chọn quản lý" : "Thêm nhân viên"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input placeholder="Tìm theo tên hoặc email..." value={assignSearch}
                            onChange={(e) => setAssignSearch(e.target.value)} className="pl-9" />
                    </div>
                    <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1">
                        {availLoading ? (
                            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                                <CircleNotch className="size-4 animate-spin" /> Đang tải...
                            </div>
                        ) : filteredAvail.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Không tìm thấy {assignRole === "BUILDING_MANAGER" ? "quản lý" : "nhân viên"} chưa được gán.
                            </p>
                        ) : (
                            filteredAvail.map(u => (
                                <div key={u.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <img src={u.avatar_url || defaultUserImg} alt=""
                                            className="size-8 rounded-md object-cover ring-1 ring-border"
                                            onError={e => { e.target.src = defaultUserImg; }} />
                                        <div>
                                            <span className="text-sm font-medium">{u.first_name} {u.last_name}</span>
                                            <p className="text-[11px] text-muted-foreground">{u.email}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" className="gap-1 h-7 text-xs"
                                        disabled={assigning === u.id} onClick={() => handleAssign(u.id)}>
                                        {assigning === u.id ? <CircleNotch className="size-3 animate-spin" /> : <UserPlus className="size-3" />}
                                        Gán
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirm Remove Dialog */}
            <Dialog open={!!confirmRemove} onOpenChange={(v) => { if (!v) setConfirmRemove(null); }}>
                <DialogContent className="max-w-sm text-center">
                    <DialogHeader>
                        <DialogTitle>Gỡ nhân sự</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Bạn có chắc muốn gỡ{" "}
                        <strong className="text-foreground">
                            {confirmRemove?.first_name} {confirmRemove?.last_name}
                        </strong>{" "}
                        khỏi tòa nhà này?
                    </p>
                    <DialogFooter className="justify-center gap-2 sm:justify-center">
                        <Button variant="outline" onClick={() => setConfirmRemove(null)}>Hủy</Button>
                        <Button variant="destructive" disabled={removing} onClick={handleRemoveConfirmed}>
                            {removing && <CircleNotch className="size-4 animate-spin mr-1.5" />}
                            Gỡ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Message Dialog */}
            <Dialog open={!!msgDialog} onOpenChange={(v) => { if (!v) setMsgDialog(null); }}>
                <DialogContent className="max-w-sm text-center">
                    <DialogHeader>
                        <DialogTitle>{msgDialog?.title || "Thông báo"}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">{msgDialog?.message}</p>
                    <DialogFooter className="justify-center sm:justify-center">
                        <Button onClick={() => setMsgDialog(null)}>Đóng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
