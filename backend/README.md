# Child Location Monitoring System (CLMS) - Backend

The CLMS backend is a robust Node.js API designed to give parents peace of mind by continuously monitoring their child’s location and device health. It combines IoT communication, backend processing, and real-time web-based visualization.

---

## 🏗️ System Architecture

This backend follows a strict Model-View-Controller (MVC) pattern, extended with Infrastructure Services to handle cross-cutting concerns:
* **Webhooks:** Ingests real-time GPS, battery, and signal data from the Arduino IoT Cloud without polling.
* **WebSockets:** Pushes instant geofence violation alerts to the parent's web dashboard.
* **PostgreSQL:** Stores user data, location history, and safe zone configurations securely.

---

## 📂 Project Structure

```text
clms-backend/
├── src/
│   ├── controllers/       # Orchestrates business logic (Webhook, Location, Alerts)
│   ├── models/            # Database entities (User, Device, SafeZone)
│   ├── services/          # Infrastructure (WSManager, DBAdapter, MailAdapter)
│   ├── routes/            # Express API routes
│   └── app.js             # Express application setup
├── .env                   # Environment variables (Ignored by Git)
├── .gitignore             # Git ignore rules
├── package.json           # Project dependencies and scripts
└── server.js              # Application entry point

## 🚀 Quick Start & Setup

Follow these exact steps to get the backend server running on your local machine.

### 1. Initialize the Project
If you are pulling this down for the first time, navigate to the folder and install all the required Node modules (Express, Socket.io, Postgres, etc.):

```bash
cd backend
npm init -y 
npm install --save-dev nodemon
npm install express cors pg dotenv socket.io