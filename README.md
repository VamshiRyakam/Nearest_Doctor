Terminal 1
==================
cd server
npm install
npm start

Terminal 2
==================
cd ../frontend
npm install
npm start


Terminal 3
==================
cd ../ai_engine
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py