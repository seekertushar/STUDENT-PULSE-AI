# StudentPulse AI — Python Analytics Microservice

This directory contains the optional **FastAPI + Pandas + NumPy** analytics service implementing the exact same documented skill-gap, readiness, and academic CGPA scoring formulas as the built-in Node.js analytics engine.

## Local Development

```bash
cd python-analytics
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

## Deploy to Google Cloud Run

```bash
gcloud run deploy studentpulse-python-analytics \
  --source ./python-analytics \
  --region asia-southeast1 \
  --allow-unauthenticated
```

After deployment, set the returned HTTPS service URL as `PYTHON_ANALYTICS_URL` in the main application environment. When `PYTHON_ANALYTICS_URL` is unset, StudentPulse AI transparently uses its built-in Node.js deterministic engine and never claims the Python microservice is connected.
