#!/bin/bash

# =====================================================
# Script to run database migrations for agendamentos
# =====================================================

echo "🚀 Executing agendamentos constraints migration..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Please install PostgreSQL client tools."
    exit 1
fi

# Database connection details (adjust as needed)
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"salasegura"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-""}

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Run the migration
echo "📡 Connecting to database: $DB_HOST:$DB_PORT/$DB_NAME"
echo "📄 Executing migration: 20250831_add_agendamentos_constraints.sql"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "database/migrations/20250831_add_agendamentos_constraints.sql"

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo "🔧 Unique constraints added to agendamentos table"
    echo "🛡️  Duplicate prevention is now active"
else
    echo "❌ Migration failed!"
    echo "Please check the database connection and migration file"
    exit 1
fi

echo "🎉 Database migration completed!"
