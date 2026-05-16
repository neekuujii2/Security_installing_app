🗄
DATABASE SCHEMA
Smart Security Ecosystem — PostgreSQL Schema Design


1. Core Tables
1.1 users
Column
Type
Nullable
Default
Description
id
UUID
NO
gen_random_uuid()
Primary Key
phone
VARCHAR(15)
NO
-
Unique, login identifier
email
VARCHAR(255)
YES
NULL
Optional email
full_name
VARCHAR(100)
NO
-
Display name
role
ENUM
NO
-
super_admin|dispatcher|technician|client|site_manager
status
ENUM
NO
active
active|inactive|suspended
avatar_url
TEXT
YES
NULL
Profile photo S3 URL
fcm_token
TEXT
YES
NULL
Firebase push token
created_at
TIMESTAMPTZ
NO
NOW()
Record creation time
updated_at
TIMESTAMPTZ
NO
NOW()
Last update time


1.2 technicians
Column
Type
Nullable
Default
Description
id
UUID
NO
gen_random_uuid()
Primary Key
user_id
UUID
NO
-
FK → users.id
employee_id
VARCHAR(20)
NO
-
Unique employee code
skills
TEXT[]
NO
{}
Array: [CCTV, DVR, Networking, ...]
current_lat
DECIMAL(10,8)
YES
NULL
Last known latitude
current_lng
DECIMAL(11,8)
YES
NULL
Last known longitude
location_updated_at
TIMESTAMPTZ
YES
NULL
Last GPS ping time
availability_status
ENUM
NO
available
available|busy|off_duty
active_job_id
UUID
YES
NULL
FK → jobs.id (current job)
total_jobs_done
INTEGER
NO
0
Lifetime completed jobs
rating
DECIMAL(3,2)
YES
NULL
Average client rating


1.3 clients
Column
Type
Nullable
Default
Description
id
UUID
NO
gen_random_uuid()
Primary Key
organization_name
VARCHAR(200)
NO
-
Company/Bank/Hotel name
client_type
ENUM
NO
-
bank|hotel|airport|corporate|other
is_high_security
BOOLEAN
NO
false
Triggers OTP workflow
contract_start
DATE
YES
NULL
AMC/contract start date
contract_end
DATE
YES
NULL
AMC/contract end date
billing_contact_id
UUID
YES
NULL
FK → users.id
created_at
TIMESTAMPTZ
NO
NOW()
Record creation time


1.4 sites
Column
Type
Nullable
Default
Description
id
UUID
NO
gen_random_uuid()
Primary Key
client_id
UUID
NO
-
FK → clients.id
site_name
VARCHAR(200)
NO
-
Branch/location name
address
TEXT
NO
-
Full address
city
VARCHAR(100)
NO
-
City
latitude
DECIMAL(10,8)
NO
-
Site GPS latitude
longitude
DECIMAL(11,8)
NO
-
Site GPS longitude
site_manager_id
UUID
YES
NULL
FK → users.id (site_manager role)
geofence_radius
INTEGER
NO
100
Check-in radius in meters
is_active
BOOLEAN
NO
true
Site operational status



2. Job Tables
2.1 jobs
Column
Type
Nullable
Default
Description
id
UUID
NO
gen_random_uuid()
Primary Key
job_number
VARCHAR(20)
NO
SSE-YYYYMMDD-NNN
Human-readable ID
client_id
UUID
NO
-
FK → clients.id
site_id
UUID
NO
-
FK → sites.id
assigned_technician_id
UUID
YES
NULL
FK → technicians.id
created_by
UUID
NO
-
FK → users.id (admin/dispatcher)
job_type
ENUM
NO
-
installation|maintenance|survey|fault_repair
status
ENUM
NO
pending
pending|assigned|en_route|checked_in|in_progress|completed|cancelled
priority
ENUM
NO
normal
low|normal|high|urgent
description
TEXT
YES
NULL
Scope of work
scheduled_at
TIMESTAMPTZ
YES
NULL
Scheduled start time
checkin_at
TIMESTAMPTZ
YES
NULL
Actual check-in time
checkout_at
TIMESTAMPTZ
YES
NULL
Actual check-out time
otp_verified
BOOLEAN
NO
false
OTP authorization status
client_signed
BOOLEAN
NO
false
Client signature received
report_url
TEXT
YES
NULL
S3 URL of generated PDF
created_at
TIMESTAMPTZ
NO
NOW()
Job creation time


2.2 job_surveys
Column
Type
Nullable
Description
id
UUID
NO
Primary Key
job_id
UUID
NO
FK → jobs.id (UNIQUE)
camera_count
INTEGER
YES
Total cameras installed
camera_models
JSONB
YES
[{model, type, qty}]
dvr_model
VARCHAR(100)
YES
DVR/NVR model
dvr_channels
INTEGER
YES
Number of channels
cable_length_meters
DECIMAL(8,2)
YES
Total cable used
power_points
INTEGER
YES
Power connections used
network_points
INTEGER
YES
Network drops installed
technician_notes
TEXT
YES
Additional observations
before_photos
TEXT[]
NO
Array of S3 URLs
after_photos
TEXT[]
NO
Array of S3 URLs
client_signature_url
TEXT
YES
S3 URL of signature image
submitted_at
TIMESTAMPTZ
YES
Form submission time



3. Inventory Tables
3.1 inventory_items
Column
Type
Nullable
Description
id
UUID
NO
Primary Key
sku
VARCHAR(50)
NO
Unique item code
name
VARCHAR(200)
NO
Item display name
category
ENUM
NO
camera|dvr|cable|connector|power|other
unit
VARCHAR(20)
NO
pcs|meters|rolls|boxes
current_stock
DECIMAL(10,2)
NO
Available quantity
min_stock_level
DECIMAL(10,2)
NO
Reorder trigger level
cost_price
DECIMAL(12,2)
YES
Purchase cost per unit
sell_price
DECIMAL(12,2)
YES
Billing price per unit
is_active
BOOLEAN
NO
Stock availability flag


3.2 job_materials (Junction Table)
Column
Type
Nullable
Description
id
UUID
NO
Primary Key
job_id
UUID
NO
FK → jobs.id
item_id
UUID
NO
FK → inventory_items.id
quantity_used
DECIMAL(10,2)
NO
Amount consumed
marked_by
UUID
NO
FK → users.id (technician)
marked_at
TIMESTAMPTZ
NO
When material was marked



4. Location & Audit Tables
4.1 location_pings
(High-volume table — archive monthly, keep 30-day rolling window in hot storage)
Column
Type
Nullable
Description
id
BIGSERIAL
NO
Auto-increment PK
technician_id
UUID
NO
FK → technicians.id
job_id
UUID
YES
FK → jobs.id (if on job)
latitude
DECIMAL(10,8)
NO
GPS latitude
longitude
DECIMAL(11,8)
NO
GPS longitude
accuracy_meters
DECIMAL(6,2)
YES
GPS accuracy
battery_level
SMALLINT
YES
Device battery %
recorded_at
TIMESTAMPTZ
NO
Ping timestamp (indexed)


4.2 audit_logs
Column
Type
Nullable
Description
id
UUID
NO
Primary Key
actor_id
UUID
NO
FK → users.id (who did it)
action
VARCHAR(100)
NO
job.created|otp.verified|job.completed...
entity_type
VARCHAR(50)
NO
job|user|inventory|site...
entity_id
UUID
YES
ID of affected record
old_value
JSONB
YES
State before change
new_value
JSONB
YES
State after change
ip_address
INET
YES
Actor IP address
created_at
TIMESTAMPTZ
NO
Event timestamp (immutable)



5. Key Indexes
Table
Index
Purpose
jobs
idx_jobs_status, idx_jobs_client
Dashboard queries
technicians
idx_tech_location (PostGIS GIST)
Nearest worker query
location_pings
idx_pings_tech_time (composite)
Route history queries
audit_logs
idx_audit_entity, idx_audit_actor
Compliance queries
inventory_items
idx_inv_category, idx_inv_sku
Stock searches


