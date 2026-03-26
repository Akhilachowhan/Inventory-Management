# Distributed Inventory Management System

A multi-warehouse distributed inventory management system suitable for a B.Tech mini project demonstrating real-world distributed database concepts.

## Core Features
1. **Horizontal Fragmentation**: Stock, sales, and purchases data are stored specifically inside their respective warehouse node databases (`HYD`, `CHE`, `BLR`).
2. **Replication via 2PC Simulation**: Products, categories, suppliers, and users are replicated across all three databases. If one server goes down during a write, the entire transaction is rolled back.
3. **Distributed Querying**: Complex queries like Total Stock or Dashboard Reports are aggregated by actively checking and joining results from all online nodes.
4. **Fault Tolerance Simulation**: A dedicated dashboard exists to toggle nodes (`UP` / `DOWN`). If a node is `DOWN`, the application handles the failure gracefully – fragmented reads bypass the failed node, and replicated writes are aborted alerting the user.

## Requirements
- Node.js (v14+)
- MySQL Server

## Setup Instructions

1. **Database Initialization**
   - Open your MySQL Workbench or command-line client.
   - Run the provided `database_setup.sql` script. This will drop and create the `inventory_hyd`, `inventory_che`, and `inventory_blr` databases, apply schemas, and insert sample data.
   
2. **Project Setup**
   - Inside the project root folder (`inventory-system`):
     ```bash
     npm install
     ```
   
3. **Environment Configuration**
   - The `.env` file is already created. Note that the application expects:
     ```env
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=Password@mysql
     ```
   - Update `DB_PASSWORD` if your local MySQL uses a different password.

4. **Starting the Application**
   - Run the Node server:
     ```bash
     node backend/server.js
     ```
   - OR
     ```bash
     npm run start
     ```
   - The application will start on `http://localhost:3000`.

## Testing the Distribution Features

1. **Replication Test**
   - Go to `Products`, add a new Product. Log into your MySQL and select from `inventory_hyd.products`, `inventory_che.products`, and `inventory_blr.products`. The new product will exist in all three.
2. **Horizontal Fragmentation Test**
   - Go to `Stock-In`, receive 50 units into `Chennai (CHE)`. Check MySQL; the `inventory_che.purchases` and `inventory_che.stock` table will increase, while `HYD` and `BLR` remain unaffected.
3. **Fault Tolerance Simulation**
   - Open the sidebar and click on `Simulation (Nodes)`.
   - Click "Disable Node" for `Hyderabad`.
   - Now try recording a new Product. It will throw an explicit Exception because 2PC prevents writes when a replica is down. 
   - Check the `Reports / Exports` page. The "Active Nodes" listed should show only `CHE` and `BLR`, effectively routing around the failure for reads.
