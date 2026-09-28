# ⚡ EventForce Management System
> **Enterprise Event Operations & Real-Time Workforce Orchestration Platform**  
> *Full-Stack Web Application & Native Salesforce Developer Cloud Architecture*

---

## 📌 Project Overview
**EventForce** bridges the gap between grand event planning, attendee ticketing, and on-ground crew workforce management. Traditional event platforms only sell tickets; EventForce combines **attendee ticket reservations with cryptographic QR code validation**, **keynote speaker showcases**, **multi-track session agendas**, and **real-time workforce shift dispatch**.

---

## 🌟 Key Features

### 1. 🎓 Attendee Experience & Discovery
- **High-Definition Event Showcase**: Browse events across *Conference*, *Technical*, *Cultural*, *Sports*, and *Workshop* categories with live keyword search and category filters.
- **Featured Keynote Speakers**: Discover distinguished speakers with photos, designations, company affiliations, and keynote topics.
- **Multi-Track Sessions & Agenda**: View conference timelines with speaker names and breakout room details.
- **Corporate Sponsors & Partners**: Showcase event sponsors (Platinum, Gold, Silver) with brand logos.
- **Seat Capacity Meters**: Dynamic occupancy bars with real-time remaining seat counts.
- **Instant E-Ticket Pass**: Reserve admission passes with attendee details.
- **Dynamic QR Code Ticket Pass**: Generates a verifiable digital pass with unique ticket numbers (`EF-2026-TXXXX`) and scannable QR code.
- **Print / Save Pass**: Built-in CSS print styling for physical gate verification.
- **Attendee Reviews & Star Ratings**: Post-event feedback collection with star ratings and attendee testimonials.

### 2. 👷 Workforce & Crew Portal
- **Shift & Duty Roster**: On-ground crew members (Audio-Visual coordinators, registration leads, crowd marshals) can view assigned shifts.
- **Interactive Shift Status**: Update duty state directly between `Assigned` ➔ `In Progress` ➔ `Completed`.
- **Front-Desk Ticket Scanner**: Gate marshals can enter or scan attendee ticket codes for instant check-in verification with duplicate prevention.
- **Staff Directory**: View active duty loads and contact information for on-site crew coordination.

### 3. 👑 Organizer & Director Admin Command Center
- **Executive Analytics**: KPI counters for Total Events, Bookings, Gate Check-In Rate (%), and Active Staff.
- **Visual Insights**:
  - *Doughnut Chart*: Event distribution across categories.
  - *Bar Chart*: Workforce shift completion progress.
- **Event Portfolio Management**: Create, edit, and delete events with custom venue, dates, capacity, pricing, and banners.
- **Shift Dispatcher**: Allocate staff members to specific tasks, time windows, and priority tiers (`High`, `Medium`, `Low`).
- **CSV Data Export**: One-click download of the complete attendee registration roster for audit and attendance records.

### 4. ⚡ Quick Demo Persona Switcher (Viva & Evaluation Friendly)
- One-click switches in the navigation bar allow examiners and evaluators to instantly jump between:
  - **👑 Event Director / Admin** (`admin@eventforce.com` / `admin123`)
  - **👷 Crew Staff** (`staff1@eventforce.com` / `staff123`)
  - **🎓 Attendee** (`attendee@eventforce.com` / `user123`)

### 5. ☁️ Native Salesforce Developer Package Included
For students and developers enrolled in the **Salesforce Developer track (SkillWallet / SmartInternz)**, full Salesforce platform metadata is provided in the `salesforce/` directory:
- **Custom Objects Schema**: `Event__c`, `Attendee__c`, `Event_Registration__c`, `Workforce_Shift__c`
- **Apex Controller**: `EventForceController.cls` (with `@AuraEnabled` methods)
- **Apex Test Suite**: `EventForceControllerTest.cls` (100% test coverage)
- **Apex Trigger**: `EventRegistrationTrigger.trigger`
- **Lightning Web Components (LWC)**:
  - `eventCatalog` (Searchable event card grid)
  - `gateCheckInScanner` (Entry desk ticket and QR verification)
- **Deployment Guide**: `salesforce/SALESFORCE_DEPLOYMENT_GUIDE.md`

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3, Tailwind CSS (CDN), Vanilla JavaScript (ES6+), FontAwesome 6 |
| **Data Visualization & QR** | Chart.js, QRCode.js, Canvas-Confetti |
| **Backend** | Node.js, Express.js RESTful API Architecture |
| **Authentication** | JSON Web Tokens (JWT), BCrypt Password Hashing, RBAC Middleware |
| **Database** | Persistent File-Backed JSON Store with zero external database configuration requirements |
| **Salesforce Platform** | Apex Controllers, Triggers, Custom Objects, Lightning Web Components (LWC) |

---

## 🚀 Getting Started (How to Run)

### Prerequisites
- Node.js (v16.0 or higher recommended)
- Web Browser (Chrome, Edge, Firefox)

### Installation & Launch

1. **Clone or open the project folder:**
   ```bash
   cd "EventForce Management System"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

4. **Access the portal:**
   Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

---

## 🔑 Default Credentials

| Persona | Email | Password | Role Description |
|---|---|---|---|
| **Event Director / Admin** | `admin@eventforce.com` | `admin123` | Full access to create events, dispatch workforce, view metrics & export reports |
| **AV Tech Specialist** | `staff1@eventforce.com` | `staff123` | View assigned AV duties, update shift status, check-in attendees |
| **Registration Supervisor** | `staff2@eventforce.com` | `staff123` | Desk check-ins, guest relations |
| **Attendee / Delegate (Sree)** | `attendee@eventforce.com` | `user123` | Browse events, reserve passes, view digital ticket with QR code |

*(Or click any of the persona buttons directly on the top announcement bar!)*

---

## 📁 Project Directory Structure

```
EventForce Management System/
├── package.json                   # Project manifest & dependencies
├── server.js                      # Main Express server and static routing
├── src/
│   ├── config/
│   │   └── db.js                  # Persistent database engine with auto-seeding
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT verification & RBAC authorization
│   └── routes/
│       ├── authRoutes.js          # Authentication & user profile endpoints
│       ├── eventRoutes.js         # Event CRUD, search, speakers, & feedback
│       ├── registrationRoutes.js  # Ticket booking & QR check-in endpoints
│       ├── workforceRoutes.js     # Staff shifts & crew task allocation
│       └── analyticsRoutes.js     # KPI metrics & CSV export endpoints
├── public/
│   ├── index.html                 # Responsive Single Page Application (SPA)
│   ├── css/
│   │   └── style.css              # Glassmorphic UI & printable ticket pass styling
│   └── js/
│       ├── api.js                 # Centralized frontend API client
│       └── app.js                 # UI controllers, chart rendering & modals
├── salesforce/                    # Salesforce Developer Track Components
│   ├── classes/
│   │   ├── EventForceController.cls     # Apex Controller for LWC
│   │   └── EventForceControllerTest.cls # Apex Unit Test (100% Coverage)
│   ├── triggers/
│   │   └── EventRegistrationTrigger.trigger # Capacity & auto-ticket trigger
│   ├── lwc/
│   │   ├── eventCatalog/                # LWC Event Catalog Component
│   │   └── gateCheckInScanner/          # LWC Gate Scanner Component
│   └── SALESFORCE_DEPLOYMENT_GUIDE.md   # Deployment instructions
├── data/
│   └── eventforce.db.json         # Persistent JSON database (auto-created on start)
└── README.md                      # Quickstart documentation
```
