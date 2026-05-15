#!/bin/bash

# ===================================================================
# Script: Create Master Admin
# Description: Interactive script to create or update a master admin
# ===================================================================

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# User Details (Pre-filled as requested)
DEFAULT_NAME="Kunal"
DEFAULT_EMAIL="kunal@upnixo.com"
DEFAULT_PHONE="+919876543210"

echo -e "${BLUE}------------------------------------------------${NC}"
echo -e "${BLUE}🚀 Upnixo: Master Admin Creation Tool${NC}"
echo -e "${BLUE}------------------------------------------------${NC}"

# Load environment variables
ENV_FILE="db/docker/.env.dev"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo -e "${RED}❌ Error: Environment file not found at $ENV_FILE${NC}"
    exit 1
fi

# Check if database container is running
CONTAINER_NAME="upnixo-db-dev"
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}❌ Error: Database container '$CONTAINER_NAME' is not running.${NC}"
    echo -e "Please run ${GREEN}'make db'${NC} first."
    exit 1
fi

# Collect details with defaults
read -p "👤 Full Name [$DEFAULT_NAME]: " FULL_NAME
FULL_NAME=${FULL_NAME:-$DEFAULT_NAME}

read -p "📧 Email [$DEFAULT_EMAIL]: " EMAIL
EMAIL=${EMAIL:-$DEFAULT_EMAIL}

read -p "📞 Phone [$DEFAULT_PHONE]: " PHONE
PHONE=${PHONE:-$DEFAULT_PHONE}

read -s -p "🔑 Password: " PASSWORD
echo ""
read -s -p "🔐 Master Secret Key: " SECRET_KEY
echo ""

if [[ -z "$FULL_NAME" || -z "$EMAIL" || -z "$PASSWORD" || -z "$SECRET_KEY" ]]; then
    echo -e "${RED}❌ Error: All fields are required.${NC}"
    exit 1
fi

echo -e "${BLUE}⏳ Processing (Hashing & Inserting)...${NC}"

# Execute SQL via Docker
# 1. Enable pgcrypto for hashing
# 2. Use crypt() with Blowfish (bcrypt) for password and secret key
docker exec -i "$CONTAINER_NAME" psql -U "${POSTGRES_USER:-upnixo_admin}" -d "${POSTGRES_DB:-upnixo_db}" > /dev/null 2>&1 <<EOF
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO master_admins (
    full_name, 
    email, 
    phone, 
    password_hash, 
    master_secret_key, 
    is_verified, 
    is_active
) VALUES (
    '$FULL_NAME', 
    '$EMAIL', 
    '$PHONE', 
    crypt('$PASSWORD', gen_salt('bf')), 
    crypt('$SECRET_KEY', gen_salt('bf')), 
    TRUE, 
    TRUE
) ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    password_hash = EXCLUDED.password_hash,
    master_secret_key = EXCLUDED.master_secret_key,
    updated_at = NOW();
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Success: Master Admin '$FULL_NAME' created/updated!${NC}"
    echo -e "📧 Email: $EMAIL"
    echo -e "🔒 Password and Secret Key have been hashed securely."
else
    echo -e "${RED}❌ Error: Failed to execute SQL. Check database logs.${NC}"
    exit 1
fi
