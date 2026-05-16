import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, children } from '@nozbe/watermelondb/decorators';

export class Job extends Model {
  static table = 'jobs';

  @text('job_id') jobId!: string;
  @text('job_number') jobNumber!: string;
  @text('client_name') clientName!: string;
  @text('site_name') siteName!: string;
  @text('site_address') siteAddress!: string;
  @field('site_latitude') siteLatitude!: number;
  @field('site_longitude') siteLongitude!: number;
  @text('job_type') jobType!: string;
  @text('description') description!: string;
  @text('priority') priority!: string;
  @text('status') status!: string;
  @date('scheduled_at') scheduledAt!: Date;
  @text('materials_required') materialsRequired!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class LocationPing extends Model {
  static table = 'location_pings';

  @text('job_id') jobId!: string;
  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('accuracy') accuracy!: number;
  @field('timestamp') timestamp!: number;
  @field('synced') synced!: boolean;
}

export class PendingAction extends Model {
  static table = 'pending_actions';

  @text('action_type') actionType!: string;
  @text('job_id') jobId!: string;
  @text('payload') payload!: string;
  @field('created_at') createdAt!: number;
  @field('synced') synced!: boolean;
  @field('retry_count') retryCount!: number;
  @text('last_error') lastError!: string | null;
}

export class Photo extends Model {
  static table = 'photos';

  @text('job_id') jobId!: string;
  @text('type') type!: string;
  @text('uri') uri!: string;
  @field('uploaded') uploaded!: boolean;
  @readonly @date('created_at') createdAt!: Date;
}

export class Survey extends Model {
  static table = 'surveys';

  @text('job_id') jobId!: string;
  @field('camera_count') cameraCount!: number;
  @text('camera_models') cameraModels!: string;
  @text('dvr_model') dvrModel!: string;
  @field('cable_length') cableLength!: number;
  @field('power_points') powerPoints!: number;
  @text('notes') notes!: string;
  @field('synced') synced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
}

export default { Job, LocationPing, PendingAction, Photo, Survey };