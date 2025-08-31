#!/bin/bash

# =====================================================
# DATABASE TABLES DROP SCRIPT
# Description: Drop all tables and functions in reverse order
# =====================================================

echo "🗑️ Starting database tables drop..."

# Set the database directory (not needed for drop, but for reference)
DB_DIR="./database/tables"

# Drop tables in reverse order to handle dependencies
echo "🗑️ Dropping user_sessions table..."
psql $DATABASE_URL -c "DROP TABLE IF EXISTS user_sessions CASCADE;"

echo "🗑️ Dropping user_profiles table..."
psql $DATABASE_URL -c "DROP TABLE IF EXISTS user_profiles CASCADE;"

echo "🗑️ Dropping conversions table..."
psql $DATABASE_URL -c "DROP TABLE IF EXISTS conversions CASCADE;"

echo "🗑️ Dropping webhook_logs table..."
psql $DATABASE_URL -c "DROP TABLE IF EXISTS webhook_logs CASCADE;"

echo "🗑️ Dropping checklist_items table..."
psql $DATABASE_URL -c "DROP TABLE IF EXISTS checklist_items CASCADE;"

echo "🗑️ Dropping checklist_sessions table..."
psql $DATABASE_URL -c "DROP TABLE IF EXISTS checklist_sessions CASCADE;"

echo "🗑️ Dropping chat_messages table..."
psql $DATABASE_URL -c "DROP TABLE IF EXISTS chat_messages CASCADE;"

echo "🗑️ Dropping chat_conversations table..."
psql $DATABASE_URL -c "DROP TABLE IF EXISTS chat_conversations CASCADE;"

echo "🗑️ Dropping divorce_cases table..."
psql $DATABASE_URL -c "DROP TABLE IF EXISTS divorce_cases CASCADE;"

echo "🗑️ Dropping agendamentos table..."
psql $DATABASE_URL -c "DROP TABLE IF EXISTS agendamentos CASCADE;"

echo "🗑️ Dropping payments table..."
psql $DATABASE_URL -c "DROP TABLE IF EXISTS payments CASCADE;"

echo "🗑️ Dropping users table..."
psql $DATABASE_URL -c "DROP TABLE IF EXISTS users CASCADE;"

echo "🗑️ Dropping update_updated_at_column function..."
psql $DATABASE_URL -c "DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;"

echo "✅ Database reset complete. All tables and functions dropped."
