"""APScheduler — Periodic task scheduling for agent scan cycles."""

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from src.config import settings

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


def start_scheduler():
    """Initialize and start the APScheduler."""
    global _scheduler
    _scheduler = AsyncIOScheduler()

    # Alpha Scout + Technical Analyst: scan every 60s
    _scheduler.add_job(
        _run_scan_cycle,
        "interval",
        seconds=settings.scan_interval_seconds,
        id="scan_cycle",
        name="Agent Scan Cycle",
    )

    # Risk Sentinel: check every 5s
    _scheduler.add_job(
        _run_risk_check,
        "interval",
        seconds=settings.risk_check_interval_seconds,
        id="risk_check",
        name="Risk Check",
    )

    # Quant Lab: nightly optimization at 00:00 UTC
    _scheduler.add_job(
        _run_optimization,
        "cron",
        hour=0,
        minute=0,
        id="nightly_optimization",
        name="Nightly Optimization",
    )

    # Agent heartbeat: every 30s
    _scheduler.add_job(
        _run_heartbeats,
        "interval",
        seconds=30,
        id="heartbeats",
        name="Agent Heartbeats",
    )

    _scheduler.start()
    logger.info("Scheduler started with all jobs")


def stop_scheduler():
    """Shut down the scheduler."""
    global _scheduler
    if _scheduler:
        _scheduler.shutdown()
        _scheduler = None
        logger.info("Scheduler stopped")


async def _run_scan_cycle():
    """Run a full scan cycle for all configured symbols."""
    try:
        from src.agents.orchestrator import orchestrator
        for symbol in settings.default_symbols:
            await orchestrator.run_scan_cycle(symbol)
    except Exception as e:
        logger.error(f"Scan cycle error: {e}")


async def _run_risk_check():
    """Run risk sentinel check."""
    try:
        from src.agents.risk_sentinel import risk_sentinel
        for symbol in settings.default_symbols:
            await risk_sentinel.run_with_tracking(symbol)
    except Exception as e:
        logger.error(f"Risk check error: {e}")


async def _run_optimization():
    """Run nightly optimization."""
    try:
        from src.agents.quant_lab import quant_lab
        await quant_lab.run_optimization()
    except Exception as e:
        logger.error(f"Optimization error: {e}")


async def _run_heartbeats():
    """Send heartbeats for all agents."""
    try:
        from src.agents.alpha_scout import alpha_scout
        from src.agents.orchestrator import orchestrator
        from src.agents.quant_lab import quant_lab
        from src.agents.risk_sentinel import risk_sentinel
        from src.agents.technical_analyst import technical_analyst

        for agent in [alpha_scout, technical_analyst, risk_sentinel, orchestrator, quant_lab]:
            await agent.heartbeat()
    except Exception as e:
        logger.error(f"Heartbeat error: {e}")
