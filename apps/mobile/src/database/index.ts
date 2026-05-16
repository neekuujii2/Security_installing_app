import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { Job, LocationPing, PendingAction, Photo, Survey } from './models';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'smartSecurityDB',
  jsi: true,
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Job, LocationPing, PendingAction, Photo, Survey],
});

export { Job, LocationPing, PendingAction, Photo, Survey };
export default database;