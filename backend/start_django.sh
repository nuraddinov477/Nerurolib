#!/bin/bash

echo "================================================"
echo "   Django Backend - Mir Knig Bookstore"
echo "================================================"
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "[1/6] Creating virtual environment..."
    python3 -m venv venv
else
    echo "[1/6] Virtual environment exists ✓"
fi

echo "[2/6] Activating virtual environment..."
source venv/bin/activate

echo "[3/6] Installing dependencies..."
pip install -r requirements.txt --quiet

echo "[4/6] Running migrations..."
python manage.py makemigrations
python manage.py migrate

echo "[5/6] Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "[6/6] Starting Django server on port 5000..."
echo ""
echo "================================================"
echo "  Server is running at http://localhost:5000"
echo "  Admin panel: http://localhost:5000/admin/"
echo "  API: http://localhost:5000/api/"
echo "================================================"
echo ""

python manage.py runserver 5000
