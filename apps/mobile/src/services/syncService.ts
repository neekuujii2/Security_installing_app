import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { database } from '../database';
import { apiClient } from './api';

export interface SyncAction {
  id: string;
  actionType: string;
  jobId: string;
  payload: string;
  createdAt: number;
  synced: boolean;
  retryCount: number;
  lastError: string | null;
}

const MAX_RETRIES = 3;

class SyncService {
  private isProcessing = false;
  private unsubscribeNetInfo: (() => void) | null = null;

  constructor() {
    this.setupNetInfoListener();
  }

  private setupNetInfoListener() {
    this.unsubscribeNetInfo = NetInfo.addEventListener(async (state: NetInfoState) => {
      if (state.isConnected) {
        console.log('Network connected, starting sync...');
        await this.processPendingActions();
      } else {
        console.log('Network disconnected');
      }
    });
  }

  async saveAction(actionType: string, jobId: string, payload: object): Promise<void> {
    await database.write(async () => {
      await database.get('pending_actions').create((action: any) => {
        action.actionType = actionType;
        action.jobId = jobId;
        action.payload = JSON.stringify(payload);
        action.createdAt = Date.now();
        action.synced = false;
        action.retryCount = 0;
        action.lastError = null;
      });
    });
    console.log(`Saved pending action: ${actionType} for job ${jobId}`);
  }

  async processPendingActions(): Promise<{ success: number; failed: number }> {
    if (this.isProcessing) {
      console.log('Sync already in progress');
      return { success: 0, failed: 0 };
    }

    this.isProcessing = true;
    let success = 0;
    let failed = 0;

    try {
      const pendingActions = await database
        .get('pending_actions')
        .query()
        .fetch();

      console.log(`Found ${pendingActions.length} pending actions`);

      for (const action of pendingActions) {
        if (action.synced) continue;
        if (action.retryCount >= MAX_RETRIES) {
          console.log(`Action ${action.id} exceeded max retries, skipping`);
          continue;
        }

        try {
          await this.processAction(action);
          
          await database.write(async () => {
            await action.update((a: any) => {
              a.synced = true;
            });
          });
          success++;
          console.log(`Synced action: ${action.actionType}`);
        } catch (error: any) {
          failed++;
          await database.write(async () => {
            await action.update((a: any) => {
              a.retryCount = a.retryCount + 1;
              a.lastError = error.message || 'Unknown error';
            });
          });
          console.error(`Failed to sync action ${action.id}:`, error);
        }
      }

      await this.syncPendingPhotos();
    } catch (error) {
      console.error('Sync process error:', error);
    } finally {
      this.isProcessing = false;
    }

    return { success, failed };
  }

  private async processAction(action: SyncAction): Promise<void> {
    const payload = JSON.parse(action.payload);

    switch (action.actionType) {
      case 'check_in':
        await apiClient.post(`/jobs/${action.jobId}/check-in`, payload);
        break;

      case 'survey_submit':
        await apiClient.post(`/jobs/${action.jobId}/survey`, payload);
        break;

      case 'job_complete':
        await apiClient.post(`/jobs/${action.jobId}/complete`, payload);
        break;

      case 'materials_used':
        await apiClient.post('/inventory/use', payload);
        break;

      case 'otp_verify':
        await apiClient.post(`/jobs/${action.jobId}/verify-otp`, payload);
        break;

      default:
        console.warn(`Unknown action type: ${action.actionType}`);
    }
  }

  private async syncPendingPhotos(): Promise<void> {
    const pendingPhotos = await database
      .get('photos')
      .query()
      .fetch();

    for (const photo of pendingPhotos) {
      if (photo.uploaded) continue;

      try {
        const formData = new FormData();
        formData.append('photo', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: `photo_${photo.jobId}_${photo.type}.jpg`,
        } as any);
        formData.append('type', photo.type);

        await apiClient.post(`/jobs/${photo.jobId}/photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        await database.write(async () => {
          await photo.update((p: any) => {
            p.uploaded = true;
          });
        });
        console.log(`Uploaded photo for job ${photo.jobId}`);
      } catch (error) {
        console.error(`Failed to upload photo:`, error);
      }
    }
  }

  async getPendingCount(): Promise<number> {
    const pendingActions = await database
      .get('pending_actions')
      .query()
      .fetch();
    
    const pendingPhotos = await database
      .get('photos')
      .query()
      .fetch();

    const unsyncedPhotos = pendingPhotos.filter(p => !p.uploaded).length;

    return pendingActions.filter(a => !a.synced).length + unsyncedPhotos;
  }

  async forceSync(): Promise<void> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      throw new Error('No internet connection');
    }
    await this.processPendingActions();
  }

  cleanup() {
    this.unsubscribeNetInfo?.();
  }
}

export const syncService = new SyncService();
export default syncService;