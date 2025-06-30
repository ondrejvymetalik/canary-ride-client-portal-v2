import { apiService } from './api';
import { Inspection, Damage, InspectionPhoto, ApiResponse } from '@/types';

// New interfaces for WhipAround inspection data
export interface WhipAroundInspection {
  id: number;
  bookingNumber: string;
  riderName: string;
  kilometers: number | null;
  fuelLevel: string;
  fuelLevelPhoto: string;
  motorcyclePhotos: string[];
  helmetPhotos: string[];
  inspectorSignature: string;
  riderSignature: string;
  inspector: {
    name: string;
    email: string;
  };
  asset: {
    name: string;
    team: string;
  };
  dates: {
    created: string;
    completed: string;
  };
  pdfUrl: string;
  passed: boolean;
  completion: string;
}

export interface InspectionStatus {
  bookingId: string;
  hasInspection: boolean;
  inspectionType: string | null;
  completedAt: string | null;
  inspector: string | null;
  passed: boolean | null;
  assetName: string | null;
}

class InspectionsService {
  // Get inspection for a booking (new WhipAround format)
  async getInspection(bookingId: string): Promise<ApiResponse<{ inspection: WhipAroundInspection | null; message?: string }>> {
    return await apiService.get(`/inspections/${bookingId}`);
  }

  // Get inspection status for dashboard
  async getInspectionStatus(bookingId: string): Promise<ApiResponse<InspectionStatus>> {
    return await apiService.get(`/inspections/${bookingId}/status`);
  }

  // Legacy methods (for backward compatibility)
  async getInspections(bookingId: string): Promise<ApiResponse<Inspection[]>> {
    return await apiService.get(`/inspections/${bookingId}`);
  }

  async getHandoverInspection(bookingId: string): Promise<ApiResponse<Inspection>> {
    return await apiService.get(`/inspections/${bookingId}/handover`);
  }

  async getReturnInspection(bookingId: string): Promise<ApiResponse<Inspection>> {
    return await apiService.get(`/inspections/${bookingId}/return`);
  }

  async getInspectionPhotos(bookingId: string): Promise<ApiResponse<InspectionPhoto[]>> {
    return await apiService.get(`/inspections/${bookingId}/photos`);
  }

  async getDamageReports(bookingId: string): Promise<ApiResponse<Damage[]>> {
    return await apiService.get(`/inspections/${bookingId}/damages`);
  }

  async getInspectionSummary(bookingId: string): Promise<ApiResponse<any>> {
    return await apiService.get(`/inspections/${bookingId}/summary`);
  }

  // New methods for WhipAround inspection data
  formatFuelLevel(fuelLevel: string): { display: string; percentage: number; color: string } {
    const fuelMap: Record<string, { percentage: number; color: string }> = {
      'Empty': { percentage: 0, color: 'red' },
      '1/6': { percentage: 17, color: 'red' },
      '2/6': { percentage: 33, color: 'orange' },
      '3/6': { percentage: 50, color: 'yellow' },
      '4/6': { percentage: 67, color: 'lime' },
      '5/6': { percentage: 83, color: 'green' },
      'FULL': { percentage: 100, color: 'green' },
    };

    const fuelData = fuelMap[fuelLevel] || { percentage: 0, color: 'gray' };
    
    return {
      display: fuelLevel,
      percentage: fuelData.percentage,
      color: fuelData.color
    };
  }

  formatMileage(kilometers: number | null): string {
    if (kilometers === null) return 'N/A';
    return new Intl.NumberFormat().format(kilometers) + ' km';
  }

  formatInspectionDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getInspectionStatusDisplay(hasInspection: boolean, passed: boolean | null): {
    label: string;
    color: string;
    icon: string;
  } {
    if (!hasInspection) {
      return {
        label: 'Not Completed',
        color: 'gray',
        icon: '⏳'
      };
    }

    if (passed === true) {
      return {
        label: 'Done',
        color: 'green',
        icon: '✅'
      };
    }

    if (passed === false) {
      return {
        label: 'Done',
        color: 'green',
        icon: '✅'
      };
    }

    return {
      label: 'Completed',
      color: 'blue',
      icon: '📋'
    };
  }

  // Legacy methods (keeping for backward compatibility)
  getConditionDisplay(condition: Inspection['overallCondition']): {
    label: string;
    color: string;
    description: string;
  } {
    const conditionMap = {
      excellent: {
        label: 'Excellent',
        color: 'green',
        description: 'Vehicle in perfect condition',
      },
      good: {
        label: 'Good',
        color: 'blue',
        description: 'Vehicle in good condition with minor wear',
      },
      fair: {
        label: 'Fair',
        color: 'yellow',
        description: 'Vehicle shows some wear but functional',
      },
      poor: {
        label: 'Poor',
        color: 'red',
        description: 'Vehicle has significant issues',
      },
    };

    return conditionMap[condition] || {
      label: 'Unknown',
      color: 'gray',
      description: 'Condition not assessed',
    };
  }

  getDamageSeverityDisplay(severity: Damage['severity']): {
    label: string;
    color: string;
    icon: string;
  } {
    const severityMap = {
      minor: {
        label: 'Minor',
        color: 'yellow',
        icon: '⚠️',
      },
      moderate: {
        label: 'Moderate',
        color: 'orange',
        icon: '🔶',
      },
      major: {
        label: 'Major',
        color: 'red',
        icon: '🔴',
      },
    };

    return severityMap[severity] || {
      label: 'Unknown',
      color: 'gray',
      icon: '❓',
    };
  }

  getDamageTypeDisplayName(type: Damage['type']): string {
    const typeMap = {
      scratch: 'Scratch',
      dent: 'Dent',
      crack: 'Crack',
      missing_part: 'Missing Part',
      other: 'Other',
    };
    return typeMap[type] || 'Unknown';
  }

  isInspectionAvailable(inspection: Inspection | null): boolean {
    return inspection !== null && inspection.completedAt !== null;
  }

  compareInspections(handover: Inspection, returnInspection: Inspection): {
    newDamages: Damage[];
    mileageDifference: number;
    fuelDifference: number;
    conditionChange: string;
  } {
    const handoverDamageIds = new Set(handover.damages.map(d => d.id));
    const newDamages = returnInspection.damages.filter(d => !handoverDamageIds.has(d.id));

    const mileageDifference = returnInspection.mileage - handover.mileage;
    const fuelDifference = returnInspection.fuelLevel - handover.fuelLevel;

    let conditionChange = 'No change';
    const conditionValues = { excellent: 4, good: 3, fair: 2, poor: 1 };
    const handoverValue = conditionValues[handover.overallCondition];
    const returnValue = conditionValues[returnInspection.overallCondition];

    if (returnValue < handoverValue) {
      conditionChange = 'Deteriorated';
    } else if (returnValue > handoverValue) {
      conditionChange = 'Improved';
    }

    return {
      newDamages,
      mileageDifference,
      fuelDifference,
      conditionChange,
    };
  }

  groupPhotosByAngle(photos: InspectionPhoto[]): Record<string, InspectionPhoto[]> {
    return photos.reduce((groups, photo) => {
      const angle = photo.angle || 'other';
      if (!groups[angle]) {
        groups[angle] = [];
      }
      groups[angle].push(photo);
      return groups;
    }, {} as Record<string, InspectionPhoto[]>);
  }

  calculateTotalDamageCost(damages: Damage[]): number {
    return damages.reduce((total, damage) => {
      return total + (damage.estimatedCost || 0);
    }, 0);
  }
}

export const inspectionsService = new InspectionsService();
export default inspectionsService; 