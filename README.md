# PAWAEYE Threat Modeling Tool

A modern threat modeling tool for Agentic AI systems based on the PAWAEYE framework.

## Features

- Autonomous threat identification using LLMs
- Threat classification and risk assessment
- Threat lifecycle management
- Modern dashboard with visualizations
- Secure authentication and authorization
- PostgreSQL database with vector storage

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 13+
- PgVector extension

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pawaeye.git
cd pawaeye
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend:
```bash
cd frontend
npm install
```

4. Configure environment variables:
- Copy `.env.example` to `.env`
- Update the values in `.env` with your configuration

5. Set up the database:
```bash
createdb pawaeye
psql pawaeye -c "CREATE EXTENSION vector;"
```

6. Run database migrations:
```bash
cd backend
alembic upgrade head
```

## Running the Application

1. Start the backend server:
```bash
cd backend
uvicorn main:app --reload
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Access the application at http://localhost:5173

## API Documentation

The API documentation is available at http://localhost:8000/docs when the backend server is running.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 