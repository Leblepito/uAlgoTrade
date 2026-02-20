"""Stripe billing endpoints — checkout, portal, webhooks."""
from __future__ import annotations
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.session import get_session
from src.core.deps import get_current_user
from src.config import settings
from src.models.user import User

stripe.api_key = settings.stripe_secret_key
router = APIRouter(prefix="/billing", tags=["billing"])

PLAN_PRICES = {
    "hot_desk": settings.stripe_hot_desk_price_id,
    "dedicated": settings.stripe_dedicated_price_id,
    "private_office": settings.stripe_private_office_price_id,
}


class CheckoutBody(BaseModel):
    plan: str  # hot_desk | dedicated | private_office


@router.post("/checkout")
async def create_checkout(
    body: CheckoutBody,
    user: User = Depends(get_current_user),
):
    if body.plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan")
    price_id = PLAN_PRICES[body.plan]
    if not price_id:
        raise HTTPException(status_code=400, detail="Plan not configured")

    session = stripe.checkout.Session.create(
        mode="subscription",
        customer_email=user.email,
        metadata={"user_id": user.id, "plan": body.plan},
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{settings.frontend_url}/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.frontend_url}/pricing",
    )
    return {"url": session.url}


@router.post("/portal")
async def billing_portal(user: User = Depends(get_current_user)):
    if not user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active subscription")
    session = stripe.billing_portal.Session.create(
        customer=user.stripe_customer_id,
        return_url=f"{settings.frontend_url}/dashboard",
    )
    return {"url": session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request, session: AsyncSession = Depends(get_session)):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.stripe_webhook_secret)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        data = event["data"]["object"]
        user_id = data.get("metadata", {}).get("user_id")
        customer_id = data.get("customer")
        if user_id and customer_id:
            from src.services.user_service import UserService
            svc = UserService(session)
            await svc.update_stripe_customer(user_id, customer_id)

    return {"received": True}
