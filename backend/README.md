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
```

---

## Testing device registration and live location

### 1. Register a device (parent app)

1. Start the backend (`npm run dev` in `backend/`) and frontend (`npm run dev` in `frontend/`).
2. Log in, open the **Devices** tab, enter the child name and timezone, then **Register device**.
3. Copy the returned **Device ID** (UUID). Traccar Client (or any HTTP client) must send this same `device_id` in each location payload.

### 2. Send a test location (recommended for development)

The webhook is **`POST /log/traccar`** (no auth). Example body matches what the backend validates in `src/dto/logDTO.js` (Traccar-style `location` object):

```bash
curl -sS -X POST "http://localhost:3000/log/traccar" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "PASTE-YOUR-UUID-HERE",
    "location": {
      "timestamp": "2026-05-01T12:00:00.000Z",
      "coords": {
        "latitude": 10.77318,
        "longitude": 106.65884,
        "accuracy": 50,
        "speed": 0,
        "heading": 0,
        "altitude": 10
      },
      "odometer": 0,
      "battery": { "level": 0.75, "is_charging": false }
    }
  }'
```

Then open the **Map** tab with that device selected: the pin should move and the meta bar should update. With the parent still logged in, **Socket.io** will push `location_update` events using the JWT cookie.

### 3. Traccar Client app vs this backend

The official **[Traccar Client](https://github.com/traccar/traccar-client)** app is built for the **Traccar Server** protocol (see [traccar.org](https://www.traccar.org/)). It expects you to run a Traccar-compatible server and enter a **Server URL** in the app settings. It does **not** ship a setting to POST arbitrary JSON to a custom path like `/log/traccar`.

So for CLMS you typically:

- **Develop / demo:** use `curl`, Postman, or a small script to `POST /log/traccar` with the JSON shape above; or  
- **Production-style:** run a Traccar Server and add a **forwarder / gateway** that converts Traccar messages into CLMS’s JSON and calls your API; or  
- Use a tracker app or library that can POST the same JSON your `logDTO` accepts.

If you test from a **physical phone**, use your computer’s LAN IP instead of `localhost` (e.g. `http://192.168.1.10:3000/log/traccar`) and ensure the firewall allows inbound connections on the backend port.