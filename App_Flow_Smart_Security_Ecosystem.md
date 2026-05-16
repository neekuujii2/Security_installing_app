🔄

**APP FLOW DOCUMENT**

**Smart Security Ecosystem --- Complete User Journeys**

**Flow 1: Admin Web Dashboard Journey**

**1.1 Login & Dashboard Load**

1.  Admin opens web app → Login page

2.  Enter email/phone + password

3.  2FA OTP (optional for admin)

4.  Redirect to Main Dashboard

> Dashboard loads: Active jobs count, Live map (technician dots), Pending requests, Low stock alerts, Today\'s KPIs

**1.2 New Job Creation & Dispatch**

5.  Click \"New Job\" → Job Creation Form

6.  Fill: Client name, Site address, Job type (Install/Maintenance/Survey), Priority, Scope notes

7.  System auto-fetches site GPS → Shows on map

8.  Click \"Find Nearest Technician\"

> → System queries PostGIS for available technicians within 50km
>
> → Ranks by: distance, current workload, skill match
>
> → Shows top 3 suggestions with ETA

9.  Admin reviews suggestions → Click \"Auto-Assign\" or select manually

10. System sends push notification to technician

11. Job status: PENDING → ASSIGNED

12. Admin sees job pin appear on live map

**1.3 Live Job Monitoring**

13. Admin selects job from board or map pin

14. Side panel opens: Job details, Technician info, Live location, Status timeline

15. Real-time updates: Check-in time, OTP verification, Work progress, Check-out

16. On completion: PDF report link available

**1.4 Inventory Management**

17. Navigate to Inventory module

18. View stock dashboard: All items, quantities, reorder levels

19. Receive alert: Item below minimum → Create Purchase Order

20. View usage history: Per job, per technician, per period

**Flow 2: Technician Mobile App Journey**

**2.1 App Setup & Login**

21. Download app from Play Store / App Store

22. Enter registered phone number

23. Receive OTP via SMS → Enter OTP

24. Set 4-digit PIN + optionally enable biometric

25. Location permission grant (REQUIRED --- Always Allow)

26. Home screen: Today\'s jobs, Status toggle (Available/Busy/Off-Duty)

**2.2 Receiving & Accepting a Job**

27. Push notification arrives: \"New Job --- XYZ Bank, Connaught Place\"

28. Open notification → Job Preview screen

> Visible: Client name, Address, Job type, Distance from current location, ETA, Materials to carry

29. Technician taps \"Accept\" (2 min timer) or \"Decline with reason\"

30. On Accept: Job moves to \"My Jobs\" → Navigation starts (Google Maps)

31. On Decline: Job re-assigned to next technician in queue

**2.3 Reaching Site --- Check-in**

32. Arrive at site → App detects proximity (\< 100m radius)

33. Check-in button activates (greyed out if too far)

34. Tap \"Check In\" → GPS timestamp recorded

> If site is HIGH SECURITY (Bank/Airport): OTP flow triggers

35. \[HIGH SECURITY\] App shows: \"Request OTP from Site Manager\"

36. \[HIGH SECURITY\] System sends OTP to site manager\'s phone

37. \[HIGH SECURITY\] Technician enters OTP provided by site manager

38. OTP verified → Work authorization confirmed → Work can begin

**2.4 On-site Work Execution**

39. Start Work → Digital Site Survey Form opens

> Form fields: Number of cameras, Camera types/models, DVR/NVR details, Cable length (meters), Power points, Network points, Special notes

40. Take \"Before\" photos (min 2 required)

41. Mark materials used from inventory list

42. Perform installation/maintenance work

43. Take \"After\" photos (min 2 required)

44. Fill completion notes

**2.5 Job Completion & Check-out**

45. Tap \"Complete Job\"

46. Summary screen: Survey data, Photos, Materials used

47. Client/Site manager signs on screen (signature canvas)

48. Tap \"Check Out\" → GPS timestamp

49. Submit → Report auto-generated in background

50. Job status: IN_PROGRESS → COMPLETED

51. Client receives PDF report via email automatically

**2.6 Offline Mode Flow**

- No internet → App shows offline banner

- All form data, photos stored locally (WatermelonDB)

- On reconnect → Auto-sync: uploads all pending data

- Admin dashboard shows \"Syncing\...\" until complete

**Flow 3: Client Portal Journey**

**3.1 Login & Dashboard**

52. Client opens web portal or mobile app

53. Login with registered email/phone + OTP

54. Dashboard: Active service requests, Completed jobs, Pending compliance sign-offs

**3.2 Raising a Service Request**

55. Click \"New Request\"

56. Select site from registered locations

57. Select request type: New Installation, Maintenance, Fault, Survey

58. Describe issue / requirement

59. Submit → Ticket created → Admin notified

60. Client gets confirmation email with ticket number

**3.3 Tracking Active Job**

61. Select active job → Job tracking screen

62. View real-time technician location on map

63. View status timeline: Assigned → En Route → On Site → Working → Done

64. Chat option with technician (optional module)

**3.4 OTP & Sign-off (Bank/Airport Flow)**

65. Receive OTP SMS when technician arrives on site

66. Provide OTP to technician verbally

67. On job completion: receive notification to sign off

68. Open app → Review work summary + photos

69. Digital sign-off → Confirm completion

70. PDF report auto-sent to registered email

**Flow 4: End-to-End Master Flow**

**Complete workflow from service request to report delivery:**

| **Step** | **Actor**    | **Action**                   | **System Response**                   |
|----------|--------------|------------------------------|---------------------------------------|
| 1        | Client       | Raises service request       | Ticket created, Admin notified        |
| 2        | Admin        | Reviews & creates job        | Job enters dispatch queue             |
| 3        | System       | Auto-assign nearest tech     | Push notification to technician       |
| 4        | Technician   | Accepts job                  | Status → ASSIGNED, navigation starts  |
| 5        | Technician   | Arrives on site, checks in   | GPS timestamp recorded                |
| 6        | System       | OTP sent to site manager     | Authorization pending                 |
| 7        | Site Manager | Provides OTP                 | Work authorized, status → IN_PROGRESS |
| 8        | Technician   | Completes work, fills survey | Data synced to server                 |
| 9        | Client       | Digital sign-off             | Status → COMPLETED                    |
| 10       | System       | Auto-generate PDF report     | Email to client, record saved         |
| 11       | System       | Inventory auto-deducted      | Stock levels updated                  |
| 12       | Admin        | Reviews analytics            | Performance metrics updated           |
