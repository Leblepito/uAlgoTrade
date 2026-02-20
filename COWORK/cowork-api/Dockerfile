FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .
COPY src/ ./src/
COPY alembic/ ./alembic/
COPY alembic.ini ./
ENV PORT=8080
EXPOSE ${PORT}
CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port ${PORT}"]
