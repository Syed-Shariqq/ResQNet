# ResQNet: Resilient Disaster Coordination System

## 🧠 1. PROBLEM STATEMENT

During major natural disasters (earthquakes, hurricanes, floods), cellular networks and internet infrastructure are often the first to fail. When centralized communication goes down, standard emergency response systems become utterly useless. 

This creates a **coordination gap**:
- Citizens cannot report their locations or emergency types.
- Responders have no centralized map or dashboard to triage incidents.
- Critical requests are lost in the void of offline devices.

Existing systems fail because they are "internet-first" or "internet-only." ResQNet is built to solve this exact gap by ensuring that **emergency requests always find a path**, even when standard connectivity drops.

---

## 🚀 2. SOLUTION OVERVIEW

ResQNet is an **offline-first, multi-channel emergency response platform** designed to maintain coordination between citizens and emergency responders during infrastructure collapse. 

The core philosophy of the system is absolute resilience. If a user loses internet, the system seamlessly downgrades to compressed SMS. If SMS fails, it drops into a localized offline queue (simulating mesh/relay networks) and aggressively syncs the moment any connection is restored. 

Through a centralized command dashboard, responders see a unified, real-time map of all distress signals—regardless of how those signals reached the server.

---

## 🏗️ 3. SYSTEM ARCHITECTURE

The architecture relies on a highly decoupled frontend and backend to support aggressive offline caching and synchronization.

```text
[Citizen Device] <---------------------------------> [Responder Dashboard]
       |                                                    |
       v                                                    v
[Resilience Engine] <---(Sync & Network State)---> [Command Center Map]
       |                                                    |
   (Internet / SMS / Relay Queue)                           |
       |                                                    |
       v                                                    v
[Spring Boot REST API] <---(Nominatim/OSM)---> [Location Geocoding]
       |
       v
[Database Storage]
```

- **Frontend:** Handles network state detection, request queueing, and triage routing via a custom resilience engine.
- **Backend:** A robust Spring Boot service managing the unified state of all incidents and assignments.
- **Map Services:** Integrates OpenStreetMap (Nominatim) for resolving addresses to exact coordinates and rendering tactical map views.
- **Data Storage:** A single source of truth for request states (pending, assigned, resolved).

---

## 🔁 4. DATA FLOW

Data in ResQNet flows through a resilient pipeline designed to never drop a request:

1. **User Submits Request:** A citizen fills out the triage form with their emergency details.
2. **Location is Resolved:** The system queries OpenStreetMap/Nominatim via an autocomplete interface to resolve the text address into precise latitude/longitude coordinates.
3. **Request is Routed:** The `ResilienceEngine` detects network state:
   - *Online:* Routed instantly via internet.
   - *Degraded:* Compressed and routed via SMS payload.
   - *Offline:* Pushed to the local `localStorage` queue (simulating a relay).
4. **Request Stored in Backend:** The API accepts the request and normalizes the channel source.
5. **Dashboard Updates:** The command center fetches the latest payload, mapping the new pin on the Leaflet-powered map.
6. **Responder Assigns:** A dispatcher clicks the request and assigns it to a unit.
7. **Request Resolved:** The unit completes the operation and marks the request as resolved.

---

## 📡 5. RESILIENCE SYSTEM

The resilience engine (`resilienceEngine.js` and `syncEngine.js`) is the heart of ResQNet. It ensures no request is lost through a three-tier fallback mechanism:

- **Offline-First Queue:** Every failed request is immediately captured in a local queue. The application continues to function normally for the user, preventing data loss.
- **Degraded Fallback (SMS):** When full internet is unavailable but basic cellular service exists, the triage engine compresses the payload into a minimal string for transmission.
- **Aggressive Sync Engine:** A background interval constantly polls `navigator.onLine`. The millisecond connectivity is restored, the `SyncEngine` bulk-pushes the offline queue to the `/api/requests/sync` endpoint, automatically clearing the local cache upon success.

---

## 🗺️ 6. LOCATION SYSTEM

Precise geospatial data is critical for rescue operations.

- **OpenStreetMap & Nominatim:** ResQNet uses the free Nominatim API to power a dynamic location autocomplete field. 
- **Autocomplete Logic:** As the user types, requests are debounced and matched against Nominatim's database. Results are parsed and displayed with highlight matching (`LocationAutocomplete.jsx`).
- **Coordinate Storage:** Once selected, the exact `lat` and `lng` are extracted, attached to the payload, and cached locally so that map rendering never blocks on API calls during poor connectivity.
- **Map Visualization:** The responder dashboard uses Leaflet to plot these coordinates. Pins are color-coded based on the triage severity computed on the client.

---

## ⚙️ 7. TECH STACK

**Frontend:**
- **React 18** (UI Components & State)
- **Vite** (Build Tooling)
- **Vanilla CSS / CSS Variables** (with Tailwind-inspired utility structures)
- **Leaflet** (Map Rendering)

**Backend:**
- **Java / Spring Boot** (RESTful API, Core Logic)
- **Maven** (Dependency Management)

**External APIs:**
- **OpenStreetMap / Nominatim API** (Geocoding and Reverse Geocoding)

---

## 🔌 8. API ENDPOINTS

The Spring Boot backend exposes a clean RESTful interface:

- `POST /api/requests`
  Creates a single emergency request. Accepts full payloads (internet) or compressed payloads (SMS fallback).
- `GET /api/requests`
  Fetches all system requests for the responder dashboard.
- `PUT /api/requests/{id}/assign`
  Updates a request's status to "assigned" and links a specific responder to the task.
- `PUT /api/requests/{id}/resolve`
  Closes out the emergency, updating its status to "resolved" and clearing it from the active map.
- `POST /api/requests/sync`
  Accepts a bulk array of queued offline requests. Processes them transactionally to merge offline data back into the main cluster.

---

## 🧩 9. KEY FEATURES

- **Multi-Channel Routing:** Graceful degradation from Internet -> SMS -> Local Queue.
- **Offline-First Design:** Never blocks user input due to bad network.
- **Real-Time Dashboard:** Unified map interface for dispatchers.
- **Map-Based Visualization:** Instant geospatial context via OpenStreetMap.
- **Request Lifecycle Tracking:** Full state machine (Pending -> Assigned -> Resolved).

---

## 🎬 10. DEMO FLOW

To properly demonstrate the power of ResQNet, follow this sequence:

1. **Standard Submission:** Open the app while online, submit a request, and watch it appear instantly on the Responder Map.
2. **Offline Mode:** Toggle the browser network to "Offline" (or use the built-in network simulator). Submit a new request. Note the "Relay Queued" status. 
3. **Dashboard Verification:** Show that the offline request is *not* yet on the responder map.
4. **The Sync:** Toggle the network back to "Online". Wait ~10 seconds. The sync engine will automatically push the queue, and the map will populate.
5. **Resolution:** From the dashboard, click the newly synced pin, assign a responder, and resolve the incident.

---

## ⚠️ 11. LIMITATIONS

- **Simulated Channels:** The SMS and Relay fallbacks are currently simulated via local state and mocked endpoints.
- **Non-Production Infra:** Relies on local storage instead of a hardened client-side database (like IndexedDB or SQLite) for offline queueing.
- **Rate Limits:** Nominatim's public API is rate-limited; a production deployment requires a dedicated geocoding server.

---

## 🔮 12. FUTURE IMPROVEMENTS

- **Real SMS Integration:** Connect the degraded channel to a physical Twilio/Nexmo gateway.
- **Mesh Networking:** Implement Bluetooth Low Energy (BLE) or Wi-Fi Direct to actually bounce offline payloads between physical devices.
- **AI Prioritization:** Implement an LLM-based triage system to automatically score and rank incoming requests based on description severity when human dispatchers are overwhelmed.
