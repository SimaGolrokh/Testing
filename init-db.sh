#!/bin/bash

set -e

echo "⏳ Waiting for database to be ready..."
until docker exec green-fingers-db pg_isready -U "$DB_USER"; do
  sleep 2
done

echo "✅ Database ready. Importing schema..."
cat dump.sql | docker exec -i green-fingers-db psql -U "$DB_USER" -d "$DB_NAME"
