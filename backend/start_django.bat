@echo off
echo ================================================
echo   Django Backend - Mir Knig Bookstore
echo ================================================
echo.

REM Check if venv exists
if not exist "venv" (
    echo [1/6] Creating virtual environment...
    python -m venv venv
) else (
    echo [1/6] Virtual environment exists ✓
)

echo [2/6] Activating virtual environment...
call venv\Scripts\activate

echo [3/6] Installing dependencies...
pip install -r requirements.txt --quiet

echo [4/6] Running migrations...
python manage.py makemigrations
python manage.py migrate

echo [5/6] Collecting static files...
python manage.py collectstatic --noinput --clear

echo [6/6] Starting Django server on port 5000...
echo.
echo ================================================
echo  Server is running at http://localhost:5000
echo  Admin panel: http://localhost:5000/admin/
echo  API: http://localhost:5000/api/
echo ================================================
echo.

python manage.py runserver 5000
