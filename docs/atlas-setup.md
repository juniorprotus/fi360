# MongoDB Atlas M0 Setup Checklist

## Step-by-Step Atlas Configuration

### 1. Create the Free Cluster
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Sign in and click **"Create"**
3. Select **"FREE" (M0)** tier
4. **Provider:** AWS → **Region:** `us-east-1` (or closest to Render Oregon)
5. **Cluster Name:** `fi360-cluster`
6. Click **"Create Deployment"**

---

### 2. Create a Database User
1. In the Atlas sidebar → **Database Access**
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `fi360-api`
5. Password: Generate a strong password (save it!)
6. Built-in Role: **"Read and write to any database"**
7. Click **"Add User"**

---

### 3. Whitelist IP Access
1. In the Atlas sidebar → **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** → Confirms `0.0.0.0/0`
   > ⚠️ Required for Render (dynamic IPs). Atlas M0 supports this.
4. Click **"Confirm"**

---

### 4. Get Your Connection String
1. In Atlas Dashboard → **Database** → Click **"Connect"** on your cluster
2. Choose **"Drivers"** → Driver: Node.js
3. Copy the URI — it looks like:
   ```
   mongodb+srv://fi360-api:<password>@fi360-cluster.xxxxxx.mongodb.net/fi360?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. The database name `fi360` in the URI will be auto-created on first write

---

### 5. Set Environment Variable Locally
Open `backend/.env` and paste:
```
MONGODB_URI=mongodb+srv://fi360-api:YOUR_PASSWORD@fi360-cluster.xxxxxx.mongodb.net/fi360?retryWrites=true&w=majority
```

---

### 6. Run the Seed Script
```bash
cd backend
npm run seed
```
Expected output:
```
✅ Organization: "National Logistics Hub"
✅ Vehicle: KBZ-482L (active)
✅ Vehicle: KDD-109X (maintenance)
✅ Vehicle: KDA-553M (critical_failure)
✅ Driver: Samuel Kiprop
✅ Driver: Amina Noor
✅ Maintenance: brake_system — high priority (in_progress)
✅ Maintenance: emergency_repair — urgent priority (scheduled)
🎉 Seed complete!
```

---

### 7. Set in Render (after backend deployment)
In Render Dashboard → fi360-backend → **Environment** tab:
- Add Secret: `MONGODB_URI` = your full Atlas connection string
- Add Secret: `GEMINI_API_KEY` = (from Google AI Studio, for Phase 4)
