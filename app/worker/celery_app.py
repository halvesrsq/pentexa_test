import os
from celery import Celery
from app.core.config import settings

# Celery konfigürasyonu
celery_app = Celery(
    "pentexa_worker",
    broker=str(settings.REDIS_URL),
    backend=str(settings.REDIS_URL),
    include=["app.worker.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1, # Uzun süren scan'ler için tavsiye edilir
    worker_max_tasks_per_child=50 # Memory leak'leri önlemek için periyodik yeniden başlatma
)
