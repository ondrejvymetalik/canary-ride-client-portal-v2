import { Contract, ContractStatus, SignatureData } from '@/types';
import { apiService } from './api';

export const contractService = {
  /**
   * Create a contract for a booking
   */
  async createContract(bookingId: string): Promise<{ contract: Contract; message: string }> {
    const response = await apiService.post(`/contracts/${bookingId}/create`);
    return response.data;
  },

  /**
   * Get contracts for a booking
   */
  async getContracts(bookingId: string): Promise<{ bookingId: string; contracts: Contract[] }> {
    const response = await apiService.get(`/contracts/${bookingId}`);
    return response.data;
  },

  /**
   * Get contract status for dashboard
   */
  async getContractStatus(bookingId: string): Promise<ContractStatus> {
    const response = await apiService.get(`/contracts/${bookingId}/status`);
    return response.data;
  },

  /**
   * Sign a contract
   */
  async signContract(contractId: string, signatureData: SignatureData): Promise<{ contract: Contract; message: string }> {
    const response = await apiService.post(`/contracts/${contractId}/sign`, signatureData);
    return response.data;
  },

  /**
   * Format contract price for display
   */
  formatPrice(priceInCents: number): string {
    return `€${(priceInCents / 100).toFixed(2)}`;
  },

  /**
   * Get contract status display text
   */
  getStatusText(contract: Contract): string {
    if (contract.confirmed) {
      return 'Signed';
    }
    if (contract.finalized && !contract.confirmed) {
      return 'Awaiting Signature';
    }
    if (contract.sent) {
      return 'Sent';
    }
    return 'Draft';
  },

  /**
   * Get contract status color
   */
  getStatusColor(contract: Contract): string {
    if (contract.confirmed) {
      return 'text-green-600';
    }
    if (contract.finalized && !contract.confirmed) {
      return 'text-yellow-600';
    }
    if (contract.sent) {
      return 'text-blue-600';
    }
    return 'text-gray-600';
  }
}; 