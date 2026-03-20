# 🚀 Hostinger VPS Deployment Guide

This guide will walk you through setting up your professional Supabase backend on your Hostinger KVM 2 VPS (8GB RAM).

## Prerequisites
- SSH access to your Hostinger VPS.
- Docker and Docker Compose installed on the VPS. (If not installed, run: `sudo apt update && sudo apt install docker-compose -y`)

## Step 1: Upload the Files
You need to copy the following files from your local machine to your VPS:
1. `docker-compose.yml`
2. `supabase.env` (Rename this to `.env` on your VPS)
3. `kong.yml`
4. The `db_schema/` folder (to initialize your tables)

**Recommended folder structure on VPS:**
```text
~/supabase-deployment/
├── docker-compose.yml
├── .env
├── kong.yml
├── db_schema/
│   ├── db_schema.sql
│   └── ...
└── volumes/ (Will be created automatically)
```

## Step 2: Configure Environment Variables
Open the `.env` file on your VPS and update:
1. `POSTGRES_PASSWORD`: Use a strong unique password.
2. `JWT_SECRET`: Use a random string of at least 32 characters.
3. `SITE_URL`: Replace `your_vps_ip_address` with your actual Hostinger IP.
4. `ANON_KEY` & `SERVICE_ROLE_KEY`: Generate these or use the ones I provide below.

## Step 3: Launch
Run the following command in your `supabase-deployment` folder on the VPS:
```bash
docker-compose up -d
```

## Step 4: Verify
Once running, your Supabase API will be accessible at:
`http://YOUR_VPS_IP:8000/rest/v1`

## Step 5: Update Local App
After the VPS is live, update your local `.env` file in the cricket project:
```env
VITE_SUPABASE_URL=http://YOUR_VPS_IP:8000
VITE_SUPABASE_ANON_KEY=YOUR_NEW_ANON_KEY
```

---

### Need help with keys?
I can generate a set of secure random keys for you right now if you'd like. Just say the word!
