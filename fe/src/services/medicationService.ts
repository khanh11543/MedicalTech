import api from './api';

// ==================== TYPES ====================

export interface MedicationDTO {
  id: number;
  code: string;
  name: string;
  genericName?: string;
  brandName?: string;
  category?: string;
  dosageForm?: string;
  strength?: string;
  unit?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  description?: string;
  sideEffects?: string;
  contraindications?: string;
  storageConditions?: string;
  requiresPrescription: boolean;
  unitPrice?: number;
  isActive: boolean;
  availableQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationCreateDTO {
  code: string;
  name: string;
  genericName?: string;
  brandName?: string;
  category?: string;
  dosageForm?: string;
  strength?: string;
  unit?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  description?: string;
  sideEffects?: string;
  contraindications?: string;
  storageConditions?: string;
  requiresPrescription?: boolean;
  unitPrice?: number;
  initialQuantity?: number;
}

export interface MedicationUpdateDTO {
  name?: string;
  genericName?: string;
  brandName?: string;
  category?: string;
  dosageForm?: string;
  strength?: string;
  unit?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  description?: string;
  sideEffects?: string;
  contraindications?: string;
  storageConditions?: string;
  requiresPrescription?: boolean;
  unitPrice?: number;
}

export interface InventoryUpdateDTO {
  type: 'IMPORT' | 'EXPORT' | 'ADJUST';
  quantity: number;
  note?: string;
}

export interface MedicationPage {
  content: MedicationDTO[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface MedicationFilterParams {
  search?: string;
  category?: string;
  requiresPrescription?: boolean;
  isActive?: boolean;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  size?: number;
}

export interface InventoryLogDTO {
  id: number;
  medicationId: number;
  medicationName: string;
  medicationCode: string;
  type: string;
  quantityBefore: number;
  quantityAfter: number;
  delta: number;
  note?: string;
  changedAt: string;
  userId?: number;
  userName?: string;
  referenceType?: string;
  referenceId?: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface InventoryAuditStatsDTO {
  totalLogs: number;
  logsToday: number;
  logsThisWeek: number;
  logsThisMonth: number;
  countByAction: Record<string, number>;
  availableActions: string[];
  availableReferenceTypes: string[];
}

export interface InventoryAuditFilterParams {
  medicationId?: number;
  action?: string;
  referenceType?: string;
  userId?: number;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface InventorySummaryDTO {
  totalMedications: number;
  activeMedications: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalUnits: number;
}

export interface InventoryLogPage {
  content: InventoryLogDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ==================== SERVICE ====================

const medicationService = {
  // Admin APIs
  async getAll(params: MedicationFilterParams = {}): Promise<MedicationPage> {
    const res = await api.get('/admin/medications', { params });
    return res.data;
  },

  async getById(id: number): Promise<MedicationDTO> {
    const res = await api.get(`/admin/medications/${id}`);
    return res.data;
  },

  async create(dto: MedicationCreateDTO): Promise<MedicationDTO> {
    const res = await api.post('/admin/medications', dto);
    return res.data;
  },

  async update(id: number, dto: MedicationUpdateDTO): Promise<MedicationDTO> {
    const res = await api.put(`/admin/medications/${id}`, dto);
    return res.data;
  },

  async updateInventory(id: number, dto: InventoryUpdateDTO): Promise<MedicationDTO> {
    const res = await api.patch(`/admin/medications/${id}/inventory`, dto);
    return res.data;
  },

  async toggleStatus(id: number): Promise<MedicationDTO> {
    const res = await api.patch(`/admin/medications/${id}/status`);
    return res.data;
  },

  async getInventoryLogs(id: number, page = 0, size = 20): Promise<InventoryLogPage> {
    const res = await api.get(`/admin/medications/${id}/inventory/logs`, { params: { page, size } });
    return res.data;
  },

  async getInventorySummary(): Promise<InventorySummaryDTO> {
    const res = await api.get('/admin/medications/inventory/summary');
    return res.data;
  },

  // Doctor APIs
  async searchForDoctor(search?: string, page = 0, size = 20): Promise<MedicationPage> {
    const res = await api.get('/doctor/medications/search', { params: { search, page, size } });
    return res.data;
  },

  // ==================== INVENTORY AUDIT LOG APIs ====================

  async getInventoryAuditLogs(params: InventoryAuditFilterParams = {}): Promise<InventoryLogPage> {
    const res = await api.get('/admin/inventory-audit-logs', { params });
    return res.data;
  },

  async getInventoryAuditLogDetail(id: number): Promise<InventoryLogDTO> {
    const res = await api.get(`/admin/inventory-audit-logs/${id}`);
    return res.data;
  },

  async getInventoryAuditStats(): Promise<InventoryAuditStatsDTO> {
    const res = await api.get('/admin/inventory-audit-logs/stats');
    return res.data;
  },
};

export default medicationService;
