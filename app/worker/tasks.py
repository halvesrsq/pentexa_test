import asyncio
import time
from celery import shared_task
from app.db.session import AsyncSessionLocal
from app.models.scan import ScanTask
from sqlalchemy import update
from datetime import datetime, timezone

# Yardımcı senkronizasyon fonksiyonu
def async_to_sync(coroutine):
    """Event loop yaratarak async coroutine'i senkron çalıştırır (Celery worker'lar için)"""
    loop = asyncio.get_event_loop()
    if loop.is_closed():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coroutine)

async def _update_task_status_async(task_id: str, status: str, result: dict = None):
    """Asenkron DB oturumu kullanarak durumu günceller"""
    async with AsyncSessionLocal() as session:
        stmt = update(ScanTask).where(ScanTask.task_id == task_id).values(
            status=status,
            result=result,
            completed_at=datetime.now(timezone.utc) if status in ("SUCCESS", "FAILED") else None
        )
        await session.execute(stmt)
        await session.commit()

def update_task_status(task_id: str, status: str, result: dict = None):
    """Celery'nin çağıracağı senkron sarmalayıcı"""
    async_to_sync(_update_task_status_async(task_id, status, result))

@shared_task(bind=True, name="dummy_scan_task")
def dummy_scan_task(self, target_url: str):
    """
    Örnek bir tarama simülasyonu. Gelen target_url değerine 
    göre işlem yapıp sonucunu kaydeder.
    """
    task_id = self.request.id
    try:
        # Durumu "RUNNING" yap
        update_task_status(task_id, "RUNNING")
        
        # Gerçek tarama süreci yerine bekleme süresi eklendi
        # İleride burada nmap, nuclei vb. scriptler tetiklenebilir
        time.sleep(15) 
        
        mock_result = {
            "target": target_url,
            "vulnerabilities": [
                {"type": "SQL Injection", "severity": "High", "path": "/login"},
                {"type": "XSS", "severity": "Medium", "path": "/search"}
            ],
            "scan_duration": "15s"
        }
        
        # Durumu "SUCCESS" yap ve bulguları (result) kaydet
        update_task_status(task_id, "SUCCESS", result=mock_result)
        return mock_result
        
    except Exception as e:
        # Hata anında "FAILED" durumunu bas
        update_task_status(task_id, "FAILED", result={"error": str(e)})
        raise e
