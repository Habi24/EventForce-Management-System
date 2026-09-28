# NAAN MUDHALVAN CAPSTONE PROJECT REPORT

---

## PROJECT TITLE:
### **EVENTFORCE MANAGEMENT SYSTEM: AN INTEGRATED EVENT EXECUTION AND WORKFORCE SCHEDULING PLATFORM**

**Academic Initiative:** Tamil Nadu Skill Development Corporation (TNSDC) - Naan Mudhalvan Scheme  
**Track:** Full-Stack Web Development  
**Submission Year:** 2026  

---

## 1. ABSTRACT
Organizing large-scale college symposiums, technical hackathons, cultural fests, and corporate conferences involves two critical operations: participant registration and on-ground crew workforce management. Most existing event management software exclusively targets ticketing, leaving organizers to manage event volunteers, technical operators, stage marshals, and security personnel through scattered spreadsheets and messaging groups.

**EventForce Management System** provides a unified full-stack solution combining attendee ticketing with real-time workforce shift scheduling. The platform enables organizers to publish events, track seating capacity, dispatch on-ground tasks to specific crew members, and monitor live execution. Attendees receive digital admission tickets with automatically generated cryptographic QR passes for quick gate entry. Staff members can access a dedicated workforce portal to track duty timings, update task statuses (`Assigned` ➔ `In Progress` ➔ `Completed`), and conduct duplicate-proof entry check-ins. Built on modern Node.js/Express REST APIs and a responsive Tailwind CSS single-page interface, EventForce delivers high reliability, zero external database setup friction, and complete data persistence.

---

## 2. PROBLEM STATEMENT
Educational institutions and event organizers frequently encounter the following operational bottlenecks:
1. **Disjointed Workforce Coordination:** Task allocations for audio-visual setup, stage management, registration desks, and food logistics are communicated verbally or via chat groups, causing task duplication, missed shifts, and accountability lapses.
2. **Slow Gate Verification:** Physical paper lists or manual spreadsheet lookups create long queues at registration desks during peak entry hours.
3. **Absence of Real-Time Visibility:** Event directors lack a consolidated dashboard showing live registration statistics, attendee arrival rates, and workforce shift completion progress.
4. **Setup Complexity:** Traditional capstone projects often rely on heavy external database engines (like local MySQL or MongoDB daemons) which frequently fail during evaluator demonstrations due to missing services or port conflicts.

---

## 3. PROJECT OBJECTIVES
The core objectives of the EventForce Management System are:
- To design a responsive, intuitive single-page web application catering to three key user roles: **Admin/Organizer**, **Workforce Crew Member**, and **Student Attendee**.
- To implement automated ticket generation with unique serial codes (`EF-2026-TXXXX`) and scannable QR verification matrices.
- To create a workforce shift allocation module allowing event directors to assign tasks by role, location, time window, and priority.
- To develop an entry desk scanner tool capable of validating tickets in real time, preventing duplicate admissions, and tracking check-in timestamps.
- To provide an interactive analytics command center with Chart.js visualizations (category distributions, shift completion rates) and CSV report generation.
- To ensure zero-friction deployment through a persistent file-backed JSON database engine with built-in realistic seed datasets.

---

## 4. SYSTEM SPECIFICATIONS

### 4.1 Software Requirements
- **Operating System:** Windows 10/11, macOS, or Linux
- **Runtime Environment:** Node.js v16.0.0 or higher
- **Web Server:** Express.js v4.21+
- **Security:** JSON Web Tokens (JWT), BCrypt Password Hashing
- **Frontend Technologies:** HTML5, CSS3, Tailwind CSS (CDN), ES6+ JavaScript
- **Libraries:** QRCode.js, Chart.js, Canvas-Confetti, FontAwesome 6
- **Web Browser:** Google Chrome, Microsoft Edge, Mozilla Firefox

### 4.2 Hardware Requirements
- **Processor:** Dual Core Intel/AMD 2.0 GHz or higher (ARM/Apple Silicon supported)
- **RAM:** Minimum 2 GB (4 GB recommended)
- **Hard Disk Storage:** 200 MB free disk space
- **Display Resolution:** 1024 x 768 or higher (Responsive across mobile, tablet, and desktop)

---

## 5. SYSTEM ARCHITECTURE

The application follows a clean 3-Tier Layered Architecture:

```
+-------------------------------------------------------------------+
|                       PRESENTATION TIER (UI)                      |
|  - Events Showcase & Filter     - Digital Ticket Pass (QR Code)   |
|  - Crew Duty Shifts & Kanban    - Organizer Command Center        |
|  - Real-Time Gate Check-In Desk - Interactive Chart.js Visuals    |
+---------------------------------+---------------------------------+
                                  | HTTP / RESTful API (JSON & JWT)
                                  v
+-------------------------------------------------------------------+
|                       APPLICATION TIER (API)                      |
|  Express.js Server (server.js)                                    |
|  +-- Auth Middleware (JWT Verification & Role-Based Access Control)|
|  +-- Auth Controller (/api/auth)                                  |
|  +-- Event Controller (/api/events)                               |
|  +-- Registration & QR Controller (/api/registrations)            |
|  +-- Workforce & Crew Controller (/api/workforce)                 |
|  +-- Analytics & CSV Export Controller (/api/analytics)           |
+---------------------------------+---------------------------------+
                                  | Synchronous / Safe File I/O
                                  v
+-------------------------------------------------------------------+
|                        DATA TIER (STORAGE)                        |
|  Persistent JSON Database Engine (src/config/db.js)               |
|  +-- Users Collection (Admin, Staff, Attendee profiles)          |
|  +-- Events Collection (Schedules, venues, occupancy limits)      |
|  +-- Workforce Tasks Collection (Shifts, priorities, assignments) |
|  +-- Registrations Collection (Tickets, QR strings, check-ins)    |
+-------------------------------------------------------------------+
```

---

## 6. DATABASE SCHEMA DESIGN

### 6.1 Users Entity
| Field | Type | Description |
|---|---|---|
| `id` | String (Primary Key) | Unique identifier (`usr-XXXX`) |
| `name` | String | Full name of user |
| `email` | String (Unique) | Login email address |
| `password` | String | Salted BCrypt hash |
| `role` | String | `'admin'` \| `'staff'` \| `'attendee'` |
| `phone` | String | Contact telephone number |
| `department` | String | Academic department or committee |
| `specialization`| String | Specific operational skill set |
| `avatar` | String | User avatar URI |

### 6.2 Events Entity
| Field | Type | Description |
|---|---|---|
| `id` | String (Primary Key) | Unique event identifier (`evt-XXXX`) |
| `title` | String | Title of event |
| `category` | String | Technical, Conference, Cultural, Sports, Workshop |
| `description` | String | Detailed agenda and eligibility |
| `date` | String | Event date (YYYY-MM-DD) |
| `time` | String | Time duration |
| `venue` | String | Hall or auditorium location |
| `capacity` | Integer | Total seat limit |
| `registeredCount`| Integer | Total registered participants |
| `ticketPrice` | Float | Admission fee (0 for Free Entry) |
| `status` | String | `'Upcoming'` \| `'Ongoing'` \| `'Completed'` |

### 6.3 Workforce Tasks Entity
| Field | Type | Description |
|---|---|---|
| `id` | String (Primary Key) | Unique task identifier (`task-XXXX`) |
| `eventId` | String (Foreign Key) | Reference to target event |
| `eventTitle` | String | Denormalized event name |
| `title` | String | Shift duty title |
| `description` | String | Specific operational instructions |
| `roleRequired` | String | Operational role (e.g., AV Lead, Gate Marshal) |
| `assignedToUserId`| String (Foreign Key) | Assigned staff member ID |
| `assignedToName`| String | Name of assigned crew member |
| `shiftStart` | String | Duty start time |
| `shiftEnd` | String | Duty end time |
| `status` | String | `'Assigned'` \| `'In Progress'` \| `'Completed'` |
| `priority` | String | `'High'` \| `'Medium'` \| `'Low'` |
| `location` | String | Specific booth, hall, or desk |

### 6.4 Registrations Entity
| Field | Type | Description |
|---|---|---|
| `id` | String (Primary Key) | Unique record ID (`reg-XXXX`) |
| `ticketNumber`| String (Unique) | Formatted ticket number (`EF-2026-TXXXX`) |
| `eventId` | String (Foreign Key) | Reference to event |
| `eventTitle` | String | Title of event |
| `userId` | String (Foreign Key) | Registered attendee ID |
| `attendeeName`| String | Full name of ticket holder |
| `attendeeEmail`| String | Contact email |
| `college` | String | College / Institution |
| `amountPaid` | Float | Registration fee paid |
| `status` | String | `'Confirmed'` \| `'Checked In'` \| `'Cancelled'` |
| `qrData` | String | QR verification payload |
| `registeredAt`| String (ISO Date) | Booking timestamp |
| `checkedInAt` | String (ISO Date) | Gate admission timestamp |

---

## 7. MODULE DESCRIPTIONS

### 7.1 Authentication & Role-Based Access Control (RBAC)
- Provides secure user signup, login, and profile retrieval.
- Utilizes BCrypt for irreversible password hashing with salt rounds.
- Generates JSON Web Tokens (JWT) stored in client `localStorage` and sent via `Authorization: Bearer <token>` headers.
- Enforces role protection using the `requireRole('admin')` and `requireRole('staff')` Express middleware.

### 7.2 Event Catalog & Discovery Module
- Allows attendees to browse events filtered by category (*Technical, Conference, Cultural, Sports, Workshop*) or dynamic keyword search.
- Displays visual occupancy meters (`registeredCount / capacity`) with color-coded badges (*Normal, High Demand, Housefull*).
- Provides an Event Detail view showcasing venue location, time, and assigned workforce crew members.

### 7.3 Ticket Pass & QR Generation Module
- Upon successful ticket booking, an algorithmic ticket ID (`EF-2026-TXXXX`) and QR verification string are generated.
- The frontend dynamically compiles an SVG/Canvas QR code using `QRCode.js`.
- Features an e-Pass layout complete with notch cutouts, barcode metrics, and a dedicated `@media print` style sheet for printing physical admission cards.

### 7.4 Workforce Shift Management Module
- Enables organizers to break an event down into operational shifts (Registration Desk, Audio-Visual, Catering, Crowd Management).
- Dispatches tasks to specific staff profiles with shift hours and priority tags.
- Provides crew members with interactive controls to transition duties from `Assigned` to `In Progress` and `Completed`.

### 7.5 Real-Time Gate Entry Check-In Desk
- Gate marshals can scan or manually enter the attendee's ticket number or QR string.
- The server checks against registered records:
  - If valid and unverified: Updates status to `Checked In`, records timestamp, and welcomes attendee.
  - If already verified: Raises an alert indicating the exact time the pass was previously checked in, thwarting pass-sharing fraud.
  - If invalid: Rejects entry with an error banner.

### 7.6 Analytics Command Center & CSV Export
- Displays real-time operational KPIs: Total Events, Registrations, Gate Check-In Rate, and Staff Count.
- Renders Chart.js visuals for category proportions and shift completion statuses.
- Generates and streams standard CSV files of the entire attendee registry for external archiving and post-event analysis.

---

## 8. TEST CASES & VERIFICATION

| Test Case ID | Test Scenario | Input Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| **TC-01** | User Authentication | Valid Email & Password | 200 OK, JWT Token returned, role saved | As expected | **PASS** |
| **TC-02** | Invalid Login Attempt | Incorrect password | 401 Unauthorized, descriptive error message | As expected | **PASS** |
| **TC-03** | Event Filtering | Filter by "Technical" | Only technical events displayed | As expected | **PASS** |
| **TC-04** | Ticket Booking | Valid event ID & attendee data | Unique ticket number & QR data created | As expected | **PASS** |
| **TC-05** | Duplicate Booking | Same user re-registers for event | 400 Bad Request, already registered alert | As expected | **PASS** |
| **TC-06** | Gate Check-In | Valid Ticket ID | Status updated to "Checked In" with timestamp | As expected | **PASS** |
| **TC-07** | Duplicate Check-In | Scan previously verified ticket | 400 Bad Request, duplicate warning returned | As expected | **PASS** |
| **TC-08** | Task Progression | Staff moves task to "In Progress" | Status saved to database, reflected on UI | As expected | **PASS** |
| **TC-09** | Unauthorized Access | Attendee attempts to create event | 403 Forbidden: Admin role required | As expected | **PASS** |
| **TC-10** | CSV Export | Admin clicks "Export CSV" | File `eventforce-attendees-report.csv` downloaded | As expected | **PASS** |

---

## 9. VIVA-VOCE / REVIEW DEFENSE PREPARATION GUIDE
*(Common questions asked by evaluators and examiners with authoritative answers)*

**Q1: What makes EventForce different from Eventbrite or BookMyShow?**  
*Answer:* Commercial ticketing platforms focus exclusively on the buyer experience (selling tickets). EventForce is an enterprise operations tool that links participant ticketing with on-ground crew workforce management, allowing organizers to schedule staff shifts, track execution in real time, and conduct gate entry verification within a single system.

**Q2: How does the ticket verification with QR code work?**  
*Answer:* When a ticket is reserved, the backend generates an alphanumeric token (`EF-2026-TXXXX`) and an encoded payload containing the ticket number, event ID, and user ID. The client renders this as a high-density QR code using `QRCode.js`. At the venue, gate staff enter or scan this code; the backend checks the record and marks `checkedInAt: Date.now()`. Any subsequent attempt is flagged as a duplicate.

**Q3: How is data stored and preserved?**  
*Answer:* The backend uses a persistent file-backed JSON database engine (`src/config/db.js`) equipped with atomic read-write operations. Unlike in-memory arrays which lose data when the server restarts, all modifications (new events, registrations, shift updates) are persisted to disk in `data/eventforce.db.json`.

**Q4: How does the system handle security and role segregation?**  
*Answer:* Passwords are protected using salted BCrypt hashing. When users authenticate, the server issues a signed JSON Web Token (JWT). Protected routes employ Express middleware (`verifyToken` and `requireRole`) to restrict administrative operations (such as event creation and staff assignment) exclusively to authorized roles.

**Q5: Can this system scale to handle thousands of concurrent users?**  
*Answer:* Yes. Because the architecture adheres strictly to REST principles with stateless JWT authentication, the backend can easily be deployed across containerized clusters (e.g., Docker, Kubernetes, AWS ECS) behind a load balancer, with data switched to PostgreSQL or MongoDB with zero changes to frontend client code.

---

## 10. CONCLUSION & FUTURE SCOPE
The **EventForce Management System** successfully addresses the practical challenges of coordinating campus and corporate events. By combining attendee ticketing with on-ground workforce shift scheduling, it establishes a reliable, paperless operational environment.

### Future Enhancements:
- **Webcam/Mobile Camera QR Scanner:** Direct integration of the HTML5 WebRTC camera API for live barcode scanning without handheld scanners.
- **SMS & WhatsApp Gate Pass Delivery:** Integration with Twilio or WhatsApp Business API to deliver ticket passes directly to attendee phones.
- **Geofenced Crew Attendance:** GPS location verification ensuring staff members are physically within the venue perimeter before checking in to shifts.
- **Push Notifications:** Instant web socket notifications alerting crew members of schedule changes or urgent venue tasks.

---
*Report prepared for submission under the Naan Mudhalvan Capstone Evaluation Committee.*
