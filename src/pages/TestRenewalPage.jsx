import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Flask,
  CircleNotch,
  ArrowClockwise,
  PencilSimple,
  Check,
  X,
  ArrowRight,
  Info,
} from "@phosphor-icons/react";
import { api } from "@/lib/apiClient";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ── constants ──────────────────────────────────────────── */

const STATUS_MAP = {
  DRAFT: { label: "Nháp", color: "bg-muted text-muted-foreground" },
  PENDING_CUSTOMER_SIGNATURE: { label: "Chờ KH ký", color: "bg-amber-100 text-amber-700" },
  PENDING_MANAGER_SIGNATURE: { label: "Chờ BM ký", color: "bg-blue-100 text-blue-700" },
  ACTIVE: { label: "Đang hiệu lực", color: "bg-emerald-100 text-emerald-700" },
  EXPIRING_SOON: { label: "Sắp hết hạn", color: "bg-orange-100 text-orange-700" },
  FINISHED: { label: "Đã kết thúc", color: "bg-gray-100 text-gray-500" },
  TERMINATED: { label: "Đã chấm dứt", color: "bg-red-100 text-red-600" },
};

const SETTABLE_STATUSES = [
  "ACTIVE",
  "EXPIRING_SOON",
  "PENDING_CUSTOMER_SIGNATURE",
  "PENDING_MANAGER_SIGNATURE",
  "FINISHED",
  "TERMINATED",
];

/* ── StatusBadge ────────────────────────────────────────── */

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.color}`}>
      {s.label}
    </span>
  );
}

/* ── LogEntry ───────────────────────────────────────────── */

function LogEntry({ log }) {
  const isError = log.type === "error";
  return (
    <div className={`flex gap-2 text-xs ${isError ? "text-red-500" : "text-muted-foreground"}`}>
      <span className="shrink-0 font-mono text-[10px] opacity-60">
        {new Date(log.time).toLocaleTimeString("vi-VN")}
      </span>
      <span>{log.message}</span>
    </div>
  );
}

/* ── main component ─────────────────────────────────────── */

export default function TestRenewalPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(null);
  const [editEndDate, setEditEndDate] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editing, setEditing] = useState(null); // "end_date" | "status" | null
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((message, type = "info") => {
    setLogs((prev) => [{ message, type, time: Date.now() }, ...prev].slice(0, 50));
  }, []);

  /* ── fetch contracts ─────────────────────────────────── */

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/contracts?limit=999");
      setContracts(res.data || []);
    } catch {
      setError("Không thể tải danh sách hợp đồng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  /* ── select contract ─────────────────────────────────── */

  const selectContract = useCallback((contract) => {
    setSelected(contract);
    setEditEndDate(contract.end_date || "");
    setEditStatus(contract.status || "");
    setEditing(null);
    addLog(`Selected contract ${contract.contract_number} (${contract.status})`);
  }, [addLog]);

  /* ── update contract field ───────────────────────────── */

  const updateField = useCallback(async (field, value) => {
    if (!selected) return;
    setSaving(true);
    try {
      addLog(`Updating ${field} to "${value}" ...`);
      const res = await api.put(`/api/contracts/${selected.id}`, { [field]: value });
      const updated = res.data;
      addLog(`${field} updated successfully. New status: ${updated.status}`);

      // Refresh list and re-select
      await fetchContracts();
      setSelected((prev) => ({ ...prev, ...updated }));
      setEditEndDate(updated.end_date || "");
      setEditStatus(updated.status || "");
      setEditing(null);
    } catch (err) {
      addLog(`Failed to update ${field}: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  }, [selected, addLog, fetchContracts]);

  /* ── quick actions ───────────────────────────────────── */

  const setEndDateSoon = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    const iso = d.toISOString().split("T")[0];
    setEditEndDate(iso);
    setEditing("end_date");
    addLog(`Pre-filled end_date to ${iso} (5 days from now)`);
  }, [addLog]);

  const setStatusExpiringSoon = useCallback(() => {
    if (!selected) return;
    updateField("status", "EXPIRING_SOON");
  }, [selected, updateField]);

  /* ── renewal chain ───────────────────────────────────── */

  const renewalChain = useMemo(() => {
    if (!selected) return [];
    const chain = [];
    // Find all contracts that are renewals of the selected one
    const renewals = contracts.filter((c) => c.renewed_from_contract_id === selected.id);
    // Find the contract this was renewed from
    const parent = contracts.find((c) => c.id === selected.renewed_from_contract_id);
    if (parent) chain.push({ ...parent, relation: "Hợp đồng gốc" });
    chain.push({ ...selected, relation: "Hợp đồng hiện tại" });
    renewals.forEach((r) => chain.push({ ...r, relation: "Gia hạn" }));
    return chain;
  }, [selected, contracts]);

  /* ── render ───────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="pt-2">
        <div className="flex items-center gap-2">
          <Flask className="size-6 text-primary" weight="duotone" />
          <h1 className="text-2xl font-bold tracking-tight">Test Renewal Flow</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Test the contract renewal lifecycle: set end_date / status, then renew from client site.
        </p>
      </div>

      {/* Instructions */}
      <Card className="p-4 bg-blue-50/50 border-blue-200">
        <div className="flex gap-3">
          <Info className="size-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800 space-y-1">
            <p className="font-semibold">How to test the renewal flow:</p>
            <ol className="list-decimal ml-4 space-y-0.5 text-blue-700">
              <li>Select an <strong>ACTIVE</strong> contract below</li>
              <li>Click <strong>"Set end_date +5 days"</strong> then save — or set status to <strong>EXPIRING_SOON</strong> directly</li>
              <li>On the <strong>client site</strong>, log in as the resident and go to My Contracts</li>
              <li>Click <strong>"Gia han"</strong> on the expiring contract to initiate renewal</li>
              <li>Sign the new contract as customer, then sign as BM on this admin site</li>
              <li>Verify: new contract ACTIVE, old contract FINISHED, room stays OCCUPIED</li>
            </ol>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: contract list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              All Contracts
            </h2>
            <Button variant="outline" size="sm" onClick={fetchContracts} disabled={loading}>
              <ArrowClockwise className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {loading && !contracts.length ? (
            <div className="flex items-center justify-center py-20">
              <CircleNotch className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-14 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchContracts}>Retry</Button>
            </div>
          ) : (
            <Card className="overflow-hidden py-0 gap-0">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Contract #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Renewed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((c) => (
                      <TableRow
                        key={c.id}
                        onClick={() => selectContract(c)}
                        className={`cursor-pointer transition-colors ${
                          selected?.id === c.id
                            ? "bg-primary/5 border-l-2 border-l-primary"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <TableCell className="pl-4 font-mono text-sm">{c.contract_number}</TableCell>
                        <TableCell className="text-sm">
                          {c.customer?.last_name} {c.customer?.first_name}
                        </TableCell>
                        <TableCell className="text-sm">{c.room?.room_number}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(c.end_date)}
                        </TableCell>
                        <TableCell><StatusBadge status={c.status} /></TableCell>
                        <TableCell>
                          {c.renewed_from_contract_id && (
                            <Badge variant="outline" className="text-[10px]">renewal</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </div>

        {/* Right: selected contract details + actions */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Contract Details
          </h2>

          {!selected ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Select a contract to inspect & modify</p>
            </Card>
          ) : (
            <>
              {/* Detail card */}
              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold">{selected.contract_number}</span>
                  <StatusBadge status={selected.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Customer</p>
                    <p className="font-medium">{selected.customer?.last_name} {selected.customer?.first_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Room</p>
                    <p className="font-medium">{selected.room?.room_number}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Start Date</p>
                    <p className="font-medium">{formatDate(selected.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">End Date</p>
                    <p className="font-medium">{formatDate(selected.end_date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Base Rent</p>
                    <p className="font-medium">{Number(selected.base_rent).toLocaleString("vi-VN")}d</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Billing Cycle</p>
                    <p className="font-medium">{selected.billing_cycle}</p>
                  </div>
                  {selected.renewed_from_contract_id && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Renewed From</p>
                      <p className="font-medium font-mono">
                        {contracts.find((c) => c.id === selected.renewed_from_contract_id)?.contract_number || selected.renewed_from_contract_id}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Edit end_date */}
              <Card className="p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Edit end_date
                </p>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => { setEditEndDate(e.target.value); setEditing("end_date"); }}
                    className="flex-1 text-sm"
                  />
                  {editing === "end_date" && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="default" className="size-9"
                        disabled={saving} onClick={() => updateField("end_date", editEndDate)}>
                        <Check className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-9"
                        onClick={() => { setEditEndDate(selected.end_date || ""); setEditing(null); }}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={setEndDateSoon}>
                  Set end_date +5 days (trigger EXPIRING_SOON)
                </Button>
              </Card>

              {/* Edit status */}
              <Card className="p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Edit status
                </p>
                <div className="flex gap-2">
                  <select
                    value={editStatus}
                    onChange={(e) => { setEditStatus(e.target.value); setEditing("status"); }}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {SETTABLE_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_MAP[s]?.label || s}</option>
                    ))}
                  </select>
                  {editing === "status" && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="default" className="size-9"
                        disabled={saving} onClick={() => updateField("status", editStatus)}>
                        <Check className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-9"
                        onClick={() => { setEditStatus(selected.status || ""); setEditing(null); }}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={setStatusExpiringSoon}
                  disabled={saving || selected.status === "EXPIRING_SOON"}>
                  Quick: Set EXPIRING_SOON
                </Button>
              </Card>

              {/* Renewal chain */}
              {renewalChain.length > 1 && (
                <Card className="p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Renewal Chain
                  </p>
                  <div className="space-y-1.5">
                    {renewalChain.map((c, i) => (
                      <div key={c.id} className="flex items-center gap-2">
                        {i > 0 && <ArrowRight className="size-3 text-muted-foreground shrink-0" />}
                        <button
                          onClick={() => selectContract(c)}
                          className={`text-xs font-mono hover:underline ${
                            c.id === selected.id ? "text-primary font-bold" : "text-muted-foreground"
                          }`}
                        >
                          {c.contract_number}
                        </button>
                        <StatusBadge status={c.status} />
                        <span className="text-[10px] text-muted-foreground">{c.relation}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Activity log */}
          <Card className="p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Activity Log
            </p>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No activity yet</p>
              ) : (
                logs.map((log, i) => <LogEntry key={i} log={log} />)
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
