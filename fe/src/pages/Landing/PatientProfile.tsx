import { useState, useEffect, useRef } from "react";
import userService from "../../services/userService";
import userSettingsService from "../../services/userSettingsService";
import patientService from "../../services/patientService";
import { useAuth } from "../../context/AuthContext";
import { getAvatarUrl } from "../../utils/avatar";

interface Profile {
  id: number;
  name: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  mrn: string;
  cccd: string;
  bhyt: string;
  ethnicity: string;
  occupation: string;
  insuranceNumber: string;
  insuranceProvider: string;
  emergencyContact: string;
  bloodGroup: string;
  allergies: string;
  medicalHistory: string;
  avatarUrl: string | null;
  isSelf: boolean;
  isComplete: boolean;
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone || "—";
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}
function maskCccd(id: string): string {
  if (!id || id.length < 4) return "—";
  return `${"*".repeat(id.length - 4)}${id.slice(-4)}`;
}

export default function PatientProfile() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { updateUserProfile } = useAuth();

  // Load profile from API (patient profile when available, else user profile)
  useEffect(() => {
    setLoading(true);
    patientService.getMyProfile()
      .then((data) => {
        setIsPatientProfile(true);
        const profile: Profile = {
          id: data.userId,
          name: data.fullName || data.email,
          dateOfBirth: data.dateOfBirth || "",
          gender: data.gender || "",
          phone: data.phone || "",
          email: data.email,
          address: data.address || "",
          mrn: "",
          cccd: data.idNumber || "",
          bhyt: data.insuranceNumber || "",
          ethnicity: "",
          occupation: "",
          insuranceNumber: data.insuranceNumber || "",
          insuranceProvider: data.insuranceProvider || "",
          emergencyContact: data.emergencyContact || "",
          bloodGroup: data.bloodGroup || "",
          allergies: data.allergies || "",
          medicalHistory: data.medicalHistory || "",
          avatarUrl: getAvatarUrl(data.avatarUrl) || null,
          isSelf: true,
          isComplete: !!(data.fullName && data.phone),
        };
        setProfiles([profile]);
        setActiveProfileId(profile.id);
      })
      .catch(() => {
        setIsPatientProfile(false);
        userService.getProfile().then((user) => {
          const profile: Profile = {
            id: user.id,
            name: user.fullName || user.email,
            dateOfBirth: "",
            gender: "",
            phone: user.phone || "",
            email: user.email,
            address: "",
            mrn: "",
            cccd: "",
            bhyt: "",
            ethnicity: "",
            occupation: "",
            insuranceNumber: "",
            insuranceProvider: "",
            emergencyContact: "",
            bloodGroup: "",
            allergies: "",
            medicalHistory: "",
            avatarUrl: getAvatarUrl(user.avatarUrl) || null,
            isSelf: true,
            isComplete: !!(user.fullName && user.phone),
          };
          setProfiles([profile]);
          setActiveProfileId(profile.id);
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please select a valid image file (JPG, PNG, GIF, or WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const updated = await userSettingsService.uploadAvatar(file);
      const resolvedUrl = getAvatarUrl(updated.avatarUrl);
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === activeProfileId ? { ...p, avatarUrl: resolvedUrl } : p
        )
      );
      updateUserProfile({ avatarUrl: updated.avatarUrl });
    } catch {
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];
  const filteredProfiles = profiles.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    email: "",
    cccd: "",
    occupation: "",
    bhyt: "",
    insuranceNumber: "",
    insuranceProvider: "",
    emergencyContact: "",
    bloodGroup: "",
    allergies: "",
    medicalHistory: "",
  });
  const [addForm, setAddForm] = useState({ name: "", dateOfBirth: "", gender: "Male", phone: "", email: "", address: "", relationship: "" });
  const [isPatientProfile, setIsPatientProfile] = useState(false);

  const handleOpenEdit = () => {
    if (!activeProfile) return;
    setEditForm({
      fullName: activeProfile.name,
      phone: activeProfile.phone,
      dateOfBirth: activeProfile.dateOfBirth || "",
      gender: activeProfile.gender || "",
      address: activeProfile.address,
      email: activeProfile.email,
      cccd: activeProfile.cccd || "",
      occupation: activeProfile.occupation,
      bhyt: activeProfile.bhyt || activeProfile.insuranceNumber,
      insuranceNumber: activeProfile.insuranceNumber || activeProfile.bhyt,
      insuranceProvider: activeProfile.insuranceProvider,
      emergencyContact: activeProfile.emergencyContact,
      bloodGroup: activeProfile.bloodGroup,
      allergies: activeProfile.allergies,
      medicalHistory: activeProfile.medicalHistory,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!activeProfile) return;
    setSaving(true);
    try {
      if (isPatientProfile) {
        const updated = await patientService.updateMyProfile({
          fullName: editForm.fullName || undefined,
          phone: editForm.phone || undefined,
          dateOfBirth: editForm.dateOfBirth || undefined,
          gender: editForm.gender || undefined,
          address: editForm.address || undefined,
          idNumber: editForm.cccd || undefined,
          insuranceNumber: editForm.insuranceNumber || editForm.bhyt || undefined,
          insuranceProvider: editForm.insuranceProvider || undefined,
          emergencyContact: editForm.emergencyContact || undefined,
          bloodGroup: editForm.bloodGroup || undefined,
          allergies: editForm.allergies || undefined,
          medicalHistory: editForm.medicalHistory || undefined,
        });
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === activeProfileId
              ? {
                  ...p,
                  name: updated.fullName || p.name,
                  phone: updated.phone || p.phone,
                  dateOfBirth: updated.dateOfBirth || "",
                  gender: updated.gender || "",
                  address: updated.address || "",
                  email: updated.email || p.email,
                  cccd: updated.idNumber || "",
                  bhyt: updated.insuranceNumber || "",
                  insuranceNumber: updated.insuranceNumber || "",
                  insuranceProvider: updated.insuranceProvider || "",
                  emergencyContact: updated.emergencyContact || "",
                  bloodGroup: updated.bloodGroup || "",
                  allergies: updated.allergies || "",
                  medicalHistory: updated.medicalHistory || "",
                }
              : p
          )
        );
      } else {
        const updated = await userService.updateProfile({
          fullName: editForm.fullName || undefined,
          phone: editForm.phone || undefined,
        });
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === activeProfileId
              ? { ...p, name: updated.fullName || p.name, phone: updated.phone || p.phone }
              : p
          )
        );
      }
      setShowEditModal(false);
    } catch {
      // Could show error toast
    } finally {
      setSaving(false);
    }
  };

  const handleAddProfile = () => {
    const np: Profile = {
      id: Date.now(),
      name: addForm.name,
      dateOfBirth: addForm.dateOfBirth,
      gender: addForm.gender,
      phone: addForm.phone,
      email: addForm.email,
      address: addForm.address,
      mrn: `YMP${Date.now().toString().slice(-9)}`,
      cccd: "",
      bhyt: "",
      ethnicity: "",
      occupation: "",
      insuranceNumber: "",
      insuranceProvider: "",
      emergencyContact: "",
      bloodGroup: "",
      allergies: "",
      medicalHistory: "",
      avatarUrl: null,
      isSelf: false,
      isComplete: false,
    };
    setProfiles((prev) => [...prev, np]);
    setActiveProfileId(np.id);
    setShowAddModal(false);
    setAddForm({ name: "", dateOfBirth: "", gender: "Male", phone: "", email: "", address: "", relationship: "" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-72 mb-6"></div>
          <div className="flex gap-5">
            <div className="w-64 h-96 bg-gray-200 rounded-2xl"></div>
            <div className="flex-1 space-y-5">
              <div className="h-32 bg-gray-200 rounded-2xl"></div>
              <div className="h-48 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Unable to load profile. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Medical Profile</h2>
          <p className="text-sm text-gray-400 mt-1">Manage your medical records and family members</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#049ebb] rounded-xl hover:bg-[#037a94] transition-all shadow-md shadow-[#049ebb]/20 border-none cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Add Profile
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left: Profile Selector */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 lg:sticky lg:top-24">
            {/* Search */}
            <div className="relative mb-2.5">
              <svg className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#049ebb]/30 focus:border-[#049ebb] bg-gray-50"
              />
            </div>

            <div className="space-y-1 max-h-[360px] overflow-y-auto">
              {filteredProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProfileId(p.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer border-2 ${
                    activeProfileId === p.id
                      ? "border-[#049ebb] bg-[#049ebb]/5"
                      : "border-transparent bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      activeProfileId === p.id ? "bg-[#049ebb] text-white" : "bg-gray-200 text-gray-600"
                    }`}>
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                        {p.isSelf && (
                          <span className="text-[9px] font-bold text-[#049ebb] bg-[#049ebb]/10 px-1.5 py-0.5 rounded-full shrink-0">Me</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400">{p.dateOfBirth}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Profile Detail */}
        <div className="flex-1 space-y-5 min-w-0">
          {/* Name Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <button
                  type="button"
                  onClick={() => activeProfile.isSelf && avatarInputRef.current?.click()}
                  className={`relative group w-14 h-14 rounded-full overflow-hidden border-none p-0 bg-transparent ${activeProfile.isSelf ? 'cursor-pointer' : 'cursor-default'}`}
                  disabled={uploadingAvatar}
                  title={activeProfile.isSelf ? "Click to change avatar" : undefined}
                >
                  {activeProfile.avatarUrl ? (
                    <img src={activeProfile.avatarUrl} alt={activeProfile.name} className="w-14 h-14 rounded-full object-cover shadow-md shadow-[#049ebb]/20" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#049ebb] to-[#027a94] flex items-center justify-center text-white text-lg font-bold shadow-md shadow-[#049ebb]/20">
                      {activeProfile.name.charAt(0)}
                    </div>
                  )}
                  {activeProfile.isSelf && !uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
                <div>
                  <h3 className="text-base font-bold text-gray-900 uppercase">{activeProfile.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">MRN: <span className="font-medium text-gray-600">{activeProfile.mrn}</span></p>
                </div>
              </div>
              <button
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#049ebb] border border-[#049ebb]/30 rounded-xl hover:bg-[#049ebb] hover:text-white transition-all bg-transparent cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit Profile
              </button>
            </div>
            {!activeProfile.isComplete && (
              <div className="mt-4 flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                <p className="text-xs text-amber-800">Complete your information to book appointments faster</p>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3.5 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#049ebb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Basic Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <InfoField label="Full Name" value={activeProfile.name} />
              <InfoField label="Phone" value={maskPhone(activeProfile.phone)} />
              <InfoField label="Date of Birth" value={activeProfile.dateOfBirth || "Not updated"} muted={!activeProfile.dateOfBirth} />
              <InfoField label="Gender" value={activeProfile.gender || "Not updated"} muted={!activeProfile.gender} />
              <div className="sm:col-span-2">
                <InfoField label="Address" value={activeProfile.address || "Not updated"} muted={!activeProfile.address} />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3.5 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#049ebb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Additional Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <InfoField label="Insurance ID (BHYT)" value={activeProfile.insuranceNumber || activeProfile.bhyt || "Not updated"} muted={!(activeProfile.insuranceNumber || activeProfile.bhyt)} />
              <InfoField label="Insurance Provider" value={activeProfile.insuranceProvider || "Not updated"} muted={!activeProfile.insuranceProvider} />
              <InfoField label="Emergency Contact" value={activeProfile.emergencyContact || "Not updated"} muted={!activeProfile.emergencyContact} />
              <InfoField label="Blood Group" value={activeProfile.bloodGroup || "Not updated"} muted={!activeProfile.bloodGroup} />
              <InfoField label="ID Number (CCCD)" value={activeProfile.cccd ? (activeProfile.cccd.startsWith("*") ? activeProfile.cccd : maskCccd(activeProfile.cccd)) : "Not updated"} muted={!activeProfile.cccd} />
              <InfoField label="Occupation" value={activeProfile.occupation || "Not updated"} muted={!activeProfile.occupation} />
              {activeProfile.allergies && (
                <div className="sm:col-span-2">
                  <InfoField label="Allergies" value={activeProfile.allergies} />
                </div>
              )}
              {activeProfile.medicalHistory && (
                <div className="sm:col-span-2">
                  <InfoField label="Medical History" value={activeProfile.medicalHistory} />
                </div>
              )}
              <div className="sm:col-span-2">
                <InfoField label="Email" value={activeProfile.email || "Not updated"} muted={!activeProfile.email} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh] sm:max-h-[85vh] mt-auto sm:mt-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100 shrink-0">
              <h3 className="text-sm font-semibold text-gray-900">Edit Profile</h3>
              <button type="button" aria-label="Close edit modal" onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all bg-transparent border-none cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-4 sm:px-5 pt-4 pb-6 space-y-3 overflow-y-auto min-h-0 flex-1 overscroll-contain">
              <ModalInput label="Full Name" value={editForm.fullName} onChange={(v) => setEditForm((f) => ({ ...f, fullName: v }))} placeholder="Enter full name" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={(e) => setEditForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#049ebb]/30 focus:border-[#049ebb]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#049ebb]/30 focus:border-[#049ebb] bg-white"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <ModalInput label="Phone" value={editForm.phone} onChange={(v) => setEditForm((f) => ({ ...f, phone: v }))} placeholder="Enter phone number" />
              <ModalInput label="Address" value={editForm.address} onChange={(v) => setEditForm((f) => ({ ...f, address: v }))} placeholder="Enter address" />
              <ModalInput label="Email" value={editForm.email} placeholder="Email (from account)" disabled />
              <h5 className="text-xs font-semibold text-gray-600 mt-3 pt-3 border-t border-gray-100">Additional Information</h5>
              <div className="grid grid-cols-2 gap-3">
                <ModalInput label="ID Number (CCCD)" value={editForm.cccd} onChange={(v) => setEditForm((f) => ({ ...f, cccd: v }))} placeholder="ID / Passport number" />
                <ModalInput label="Insurance ID (BHYT)" value={editForm.insuranceNumber || editForm.bhyt} onChange={(v) => setEditForm((f) => ({ ...f, insuranceNumber: v, bhyt: v }))} placeholder="Insurance ID" />
                <ModalInput label="Insurance Provider" value={editForm.insuranceProvider} onChange={(v) => setEditForm((f) => ({ ...f, insuranceProvider: v }))} placeholder="Provider" />
                <ModalInput label="Emergency Contact" value={editForm.emergencyContact} onChange={(v) => setEditForm((f) => ({ ...f, emergencyContact: v }))} placeholder="Phone" />
                <ModalInput label="Blood Group" value={editForm.bloodGroup} onChange={(v) => setEditForm((f) => ({ ...f, bloodGroup: v }))} placeholder="e.g. A+" />
              </div>
              <ModalInput label="Allergies" value={editForm.allergies} onChange={(v) => setEditForm((f) => ({ ...f, allergies: v }))} placeholder="Allergies (if any)" />
              <div className="pb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Medical History</label>
                <textarea
                  value={editForm.medicalHistory}
                  onChange={(e) => setEditForm((f) => ({ ...f, medicalHistory: e.target.value }))}
                  placeholder="Brief medical history (optional)"
                  rows={2}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#049ebb]/30 focus:border-[#049ebb] resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 sm:px-5 py-3 border-t border-gray-100 shrink-0 bg-gray-50/50 rounded-b-2xl">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#049ebb] rounded-xl hover:bg-[#037a94] disabled:opacity-50 transition-all border-none cursor-pointer">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh] sm:max-h-[85vh] mt-auto sm:mt-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100 shrink-0">
              <h3 className="text-sm font-semibold text-gray-800">Add New Profile</h3>
              <button type="button" aria-label="Close add modal" onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all bg-transparent border-none cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-4 sm:px-5 pt-4 pb-6 space-y-3 overflow-y-auto min-h-0 flex-1 overscroll-contain">
              <ModalInput label="Full Name" value={addForm.name} onChange={(v) => setAddForm((f) => ({ ...f, name: v }))} placeholder="Enter full name" required />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
                  <input id="add-dob" type="date" aria-label="Date of Birth" value={addForm.dateOfBirth} onChange={(e) => setAddForm((f) => ({ ...f, dateOfBirth: e.target.value }))} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#049ebb]/30 focus:border-[#049ebb]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Gender <span className="text-red-500">*</span></label>
                  <select id="add-gender" aria-label="Gender" value={addForm.gender} onChange={(e) => setAddForm((f) => ({ ...f, gender: e.target.value }))} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#049ebb]/30 focus:border-[#049ebb] bg-white">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <ModalInput label="Phone Number" value={addForm.phone} onChange={(v) => setAddForm((f) => ({ ...f, phone: v }))} placeholder="Phone number" required />
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Relationship</label>
                <select id="add-relationship" aria-label="Relationship" value={addForm.relationship} onChange={(e) => setAddForm((f) => ({ ...f, relationship: e.target.value }))} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#049ebb]/30 focus:border-[#049ebb] bg-white">
                  <option value="">Select relationship</option>
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <ModalInput label="Address" value={addForm.address} onChange={(v) => setAddForm((f) => ({ ...f, address: v }))} placeholder="Enter address" />
            </div>
            <div className="flex justify-end gap-2 px-4 sm:px-5 py-3 border-t border-gray-100 shrink-0 bg-gray-50/50 rounded-b-2xl">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">Cancel</button>
              <button onClick={handleAddProfile} disabled={!addForm.name || !addForm.dateOfBirth || !addForm.phone} className="px-4 py-2 text-sm font-medium text-white bg-[#049ebb] rounded-xl hover:bg-[#037a94] disabled:opacity-50 disabled:cursor-not-allowed transition-all border-none cursor-pointer">Add Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Small helper components ─── */
function InfoField({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="py-2.5 px-3.5 bg-gray-50 rounded-xl">
      <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${muted ? "text-gray-400 italic" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function ModalInput({ label, value, onChange, placeholder, disabled, required }: {
  label: string; value: string; onChange?: (v: string) => void; placeholder?: string; disabled?: boolean; required?: boolean;
}) {
  return (
    <div>
      <label className={`block text-xs font-medium mb-1.5 ${disabled ? "text-gray-400" : "text-gray-700"}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#049ebb]/30 focus:border-[#049ebb] ${disabled ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" : "border-gray-200"}`}
      />
    </div>
  );
}
