# OrderCore: OS-Driven Scheduling and DBMS-Backed Resource Management for Food Delivery

**OrderCore** is a comprehensive full-stack engineering PBL system that maps fundamental **Operating System (OS)** principles and **Database Management System (DBMS)** architectures to an on-demand food delivery platform.

Rather than handling order processing as arbitrary web requests, OrderCore rigorously models incoming customer orders as **processes**, kitchen preparation as **CPU execution**, and delivery couriers as **finite synchronized system resources**.

---

## 📌 Operating System & DBMS Mapping

| Operating System Concept | Food Delivery Counterpart | OrderCore Technical Implementation |
| :--- | :--- | :--- |
| **Processes** | Customer Food Orders | Each order has an Arrival Time, Prep/Burst Time, Priority (Standard vs. VIP Express), and State transitions (`Waiting`, `Preparing`, `Ready`, `Out for Delivery`, `Delivered`). |
| **CPU / Execution Unit** | Kitchen Prep Slot | Orders are scheduled and dispatched into kitchen cooking slots based on CPU scheduling algorithms. |
| **CPU Scheduling Algorithms** | Kitchen Order Sequencing | Native C++ engines implementing **FCFS** (First-Come, First-Served), **SJF** (Shortest Job First), and **Priority Scheduling** to calculate and minimize Average Waiting Time and Turnaround Time. |
| **Algorithm Benchmarking** | CPU Performance Comparison | Automated side-by-side comparative analysis running all 3 algorithms via C++ spawn sub-processes, displaying the provably optimal schedule. |
| **Shared Resources** | Delivery Agents / Riders | Finite resource pool managed with mutual exclusion (`std::mutex`) and RAII `std::lock_guard`. |
| **Concurrency & Synchronization** | Race condition prevention | Thread-safe agent dispatching, MySQL row-level locking (`SELECT ... FOR UPDATE`), and ACID transactions in Express. |
| **Deadlock Detection & Recovery** | Kitchen Slot & Rider circular wait | Banker's / Resource Allocation Graph (RAG) reduction algorithm in C++ ([`deadlock.cpp`](file:///Users/tusharthapliyal/Desktop/OrderCore-OS-Driven-Scheduling-and-DBMS-Backed-Resource-Management-for-Food-Delivery/deadlock/deadlock.cpp)) with preemption-based resolution. |
| **Relational DBMS** | Normalized Storage & Analytics | MySQL schema with 8 normalized tables, foreign keys, cascading constraints, and parameterized SQL queries. |

---

## 🏗️ System Architecture

OrderCore consists of four interconnected architectural layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Frontend Dashboards                           │
│   🛍️ Customer Portal  │  🍳 Restaurant Desk  │  🛵 Rider App  │  📊 Admin  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST & JWT Authentication
┌───────────────────────────────────▼────────────────────────────────────┐
│                       Node.js / Express Backend                        │
│   • Role-Based Access Control (Admin, Restaurant, Agent, Customer)     │
│   • Strict Order Lifecycle State Machine Engine                        │
│   • Asynchronous IPC child-process bridge to native C++ OS binaries    │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
┌───────────────────▼────────────────┐   ┌───────────▼───────────────────┐
│        MySQL Database              │   │         C++ OS Engines        │
│ • Normalized 8-table schema        │   │ • FCFS, SJF, Priority         │
│ • Transactional ACID boundaries    │   │ • Resource Manager (Mutex)    │
│ • User credentials & RBAC statuses │   │ • Deadlock Detection/Recovery │
└────────────────────────────────────┘   └───────────────────────────────┘
```

---

## 🚀 Key Features

### 1. OS CPU Scheduling Simulator & Visual Comparison
- Implemented in C++ (`scheduler/`):
  - **FCFS (First-Come, First-Served)**: Orders processed in order of arrival.
  - **SJF (Shortest Job First)**: Non-preemptive scheduling prioritizing shorter prep times, provably minimizing average waiting time.
  - **Priority Scheduling**: VIP Express orders (Priority 1) pre-empt standard orders (Priority 2/3).
- Real-time calculation of **Completion Time**, **Turnaround Time ($TAT = CT - AT$)**, and **Waiting Time ($WT = TAT - BT$)**.
- Interactive **Side-by-Side Algorithm Comparison** showing performance metrics and execution sequences directly on the Admin Dashboard.

### 2. Interactive Deadlock Detection & Preemption Recovery
- Simulates real-world circular wait conditions:
  - **Process P0 (Order 1)** holds **Kitchen Slot (R0)** while requesting **Delivery Agent (R1)**.
  - **Process P1 (Order 2)** holds **Delivery Agent (R1)** while requesting **Kitchen Slot (R0)**.
- Runs C++ matrix reduction algorithm (`deadlock/deadlock_runner`) to detect circular wait conditions.
- Demonstrates **Deadlock Recovery via Preemption**: releases courier resources and enforces canonical acquisition order so all processes execute safely without system freeze.

### 3. Role-Based Access Control (RBAC) & Approvals Workflow
- Built-in multi-role authentication (JWT + bcrypt).
- **Customers**: Only see and track their own orders. Cannot modify restaurant or courier states.
- **Restaurants**: Only access orders from their assigned kitchen outlet. Can transition orders from `Waiting` $\to$ `Preparing` $\to$ `Ready`.
- **Delivery Agents**: Only access orders assigned to their rider profile. Complete deliveries and release agent status back to `Available`.
- **Administrators**: Verify, approve, or reject new restaurant and delivery agent applicants before operational access is granted.

---

## 📁 Repository Structure

```
.
├── Makefile                     # Top-level C++ build automation
├── README.md                    # Project documentation & evaluation guide
├── backend/                     # Node.js Express server & REST API
│   ├── .env                     # Environment variables (DB credentials, JWT_SECRET)
│   ├── .env.example             # Configuration template with placeholders
│   ├── db/
│   │   └── connection.js        # MySQL connection pool
│   ├── seed.js                  # 1-command database schema and data seeder
│   ├── package.json             # Backend dependencies
│   └── server.js                # Core REST API server
├── database/                    # Database definitions & analytics
│   ├── schema.sql               # Normalized 8-table MySQL schema
│   ├── sample_data.sql          # Seed dataset with pre-hashed accounts
│   └── queries.sql              # Analytical OS & DBMS queries
├── deadlock/                    # C++ Deadlock detection module
│   ├── deadlock.h               # Header with detection signatures
│   ├── deadlock.cpp             # Banker's reduction detection algorithm
│   └── deadlock_runner.cpp      # CLI & JSON runner for backend integration
├── frontend/                    # Responsive web portals
│   ├── index.html               # Main workspace selector & landing page
│   ├── customer.html            # Customer ordering & tracking portal
│   ├── restaurant.html          # Kitchen dashboard & algorithmic dispatch
│   ├── agent.html               # Delivery agent fulfillment dashboard
│   ├── delivery.html            # Delivery agent route manifest
│   └── admin.html               # Admin dashboard (Scheduling, Deadlock, Approvals)
├── resource_management/         # C++ thread-safe agent management
│   ├── agent.h / agent.cpp      # Agent struct & methods
│   ├── resource_manager.h / cpp # Mutex-guarded agent allocation pool
│   └── resource_test.cpp        # Unit test for resource management
├── scheduler/                   # C++ Scheduling engines
│   ├── scheduler.h              # Order struct & algorithm signatures
│   ├── fcfs.cpp                 # First-Come, First-Served implementation
│   ├── sjf.cpp                  # Shortest Job First implementation
│   ├── priority.cpp             # Priority scheduling implementation
│   └── scheduler.cpp            # Scheduling CLI & CSV generator
├── synchronization/             # C++ Mutex synchronization demo
│   ├── synchronization.h        # Function headers
│   └── synchronization.cpp      # RAII lock_guard demonstration
└── tests/                       # Unit & integration test suites
    ├── os_test.cpp              # Combined OS C++ unit test
    └── database_test.sql        # Database integrity & join verification
```

---

## 🔑 Pre-Seeded Test Accounts

When you run `npm run seed` or import `database/sample_data.sql`, the following test accounts are ready to log in:

| Portal | Email | Password | Role | Status | Linked Entity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@ordercore.com` | `admin123` | `admin` | Approved | System Administrator |
| **Customer** | `tushar@example.com` | `password123` | `customer` | Approved | Customer ID 1 (Tushar) |
| **Customer** | `rahul@example.com` | `password123` | `customer` | Approved | Customer ID 2 (Rahul) |
| **Restaurant** | `pizzahub@example.com` | `password123` | `restaurant` | Approved | Restaurant ID 1 (Pizza Hub) |
| **Restaurant** | `burgerpoint@example.com` | `password123` | `restaurant` | Approved | Restaurant ID 2 (Burger Point) |
| **Restaurant** | `foodcorner@example.com` | `password123` | `restaurant` | Approved | Restaurant ID 3 (Food Corner) |
| **Restaurant (Demo)** | `greendelight@example.com` | `password123` | `restaurant` | **Pending** | Pending Admin Approval Demo |
| **Delivery Rider** | `agenta@example.com` | `password123` | `delivery_agent` | Approved | Rider ID 1 (Arun) |
| **Delivery Rider** | `agentb@example.com` | `password123` | `delivery_agent` | Approved | Rider ID 2 (Bikram) |
| **Delivery Rider (Demo)** | `rider@example.com` | `password123` | `delivery_agent` | **Pending** | Pending Admin Approval Demo |

---

## ⚡ Quick Start Guide (Mac / Local Setup)

### Step 1: Compile C++ Operating System Binaries
Run `make all` in the project root to compile the scheduler, deadlock runner, and synchronization tests:

```bash
make all
```

To run all automated C++ unit tests and verify the OS engines:
```bash
make test
```

### Step 2: Configure Environment Variables
Copy the template configuration into `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Ensure `backend/.env` has your local MySQL password and database name:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ordercore
JWT_SECRET=ordercore_super_secret_jwt_key_2026_university_eval
```

### Step 3: Initialize Database & Seed Data
You can seed the entire database (schema, 20-item food catalog, live orders, and hashed accounts) with a single command:

```bash
cd backend
npm install
npm run seed
```

*(Alternatively, you can import using standard MySQL CLI)*:
```bash
mysql -u root -p < ../database/schema.sql
mysql -u root -p < ../database/sample_data.sql
```

### Step 4: Start the Node.js Backend Server
From the `backend` directory:

```bash
npm start
```
The server will start listening at: **`http://localhost:3000`**

---

## 🌐 Portal URLs

Once the backend is running, open any of the following URLs in your web browser:

- 🏠 **Main Landing Page**: [http://localhost:3000](http://localhost:3000)
- 🛍️ **Customer Portal**: [http://localhost:3000/customer.html](http://localhost:3000/customer.html)
- 🍳 **Restaurant Kitchen Desk**: [http://localhost:3000/restaurant.html](http://localhost:3000/restaurant.html)
- 🛵 **Delivery Rider Dashboard**: [http://localhost:3000/agent.html](http://localhost:3000/agent.html)
- 📊 **Administrator Control Center**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

---

## 🎓 Recommended Faculty Demonstration Sequence

Follow this 5-step sequence during your project evaluation to showcase all OS and DBMS capabilities:

### Step 1: The OS Concept & Landing Hub
1. Open `http://localhost:3000`.
2. Explain the fundamental architectural premise: **Food Orders = Processes**, **Kitchen Slots = CPU**, **Delivery Couriers = Finite Synchronized Resources**.
3. Highlight the 4 distinct user workspaces.

### Step 2: Customer Ordering & Priority Dispatching
1. Open the **Customer Portal** (`customer.html`).
2. Log in using 1-Click Demo: **Tushar** (`tushar@example.com` / `password123`).
3. Browse the 20-item food catalog and add an item (e.g., *Farmhouse Pizza*).
4. In the checkout modal, demonstrate the **OS Priority Selector**:
   - **👑 Priority Express (Priority 1)**: Allocated priority cooking queue slot.
   - **⚡ Standard (Priority 2)**: Normal queue slot.
5. Click **Place Order**. Note that the order ticket appears with live status `Waiting`.

### Step 3: Kitchen Execution & Order State Machine
1. Open the **Restaurant Desk** (`restaurant.html`).
2. Log in with **Pizza Hub** (`pizzahub@example.com` / `password123`).
3. Show the newly arrived customer order in the kitchen queue.
4. Click **Start Cooking** ($\to$ `Preparing`) and then **Mark Ready for Pickup** ($\to$ `Ready`).
5. Alternatively, demonstrate **Smart OS Dispatch** to automatically dispatch the optimal waiting order via the C++ algorithm.

### Step 4: Delivery Rider Fulfillment & Mutex De-allocation
1. Open the **Delivery Rider Portal** (`agent.html`).
2. Log in with **Agent A (Arun)** (`agenta@example.com` / `password123`).
3. Show the active delivery manifest with customer location and order details.
4. Click **✓ Mark Order Delivered & Complete**.
5. Explain that this completes the order, transitions status to `Delivered`, and atomically releases the rider resource back to `Available` using database transaction locking.

### Step 5: Admin Dashboard — CPU Scheduling & Deadlock Resolution
1. Open the **Admin Dashboard** (`admin.html`).
2. Log in with `admin@ordercore.com` / `admin123`.
3. **Pending Account Approvals**:
   - Show the pending registrations (`Green Delight Cafe` or `Express Rider`).
   - Click **Approve** to demonstrate role-based access control gating.
4. **C++ CPU Scheduling Simulation & Comparison**:
   - Select **FCFS**, **SJF**, and **Priority** to see the calculated Turnaround and Waiting times.
   - Click **Compare All Algorithms Side-by-Side**: Show the comparative metrics table highlighting SJF as provably optimal for average waiting time.
5. **Interactive Deadlock Simulation & Resolution**:
   - Click **Simulate Circular Wait**: Displays cycle between Kitchen Slot and Courier ($P_0 \leftrightarrow P_1$).
   - Click **Run Deadlock Detection (C++)**: C++ matrix reduction algorithm confirms deadlock (`"deadlock": true`).
   - Click **Resolve Deadlock via Preemption**: C++ engine preempts resources, breaks circular wait, and restores safe system state.
