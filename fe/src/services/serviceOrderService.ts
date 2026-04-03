import api from './api';

// =========== ENUMS ===========

export enum ServiceOrderStatus {
  ORDERED = 'ORDERED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ServiceCategory {
  DIAGNOSTIC_IMAGING = 'DIAGNOSTIC_IMAGING',
  LABORATORY = 'LABORATORY',
  ULTRASOUND = 'ULTRASOUND',
  CARDIOLOGY_TEST = 'CARDIOLOGY_TEST',
  PATHOLOGY = 'PATHOLOGY',
  ENDOSCOPY = 'ENDOSCOPY',
  OTHER = 'OTHER',
}

export enum ServicePriority {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  STAT = 'STAT',
}

// =========== INTERFACES ===========

export interface ServiceOrderDTO {
  id: number;
  consultationId: number;
  appointmentId: number;
  serviceName: string;
  category: string;
  price: number | null;
  priority: string;
  notes: string | null;
  status: string;
  orderedAt: string;
  orderedByDoctorName: string;
  performedBy: string | null;
  result: string | null;
  completedAt: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  paidAt: string | null;
  paidByName: string | null;
  targetDepartment: string | null;
  assignedDoctorId: number | null;
  assignedDoctorName: string | null;
  serviceResultId: number | null;
  patientName: string | null;
  appointmentCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrderCreateDTO {
  serviceName: string;
  category: string;
  medicalServiceId?: number;
  price: number | null;
  priority: string;
  notes: string;
}

export interface MedicalServiceDTO {
  id: number;
  serviceName: string;
  category: string;
  defaultPrice: number | null;
  description: string | null;
  active: boolean;
}

// =========== Display Helpers ===========

export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  DIAGNOSTIC_IMAGING: 'Diagnostic Imaging',
  LABORATORY: 'Laboratory',
  ULTRASOUND: 'Ultrasound',
  CARDIOLOGY_TEST: 'Cardiology Test',
  PATHOLOGY: 'Pathology',
  ENDOSCOPY: 'Endoscopy',
  OTHER: 'Other',
};

export const SERVICE_STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  ORDERED: { label: 'Ordered', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  PENDING_PAYMENT: { label: 'Pending Payment', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
  PAID: { label: 'Paid', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  COMPLETED: { label: 'Completed', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300' },
};

// =========== SERVICE ===========

class ServiceOrderService {
  async getServiceCatalog(category?: string): Promise<MedicalServiceDTO[]> {
    const params = category ? { category } : {};
    const response = await api.get<MedicalServiceDTO[]>(
      '/doctor/service-orders/catalog',
      { params }
    );
    return response.data;
  }

  async getServiceOrders(appointmentId: number): Promise<ServiceOrderDTO[]> {
    const response = await api.get<ServiceOrderDTO[]>(
      `/doctor/service-orders/appointment/${appointmentId}`
    );
    return response.data;
  }

  async createServiceOrder(appointmentId: number, dto: ServiceOrderCreateDTO): Promise<ServiceOrderDTO> {
    const response = await api.post<ServiceOrderDTO>(
      `/doctor/service-orders/appointment/${appointmentId}`,
      dto
    );
    return response.data;
  }

  async cancelServiceOrder(serviceOrderId: number): Promise<ServiceOrderDTO> {
    const response = await api.patch<ServiceOrderDTO>(
      `/doctor/service-orders/${serviceOrderId}/cancel`
    );
    return response.data;
  }

  async hasPendingServiceOrders(appointmentId: number): Promise<boolean> {
    const response = await api.get<{ hasPending: boolean }>(
      `/doctor/service-orders/appointment/${appointmentId}/has-pending`
    );
    return response.data.hasPending;
  }

  // =========== Receptionist APIs ===========

  async getServiceOrdersForReceptionist(appointmentId: number): Promise<ServiceOrderDTO[]> {
    const response = await api.get<ServiceOrderDTO[]>(
      `/receptionist/service-orders/appointment/${appointmentId}`
    );
    return response.data;
  }

  async getPendingPaymentOrders(appointmentId: number): Promise<ServiceOrderDTO[]> {
    const response = await api.get<ServiceOrderDTO[]>(
      `/receptionist/service-orders/appointment/${appointmentId}/pending-payment`
    );
    return response.data;
  }

  async collectPayment(serviceOrderId: number, paymentMethod: 'CASH' | 'MOMO'): Promise<ServiceOrderDTO> {
    const response = await api.post<ServiceOrderDTO>(
      `/receptionist/service-orders/${serviceOrderId}/collect-payment`,
      { paymentMethod }
    );
    return response.data;
  }

  async collectPaymentBatch(serviceOrderIds: number[], paymentMethod: 'CASH' | 'MOMO'): Promise<ServiceOrderDTO[]> {
    const response = await api.post<ServiceOrderDTO[]>(
      `/receptionist/service-orders/collect-payment-batch`,
      { serviceOrderIds, paymentMethod }
    );
    return response.data;
  }

  async initMomoForServiceOrders(appointmentId: number, serviceOrderIds: number[]): Promise<{
    paymentId: number;
    paymentCode: string;
    payUrl: string;
    qrCodeUrl: string;
    orderId: string;
    message: string;
    success: boolean;
  }> {
    const response = await api.post(
      `/receptionist/service-orders/momo-init`,
      { appointmentId, serviceOrderIds }
    );
    return response.data;
  }
}

const serviceOrderService = new ServiceOrderService();
export default serviceOrderService;
