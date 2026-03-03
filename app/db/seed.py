"""
Seed Data — Başlangıç rolleri ve izinleri oluşturur.
Uygulama başlatırken otomatik çalışır (idempotent).
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.role import Role, Permission, role_permissions

logger = logging.getLogger(__name__)

# Başlangıç izinleri
DEFAULT_PERMISSIONS = [
    # Scan
    {"name": "scan:read", "description": "Scan sonuçlarını görüntüleme"},
    {"name": "scan:write", "description": "Yeni scan başlatma"},
    {"name": "scan:delete", "description": "Scan sonuçlarını silme"},
    # User
    {"name": "user:read", "description": "Kullanıcı bilgilerini görüntüleme"},
    {"name": "user:write", "description": "Kullanıcı bilgilerini düzenleme"},
    {"name": "user:manage", "description": "Kullanıcıları yönetme (rol atama, silme)"},
    # Reports
    {"name": "report:read", "description": "Raporları görüntüleme"},
    {"name": "report:write", "description": "Rapor oluşturma"},
    {"name": "report:export", "description": "Rapor dışa aktarma"},
    # Tools
    {"name": "tool:access", "description": "Araçlara erişim"},
    {"name": "tool:manage", "description": "Araç yönetimi"},
    # Admin
    {"name": "admin:panel", "description": "Admin paneline erişim"},
    {"name": "admin:settings", "description": "Sistem ayarları"},
]

# Başlangıç rolleri ve izin atamaları
DEFAULT_ROLES = [
    {
        "name": "viewer",
        "description": "Salt okunur erişim — scan sonuçları ve raporları görüntüleyebilir",
        "permissions": ["scan:read", "report:read", "user:read"],
    },
    {
        "name": "analyst",
        "description": "Analist — scan başlatabilir, rapor oluşturabilir, araçları kullanabilir",
        "permissions": [
            "scan:read", "scan:write",
            "report:read", "report:write", "report:export",
            "user:read",
            "tool:access",
        ],
    },
    {
        "name": "manager",
        "description": "Yönetici — kullanıcı yönetimi, tüm scan ve rapor işlemleri",
        "permissions": [
            "scan:read", "scan:write", "scan:delete",
            "report:read", "report:write", "report:export",
            "user:read", "user:write", "user:manage",
            "tool:access", "tool:manage",
        ],
    },
    {
        "name": "admin",
        "description": "Sistem yöneticisi — tam erişim (superuser flag ayrıdır)",
        "permissions": [p["name"] for p in DEFAULT_PERMISSIONS],
    },
]


async def seed_roles_and_permissions(db: AsyncSession) -> None:
    """Rolleri ve izinleri oluşturur (varsa atlar — idempotent/concurrent safe)"""
    
    # --- 1. İzinleri oluştur (Tek tek kontrol ederek ekle) ---
    perm_map = {}
    for perm_data in DEFAULT_PERMISSIONS:
        result = await db.execute(select(Permission).filter_by(name=perm_data["name"]))
        perm = result.scalars().first()
        if not perm:
            try:
                perm = Permission(**perm_data)
                db.add(perm)
                await db.flush()
                logger.info(f"İzin eklendi: {perm.name}")
            except Exception as e:
                # Concurrent invocation might have beaten us to it
                await db.rollback()
                result = await db.execute(select(Permission).filter_by(name=perm_data["name"]))
                perm = result.scalars().first()
        if perm:
            perm_map[perm.name] = perm

    # --- 2. Rolleri oluştur ---
    for role_data in DEFAULT_ROLES:
        result = await db.execute(select(Role).filter_by(name=role_data["name"]))
        role = result.unique().scalars().first()
        
        if not role:
            try:
                role = Role(name=role_data["name"], description=role_data["description"])
                # İzinleri eşleştir
                valid_perms = [perm_map[p] for p in role_data["permissions"] if p in perm_map]
                role.permissions.extend(valid_perms)
                
                db.add(role)
                await db.flush()
                logger.info(f"Rol eklendi: {role.name}")
            except Exception as e:
                await db.rollback()
                pass # Let the other concurrent function handle it

    try:
        await db.commit()
    except Exception:
        await db.rollback()
    
    logger.info("Seed tamamlandı ✓")
