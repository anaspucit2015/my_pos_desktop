/**
 * Represents a customer in the POS system.
 */
export interface ICustomer {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  loyaltyPoints: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data required to create a new customer.
 */
export interface CreateCustomerDTO {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
}

/**
 * Data for updating an existing customer. All fields optional.
 */
export interface UpdateCustomerDTO {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}
