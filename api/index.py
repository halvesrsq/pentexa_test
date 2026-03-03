"""
Vercel Serverless Entry Point
─────────────────────────────
Vercel's @vercel/python runtime looks for a WSGI/ASGI app object
in api/index.py. This file simply re-exports the existing FastAPI
application without modifying any internal project structure.
"""

from app.main import app  # noqa: F401

# Vercel automatically discovers the `app` object above.
# No additional configuration is needed here.
