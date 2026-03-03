from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Any

from app.db.session import get_db
from app.models.scan import ScanTask
from app.models.user import User as UserModel
from app.api.dependencies import get_current_user
from app.worker.celery_app import celery_app
from app.worker.tasks import dummy_scan_task
from pydantic import BaseModel

router = APIRouter()

class ScanStartRequest(BaseModel):
    target_url: str

@router.post("/start", status_code=status.HTTP_202_ACCEPTED)
async def start_scan(
    payload: ScanStartRequest,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Yeni bir tarama kuyruğa ekler"""
    
    # 1. Celery task'ı asenkron olarak başlat ve ID al
    print(f"Starting Celery delay for URL: {payload.target_url}")
    try:
        task = dummy_scan_task.delay(target_url=payload.target_url)
        print(f"Celery task created. ID: {task.id}")
        task_id = task.id
    except Exception as e:
        print(f"Celery task failed to start: {e}")
        raise HTTPException(status_code=500, detail=f"Celery connection error: {str(e)}")
    
    # Dummy scan görevine ID'yi sonradan veremediğimiz için kodda task_id göndermeyi 
    # bırakıp doğrudan task.id'den okunacak şekilde task'i refactor ettik.
    
    # 2. Celery'nin oluşturduğu ID ile veritabanına kayıt at
    new_scan = ScanTask(
        task_id=task_id,
        user_id=current_user.id,
        target_url=payload.target_url,
        status="PENDING"
    )
    db.add(new_scan)
    await db.commit()
    await db.refresh(new_scan)
    
    return {"message": "Tarama kuyruğa alındı", "task_id": task_id}

@router.get("/{task_id}")
async def get_scan_status(
    task_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Taramanın güncel durumunu döndürür"""
    result = await db.execute(
        select(ScanTask)
        .filter(ScanTask.task_id == task_id)
        .filter(ScanTask.user_id == current_user.id)
    )
    scan = result.scalars().first()
    
    if not scan:
        raise HTTPException(status_code=404, detail="Tarama bulunamadı")
        
    return {
        "task_id": scan.task_id,
        "target_url": scan.target_url,
        "status": scan.status,
        "result": scan.result,
        "created_at": scan.created_at,
        "completed_at": scan.completed_at
    }

@router.get("/")
async def list_user_scans(
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Kullanıcının geçmiş taramalarını listeler"""
    result = await db.execute(
        select(ScanTask)
        .filter(ScanTask.user_id == current_user.id)
        .order_by(ScanTask.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    scans = result.scalars().all()
    
    return scans
