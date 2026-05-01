export type OrderStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  status: OrderStatus;
  customerName: string;
  carModel: string;
  carVin: string;
  origin: string;
  destination: string;
  dropoff: {
    lat: number;
    lng: number;
    address: string;
  };
  driverId: string | null;
  price: number;
  createdAt: any;
  updatedAt: any;
}

export type DriverStatus = 'available' | 'busy' | 'offline';

export interface Driver {
  id: string;
  name: string;
  email: string;
  status: DriverStatus;
  currentOrderId: string | null;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  deliveriesCount?: number;
  updatedAt: any;
}

export interface UserProfile {
  id: string;
  role: 'admin' | 'driver';
  email: string;
}
