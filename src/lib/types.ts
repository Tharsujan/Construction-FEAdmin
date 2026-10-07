export type ApiEnvelope<T> = {
  success: boolean;
  message: string | null;
  data: T;
};

export type AuthSession = {
  token: string;
  userId: string;
  name: string;
  email: string;
  role: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

export type OrderStatus = "Pending" | "Confirmed" | "OutForDelivery" | "Delivered" | "Cancelled";
export type PaymentStatus = "Unpaid" | "Paid";
export type EquipmentStatus = "Available" | "Rented" | "Maintenance";
export type RentalStatus = "Requested" | "Active" | "Returned" | "Cancelled";
export type ProjectStatus = "Planned" | "InProgress" | "OnHold" | "Completed";

export type LowStockProduct = {
  id: string;
  name: string;
  stockQuantity: number;
};

export type Stats = {
  openCementOrders: number;
  activeProjects: number;
  workersOnSite: number;
  equipmentOutOnRent: number;
  lowStockProducts: LowStockProduct[];
};

export type ProductUnit = {
  id: string;
  name: string;
  isActive: boolean;
};

export type CementProduct = {
  id: string;
  imageUrl: string;
  name: string;
  unitId: string;
  unitName: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
};

export type CementOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type CementOrder = {
  id: string;
  clientId: string;
  clientName: string;
  projectId: string | null;
  projectName: string | null;
  deliveryAddress: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string;
  items: CementOrderItem[];
};

export type Equipment = {
  id: string;
  name: string;
  code: string;
  dailyRate: number;
  status: EquipmentStatus;
};

export type Rental = {
  id: string;
  clientId: string;
  clientName: string;
  equipmentId: string;
  equipmentName: string;
  projectId: string | null;
  projectName: string | null;
  startDate: string;
  expectedReturn: string;
  actualReturn: string | null;
  siteAddress: string;
  deposit: number;
  dailyRate: number;
  total: number;
  status: RentalStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

export type Project = {
  id: string;
  name: string;
  summary: string;
  siteAddress: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  createdAt: string;
};

export type Assignment = {
  id: string;
  projectId: string;
  projectName: string;
  workerId: string;
  workerName: string;
  trade: string;
  startDate: string;
  endDate: string;
  dailyRate: number;
};

export type LinkedOrder = {
  id: string;
  clientName: string;
  status: string;
  total: number;
  createdAt: string;
};

export type LinkedRental = {
  id: string;
  clientName: string;
  equipmentName: string;
  status: string;
  startDate: string;
  expectedReturn: string;
};

export type ProjectWorkspace = {
  project: Project;
  assignments: Assignment[];
  cementOrders: LinkedOrder[];
  rentals: LinkedRental[];
};

export type Worker = {
  id: string;
  name: string;
  trade: string;
  phone: string;
  dailyRate: number;
  isActive: boolean;
};

export type WorkerDetail = {
  worker: Worker;
  assignments: Assignment[];
};
