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
    """Rolleri ve izinleri oluşturur (varsa atlar — idempotent)"""
    
    # 1. İzinleri oluştur
    existing_perms = await db.execute(select(Permission))
    existing_perm_names = {p.name for p in existing_perms.scalars().all()}
    
    perm_map = {}
    for perm_data in DEFAULT_PERMISSIONS:
        if perm_data["name"] not in existing_perm_names:
            perm = Permission(**perm_data)
            db.add(perm)
            await db.flush()
            perm_map[perm.name] = perm
            logger.info(f"İzin oluşturuldu: {perm.name}")
        else:
            result = await db.execute(
                select(Permission).filter(Permission.name == perm_data["name"])
            )
            perm_map[perm_data["name"]] = result.scalars().first()

    # 2. Rolleri oluştur
    existing_roles = await db.execute(select(Role))
    existing_role_names = {r.name for r in existing_roles.unique().scalars().all()}
    
    for role_data in DEFAULT_ROLES:
        if role_data["name"] not in existing_role_names:
            role = Role(
                name=role_data["name"],
                description=role_data["description"],
            )
            # İzinleri ata
            for perm_name in role_data["permissions"]:
                if perm_name in perm_map:
                    role.permissions.append(perm_map[perm_name])
            
            db.add(role)
            logger.info(f"Rol oluşturuldu: {role.name} ({len(role.permissions)} izin)")

    await db.commit()
    logger.info("Seed tamamlandı ✓")
