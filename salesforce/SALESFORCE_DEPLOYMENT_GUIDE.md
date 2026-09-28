# ☁️ EventForce Management System — Salesforce Developer Guide
> **Implementation Guide for Salesforce Developer Track (SkillWallet / SmartInternz Capstone)**

---

## 📌 Architecture Overview

EventForce incorporates both a **Live Full-Stack Web Application** and a native **Salesforce Platform Cloud Architecture**.

### 1. Data Model (Custom Objects)
| Object API Name | Label | Description |
|---|---|---|
| `Event__c` | Event | Master event entity with venue, date, capacity, status, and fee |
| `Attendee__c` | Attendee | Delegate / student details (name, email, phone, organization) |
| `Event_Registration__c` | Event Registration | Junction record tracking unique ticket serials (`EF-2026-TXXXX`), QR hashes, and gate admission timestamps |
| `Workforce_Shift__c` | Workforce Shift | On-ground crew shifts (AV, stage, check-in, crowd control) linked to an Event |

---

## 🛠️ Included Salesforce Developer Components

### 1. Apex Classes & Controllers
- **`EventForceController.cls`**:
  - `getEvents(categoryFilter, searchTerm)`: Fetch events with dynamic SOQL filtering.
  - `getEventDetails(eventId)`: Retrieves event data with child shifts sub-query.
  - `registerForEvent(eventId, name, email, phone, org)`: Locks event record (`FOR UPDATE`) to prevent overbooking, creates attendee & registration, and generates ticket code.
  - `verifyGateCheckIn(ticketIdentifier)`: Validates admission, records check-in timestamp, and blocks duplicate attempts.
  - `updateShiftStatus(shiftId, newStatus)`: Transitions crew shifts (`Assigned` ➔ `In Progress` ➔ `Completed`).
- **`EventForceControllerTest.cls`**:
  - Comprehensive unit test class achieving 100% test coverage with setup methods.

### 2. Apex Triggers
- **`EventRegistrationTrigger.trigger`**:
  - Auto-assigns ticket codes (`EF-2026-TXXXX`) and QR strings before insert.
  - Validates check-in timestamps and logs verifying user.

### 3. Lightning Web Components (LWC)
- **`eventCatalog`**:
  - Interactive grid displaying event cards with category pills, live search, capacity meters, and booking buttons.
- **`gateCheckInScanner`**:
  - Front-desk gate console to verify tickets and QR codes in real time with visual banners.

---

## 🚀 How to Deploy to Your Salesforce Org

### Option A: Using Salesforce CLI (`sf` / VS Code)
1. Open this `EventForce Management System` folder in Visual Studio Code.
2. Authenticate to your Trailhead Playground / Developer Org:
   ```bash
   sf org login web --set-default
   ```
3. Deploy Apex Classes, Triggers, and LWC:
   ```bash
   sf project deploy start --source-dir salesforce
   ```

### Option B: Using Salesforce Developer Console (Manual)
1. Log into your Salesforce Developer Org (`https://login.salesforce.com`).
2. Go to **Setup** ➔ **Object Manager** ➔ Create Custom Objects (`Event__c`, `Attendee__c`, `Event_Registration__c`, `Workforce_Shift__c`).
3. Click the gear icon ⚙️ ➔ **Developer Console**.
4. Create New Apex Class ➔ Paste code from `salesforce/classes/EventForceController.cls`.
5. Create New Apex Class ➔ Paste code from `salesforce/classes/EventForceControllerTest.cls`.
6. Run Test ➔ Verify 100% code coverage!
7. Create New Trigger ➔ Select `Event_Registration__c` ➔ Paste code from `salesforce/triggers/EventRegistrationTrigger.trigger`.

---

## 🏆 Viva Defense Points for Salesforce Examiners
- **Q: How do you prevent overbooking in concurrent requests?**  
  *A:* We use SOQL `FOR UPDATE` row-locking inside `registerForEvent` so concurrent registration attempts cannot exceed `Capacity__c`.
- **Q: Why separate Attendee and Registration?**  
  *A:* Normalized relational design: one attendee can attend multiple events over time, maintaining single customer history.
- **Q: How does gate scanning prevent fraud?**  
  *A:* `verifyGateCheckIn` updates `Checked_In_Time__c`. Any second scan returns a warning with the exact prior check-in timestamp.
