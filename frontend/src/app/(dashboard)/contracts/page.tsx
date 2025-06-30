'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Download, Pen, CheckCircle, Clock, AlertCircle } from '@/components/ui/Icon';
import { Contract, ContractStatus } from '@/types';
import { contractService } from '@/services/contracts';
import { useAuth } from '@/contexts/AuthContext';
import SignatureModal from '@/components/SignatureModal';

export default function ContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null);  
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [signing, setSigning] = useState<string | null>(null);
  const [signingContract, setSigningContract] = useState<Contract | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const bookingId = user?.bookingNumber || '';

  useEffect(() => {
    if (bookingId) {
      loadContracts();
    }
  }, [bookingId]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadContracts = async () => {
    try {
      setLoading(true);
      
      // Load contracts and status in parallel
      const [contractsData, statusData] = await Promise.all([
        contractService.getContracts(bookingId),
        contractService.getContractStatus(bookingId)
      ]);

      setContracts(contractsData.contracts);
      setContractStatus(statusData);
    } catch (error) {
      console.error('Failed to load contracts:', error);
      showNotification('error', 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async () => {
    try {
      setCreating(true);
      const result = await contractService.createContract(bookingId);
      
      showNotification('success', result.message || 'Contract created successfully');
      await loadContracts(); // Refresh the contracts list
    } catch (error) {
      console.error('Failed to create contract:', error);
      showNotification('error', 'Failed to create contract');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenSignatureModal = (contract: Contract) => {
    setSigningContract(contract);
  };

  const handleSignContract = async (signature: string) => {
    if (!signingContract) return;

    try {
      setSigning(signingContract.id);

      const signatureData = {
        signature,
        signedAt: new Date().toISOString()
      };

      const result = await contractService.signContract(signingContract.id, signatureData);
      
      showNotification('success', result.message || 'Contract signed successfully');
      await loadContracts(); // Refresh the contracts list
    } catch (error) {
      console.error('Failed to sign contract:', error);
      showNotification('error', 'Failed to sign contract');
    } finally {
      setSigning(null);
      setSigningContract(null);
    }
  };

  const getStatusIcon = (contract: Contract) => {
    if (contract.confirmed) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    if (contract.finalized && !contract.confirmed) {
      return <Pen className="h-5 w-5 text-yellow-600" />;
    }
    if (contract.sent) {
      return <Clock className="h-5 w-5 text-blue-600" />;
    }
    return <AlertCircle className="h-5 w-5 text-gray-600" />;
  };

  const getStatusBadgeClass = (contract: Contract) => {
    if (contract.confirmed) return 'badge-success';
    if (contract.finalized && !contract.confirmed) return 'badge-warning';
    if (contract.sent) return 'badge-info';
    return 'badge badge-gray';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-md ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              {notification.message}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Rental Agreements</h1>
            <p className="text-gray-600">
              Manage your motorcycle rental contracts and digital signatures
            </p>
          </div>

          {contractStatus && !contractStatus.hasContract && (
            <button 
              onClick={handleCreateContract}
              disabled={creating}
              className="btn-primary btn-md flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {creating ? 'Creating...' : 'Create Contract'}
            </button>
          )}
        </div>

        {/* Status Alerts */}
        {contractStatus && contractStatus.hasContract && contractStatus.needsSignature && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-center">
              <Pen className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800">
                Your rental agreement is ready for signature. Please review and sign the contract below.
              </span>
            </div>
          </div>
        )}

        {contractStatus && contractStatus.hasContract && contractStatus.signed && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800">
                Your rental agreement has been signed successfully on {new Date(contractStatus.signedAt!).toLocaleDateString()}.
              </span>
            </div>
          </div>
        )}

        {/* Contracts List */}
        {contracts.length === 0 && !loading ? (
          <div className="card">
            <div className="card-content flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">No Contracts Yet</h3>
              <p className="text-gray-600 text-center mb-4">
                Your rental agreements will appear here once they are created.
              </p>
              <button 
                onClick={handleCreateContract} 
                disabled={creating}
                className="btn-primary btn-md flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {creating ? 'Creating...' : 'Create First Contract'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {contracts.map((contract) => (
              <div key={contract.id} className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(contract)}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Rental Agreement #{contract.number}
                        </h3>
                        <p className="text-gray-600">
                          Created on {new Date(contract.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(contract)}`}>
                      {contractService.getStatusText(contract)}
                    </span>
                  </div>
                </div>
                
                <div className="card-content space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Customer</span>
                      <p className="font-medium text-gray-900">{contract.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Date</span>
                      <p className="text-gray-900">{new Date(contract.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Total Amount</span>
                      <p className="font-semibold text-gray-900">{contractService.formatPrice(contract.grand_total_in_cents)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Status</span>
                      <p className={contractService.getStatusColor(contract)}>
                        {contractService.getStatusText(contract)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    {contract.finalized && !contract.confirmed && (
                      <button 
                        onClick={() => handleOpenSignatureModal(contract)}
                        disabled={signing === contract.id}
                        className="btn-primary btn-md flex items-center gap-2"
                      >
                        <Pen className="h-4 w-4" />
                        {signing === contract.id ? 'Signing...' : 'Sign Contract'}
                      </button>
                    )}

                    {contract.confirmed && (
                      <span className="badge-success flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Signed
                      </span>
                    )}

                    <button className="btn-outline btn-sm ml-auto flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={!!signingContract}
        onClose={() => setSigningContract(null)}
        onSave={handleSignContract}
        title={`Sign Contract #${signingContract?.number || ''}`}
      />
    </div>
  );
} 