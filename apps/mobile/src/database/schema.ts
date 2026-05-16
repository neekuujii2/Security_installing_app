import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'jobs',
      columns: [
        { name: 'job_id', type: 'string' },
        { name: 'job_number', type: 'string' },
        { name: 'client_name', type: 'string' },
        { name: 'site_name', type: 'string' },
        { name: 'site_address', type: 'string' },
        { name: 'site_latitude', type: 'number' },
        { name: 'site_longitude', type: 'number' },
        { name: 'job_type', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'priority', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'scheduled_at', type: 'number' },
        { name: 'materials_required', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'location_pings',
      columns: [
        { name: 'job_id', type: 'string', isIndexed: true },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'accuracy', type: 'number' },
        { name: 'timestamp', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'pending_actions',
      columns: [
        { name: 'action_type', type: 'string', isIndexed: true },
        { name: 'job_id', type: 'string', isIndexed: true },
        { name: 'payload', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
        { name: 'retry_count', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'photos',
      columns: [
        { name: 'job_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'uri', type: 'string' },
        { name: 'uploaded', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'surveys',
      columns: [
        { name: 'job_id', type: 'string', isIndexed: true },
        { name: 'camera_count', type: 'number' },
        { name: 'camera_models', type: 'string' },
        { name: 'dvr_model', type: 'string' },
        { name: 'cable_length', type: 'number' },
        { name: 'power_points', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});

export default schema;