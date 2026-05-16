🎨

**UI/UX DESIGN BRIEF**

**Smart Security Ecosystem --- Design System & Guidelines**

**1. Brand Identity & Design Philosophy**

**1.1 Brand Personality**

Smart Security Ecosystem ka design language \"Professional Trust with Operational Clarity\" pe based hai. Yeh ek B2B security platform hai jo Banks aur Airports jaise high-stakes clients use karenge --- isliye design confident, clean, aur data-forward hona chahiye.

**1.2 Design Principles**

- Clarity First: Field technician jab dusty gloves pehne ho, tab bhi easily use kar sake

- Trust Signals: Enterprise clients ke liye professional, compliance-ready aesthetic

- Speed: Critical workflows (check-in, OTP, emergency) 2-tap tak accessible

- Hierarchy: Most important info (job status, alerts) always visible

- Offline-Aware: UI clearly indicate kare network status without breaking flow

**2. Design System**

**2.1 Color Palette**

| **Color Name** | **HEX**  | **Usage**                      | **Notes**            |
|----------------|----------|--------------------------------|----------------------|
| Primary Navy   | \#1A3C5E | Headers, sidebar, CTA          | Main brand color     |
| Action Blue    | \#0EA5E9 | Buttons, links, highlights     | Interactive elements |
| Success Green  | \#16A34A | Completed, online, approved    | Positive states      |
| Alert Amber    | \#D97706 | Pending, in-progress, warnings | Caution states       |
| Danger Red     | \#DC2626 | Failed, offline, rejected      | Critical alerts      |
| Background     | \#F8FAFC | Page backgrounds               | Very light slate     |
| Surface        | \#FFFFFF | Cards, modals, inputs          | Pure white           |
| Text Primary   | \#111827 | Headlines, body text           | Near black           |
| Text Secondary | \#6B7280 | Subtitles, placeholders        | Cool gray            |

**2.2 Typography**

| **Element**   | **Font**       | **Size / Weight** | **Usage**                            |
|---------------|----------------|-------------------|--------------------------------------|
| H1 Page Title | Inter          | 32px / 700        | Dashboard headers                    |
| H2 Section    | Inter          | 24px / 600        | Card titles, sections                |
| H3 Subsection | Inter          | 18px / 600        | Form labels, sub-headers             |
| Body          | Inter          | 14px / 400        | General content                      |
| Caption       | Inter          | 12px / 400        | Timestamps, metadata                 |
| Code/Data     | JetBrains Mono | 13px / 400        | IDs, technical data                  |
| Mobile H1     | Inter          | 20px / 700        | App screen titles                    |
| Mobile Body   | Inter          | 15px / 400        | App content (larger for readability) |

**3. Admin Web Dashboard --- Screen Specs**

**3.1 Layout Structure**

- Left Sidebar (260px): Logo, Navigation menu, User profile, Collapse button

- Top Bar (64px): Page title, Search, Notifications (bell), Admin avatar

- Content Area: 12-column grid, 24px gutters

- Responsive breakpoints: 1440px (full), 1024px (tablet-ish), 768px (mobile --- basic view)

**3.2 Key Screens**

**Screen 1: Main Dashboard**

Layout: 4 KPI cards top row → Live Map (60% width) + Job Feed sidebar → Bottom charts row

- KPI Cards: Active Jobs, Available Technicians, Pending Requests, Low Stock Alerts

- Live Map: Full-screen Google Maps, colored markers (green=available, amber=on-job, red=offline)

- Job Feed: Scrollable list, each card shows: Job ID, Client, Status badge, Technician, Time

- Map Controls: Filter by status, Toggle heatmap, Refresh button

**Screen 2: Job Detail Panel (Slide-out)**

- Triggered by: clicking job on map or list

- Shows: Job header, Status timeline (stepper), Technician card with live location, Site survey data, Photos, Materials used, Actions (Reassign, Escalate)

**Screen 3: New Job Form**

- 3-step wizard: 1) Client & Site → 2) Job Details → 3) Assignment

- Step 3 shows map with nearest technician suggestions

- Validation: All required fields before step advance

**Screen 4: Inventory Dashboard**

- Table view: Item, Category, In Stock, Min Level, Last Used, Actions

- Color coding: Green \> 50%, Amber 20-50%, Red \< 20% of min level

- Quick actions: Add Stock, Create PO, View Usage History

**4. Technician Mobile App --- Screen Specs**

**4.1 Navigation Structure**

- Bottom Tab Bar: Home \| My Jobs \| Inventory \| Reports \| Profile

- No drawer nav --- field workers ko simple, thumb-friendly navigation chahiye

- Tab bar always visible (except camera/signature screens)

**4.2 Key Screens**

**Screen 1: Home / Status Screen**

- Top: Status toggle (Available/Busy/Off-Duty) --- LARGE toggle, easy to see

- Middle: Today\'s summary card (Jobs done, KMs covered, Hours worked)

- Bottom: Next assigned job card with \"Navigate\" CTA

- Background location indicator (when active)

**Screen 2: Job Detail Screen**

- Full job info: Client, Site address (tap to navigate), Scope, Notes

- Materials to carry: checklist

- Bottom sticky: \"Check In\" button (green, large, activates on proximity)

- Status bar at top shows job phase

**Screen 3: Active Job Workflow (Stepper)**

- Progress: Check-in → OTP → Survey → Photos → Materials → Sign-off → Check-out

- Current step highlighted, completed steps checkmarked

- Each step is a full-screen form with minimal fields

- \"Save Draft\" available if interrupted

**Screen 4: OTP Entry Screen**

- Clean centered screen: \"Enter 6-digit OTP from Site Manager\"

- Large OTP input (6 boxes), auto-advance on fill

- Resend OTP option (visible after 60s)

- Clear error state with retry guidance

**5. Client Portal --- Screen Specs**

**5.1 Design Tone**

Client portal needs to feel premium aur reassuring. Banks aur Hotels expect a professional interface that mirrors their own brand standards. Design: Clean white surfaces, generous whitespace, structured data presentation.

**5.2 Key Screens**

**Screen 1: Client Dashboard**

- Welcome banner with company name

- Active requests: Cards with status badges

- Pending sign-offs: Alert banner (prominent)

- Recent reports: List with download button

**Screen 2: Live Tracking**

- Split view: Map (top 60%) + Status timeline (bottom)

- Technician avatar on map with real-time movement

- ETA card: \"Technician arrives in \~12 minutes\"

- Contact button (call technician)

**Screen 3: Digital Sign-off**

- Work summary with photos (before/after slider)

- Survey data displayed clearly

- Materials used list

- Large signature canvas

- \"Confirm & Submit\" --- prominent green CTA

**6. UX Micro-interactions & States**

| **Element**       | **Micro-interaction**              | **Purpose**                    |
|-------------------|------------------------------------|--------------------------------|
| Check-in button   | Pulse animation when in range      | Draw attention when actionable |
| Job acceptance    | 2-min countdown ring animation     | Create urgency without panic   |
| OTP boxes         | Auto-advance + bounce on complete  | Reduce friction                |
| Status change     | Animated badge color transition    | Confirm action visually        |
| Offline banner    | Slide-in banner (amber)            | Non-blocking status awareness  |
| Photo capture     | Preview before confirm             | Reduce errors                  |
| Signature pad     | Smooth ink trail animation         | Professional feel              |
| Report generation | Progress indicator + success state | Confidence in process          |

**7. Accessibility Guidelines**

- Minimum touch target: 44x44pt on mobile (Apple HIG standard)

- Color contrast ratio: minimum 4.5:1 (WCAG AA)

- Error states: never rely on color alone --- always include icon + text

- Font minimum: 14px body, 12px captions

- Support system font size scaling on mobile

- Hindi language support (i18n-ready architecture)
