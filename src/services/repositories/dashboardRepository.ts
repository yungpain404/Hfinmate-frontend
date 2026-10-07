import { HomeDashboardData } from '../../models/dashboard.model';
import { ApiResponse } from '../../models/api.model';
import { apiClient } from '../api/apiClient';
import { storageService } from '../storage/storageService';
import { INITIAL_DASHBOARD_DATA } from '../mock/mockData';

const DASHBOARD_KEY = 'home_dashboard_data';

export interface IDashboardRepository {
  getDashboardData(): Promise<HomeDashboardData>;
  refresh(): Promise<HomeDashboardData>;
}

class DashboardRepository implements IDashboardRepository {
  async getDashboardData(): Promise<HomeDashboardData> {
    try {
      const response = await apiClient.get<ApiResponse<HomeDashboardData>>('/dashboard');
      if (response.data && response.data.data) {
        const data = response.data.data;
        await storageService.setItem(DASHBOARD_KEY, data);
        return data;
      }
    } catch {
      // Backend not reached or offline, fallback to local storage
    }

    const cached = await storageService.getItem<HomeDashboardData>(DASHBOARD_KEY);
    if (!cached) {
      await storageService.setItem(DASHBOARD_KEY, INITIAL_DASHBOARD_DATA);
      return INITIAL_DASHBOARD_DATA;
    }
    return cached;
  }

  async refresh(): Promise<HomeDashboardData> {
    try {
      const response = await apiClient.post<ApiResponse<HomeDashboardData>>('/dashboard/refresh');
      if (response.data && response.data.data) {
        const data = response.data.data;
        await storageService.setItem(DASHBOARD_KEY, data);
        return data;
      }
    } catch {
      // Fallback
    }

    return this.getDashboardData();
  }
}

export const dashboardRepository: IDashboardRepository = new DashboardRepository();
