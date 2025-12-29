# Dockerfile for ADK Agents Service (Datadog LLM Observability)
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies (ddtrace first for auto-instrumentation)
COPY requirements.txt .
RUN pip install --no-cache-dir ddtrace \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Datadog LLM Observability env vars (agentless mode)
ENV PORT=8080 \
    PYTHONUNBUFFERED=1 \
    DD_LLMOBS_AGENTLESS_ENABLED=1 \
    DD_TRACE_ENABLED=1

# Run with Datadog tracer
CMD ["ddtrace-run", "python", "main.py"]
