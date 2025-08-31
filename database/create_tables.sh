#!/bin/bash

# =====================================================
# DATABASE TABLES CREATION SCRIPT
# Description: Execute all table creation files in order
# =====================================================

echo "🚀 Starting database tables creation..."

# Set the database directory
DB_DIR="./database/tables"

# Execute files in order
echo "📋 Creating functions..."
psql $DATABASE_URL -f "$DB_DIR/00_functions.sql"

echo "👤 Creating users table..."
psql $DATABASE_URL -f "$DB_DIR/01_users.sql"

echo "💳 Creating payments table..."
psql $DATABASE_URL -f "$DB_DIR/02_payments.sql"

echo "📅 Creating agendamentos table..."
psql $DATABASE_URL -f "$DB_DIR/03_agendamentos.sql"

echo "⚖️ Creating divorce_cases table..."
psql $DATABASE_URL -f "$DB_DIR/04_divorce_cases.sql"

echo "💬 Creating chat_conversations table..."
psql $DATABASE_URL -f "$DB_DIR/05_chat_conversations.sql"

echo "💬 Creating chat_messages table..."
psql $DATABASE_URL -f "$DB_DIR/06_chat_messages.sql"

echo "✅ Creating checklist_sessions table..."
psql $DATABASE_URL -f "$DB_DIR/07_checklist_sessions.sql"

echo "✅ Creating checklist_items table..."
psql $DATABASE_URL -f "$DB_DIR/08_checklist_items.sql"

echo "🔗 Creating webhook_logs table..."
psql $DATABASE_URL -f "$DB_DIR/09_webhook_logs.sql"

echo "📝 Creating conversions table..."
psql $DATABASE_URL -f "$DB_DIR/10_conversions.sql"

echo "👤 Creating user_profiles table..."
psql $DATABASE_URL -f "$DB_DIR/11_user_profiles.sql"

echo "🔐 Creating user_sessions table..."
psql $DATABASE_URL -f "$DB_DIR/12_user_sessions.sql"

echo "🎉 All tables created successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Test each table individually"
echo "2. Add service-specific fields as needed"
echo "3. Create additional relationships if required"
echo "4. Implement business-specific constraints"