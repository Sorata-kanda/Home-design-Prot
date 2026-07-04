# Use a lightweight official Python image
FROM python:3.10-slim

# Install system dependencies for OpenCV (libGL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker build cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the server code
COPY . .

# Expose port
EXPOSE 8000

# Run the app
CMD ["uvicorn", "segment_api:app", "--host", "0.0.0.0", "--port", "8000"]
