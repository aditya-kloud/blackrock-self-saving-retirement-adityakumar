# docker build -t blk-hacking-ind-aditya-kumar .

# python:3.11-slim — Debian-based minimal Linux image chosen for:
#   small footprint (~50MB vs ~900MB full), official Python support,
#   production-grade stability, and no unnecessary OS packages.
FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# Copy dependency list first (leverages Docker layer cache)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the full application source
COPY app/ ./app/

# Expose the required port per challenge spec
EXPOSE 5477

# Start the FastAPI server on port 5477
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5477"]
