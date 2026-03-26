import { useEffect, useMemo, useState } from "react";
import adminService, { type DoctorBasicDTO, type Room, type UpsertRoomRequest } from "../../services/adminService";

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [doctors, setDoctors] = useState<DoctorBasicDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<UpsertRoomRequest>({
    roomNumber: "",
    name: "",
    floor: null,
    isActive: true,
  });

  const doctorsById = useMemo(() => {
    const m = new Map<number, string>();
    doctors.forEach((d) => m.set(d.id, d.fullName));
    return m;
  }, [doctors]);

  const refresh = async () => {
    try {
      setLoading(true);
      setError("");
      const [roomData, doctorData] = await Promise.all([
        adminService.getRooms(),
        adminService.getDoctorsBasicList(),
      ]);
      setRooms(roomData || []);
      setDoctors(doctorData || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async () => {
    try {
      setError("");
      await adminService.createRoom({
        roomNumber: createForm.roomNumber.trim(),
        name: (createForm.name || "").trim() || undefined,
        floor: createForm.floor ?? undefined,
        isActive: createForm.isActive,
      });
      setIsCreateOpen(false);
      setCreateForm({ roomNumber: "", name: "", floor: null, isActive: true });
      await refresh();
    } catch (e: any) {
      if (e?.response?.status === 409) {
        setError("Room number already exists.");
        return;
      }
      setError(e?.response?.data?.message || "Failed to create room");
    }
  };

  const handleAssign = async (roomId: number, doctorIdStr: string) => {
    const doctorId = doctorIdStr ? Number(doctorIdStr) : null;
    try {
      setError("");
      await adminService.assignDoctorToRoom(roomId, doctorId);
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to assign doctor");
    }
  };

  const handleDelete = async (roomId: number) => {
    if (!confirm("Delete this room?")) return;
    try {
      setError("");
      await adminService.deleteRoom(roomId);
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to delete room");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Room Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create rooms and assign doctors (1 doctor / room).</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600"
        >
          + New Room
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/30 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="text-left px-4 py-3">Room</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Floor</th>
                <th className="text-left px-4 py-3">Active</th>
                <th className="text-left px-4 py-3">Assigned doctor</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.roomNumber}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.name || "-"}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.floor ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        r.isActive ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-400"
                      }`}
                    >
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.doctorId ?? ""}
                      onChange={(e) => handleAssign(r.id, e.target.value)}
                      className="w-full max-w-xs px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    >
                      <option value="">— Unassigned —</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {doctorsById.get(d.id) || d.fullName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                    No rooms yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsCreateOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create room</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Example: 301, 302...</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room number</label>
                <input
                  value={createForm.roomNumber}
                  onChange={(e) => setCreateForm((p) => ({ ...p, roomNumber: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  value={createForm.name || ""}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Floor</label>
                  <input
                    type="number"
                    value={createForm.floor ?? ""}
                    onChange={(e) => setCreateForm((p) => ({ ...p, floor: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <input
                    id="room-active"
                    type="checkbox"
                    checked={!!createForm.isActive}
                    onChange={(e) => setCreateForm((p) => ({ ...p, isActive: e.target.checked }))}
                  />
                  <label htmlFor="room-active" className="text-sm text-gray-700 dark:text-gray-300">
                    Active
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-6 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

