import { Customer } from '@prisma/client';

export interface TransactionRequest {
  buyer_sku_code: string;
  customer_no: string;
  username: string;
  ref_id: string;
  transactionDetail: TransactionDetail;
}

export interface TransactionDetail {
  customerData: Customer;
  bill: Bill;
}

export interface Bill {
  itemPrice: number;
  userBalance: number;
  profit: number;
}

export enum TransactionStatus {
  PENDING = 'Pending',
  SUCCESS = 'Sukses',
  FAILED = 'Gagal',
}

export interface RetryItemkuTransaction {
  buyer_sku_code: string, 
  customer_no: string, 
  ref_id: string
}
