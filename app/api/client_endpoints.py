import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Client, User
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from app.services.auth_service import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_client_or_403(client_id: str, db: Session, current_user: User) -> Client:
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    if not current_user.is_admin and client.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised to access this client")
    return client


def _to_response(client: Client) -> ClientResponse:
    return ClientResponse(
        id=client.id,
        user_id=client.user_id,
        created_at=client.created_at,
        updated_at=client.updated_at,
        brand_name=client.brand_name,
        website_url=client.website_url,
        target_country=client.target_country,
        industry=client.industry,
        product_description=client.product_description,
        core_problem_solved=client.core_problem_solved,
        unique_selling_proposition=client.unique_selling_proposition,
        demographics=client.demographics,
        psychographics=client.psychographics,
        cultural_nuances=client.cultural_nuances,
        main_competitors=client.main_competitors,
        current_marketing_efforts=client.current_marketing_efforts,
        known_customer_objections=client.known_customer_objections,
        campaign_count=len(client.campaigns),
    )


@router.get("/clients", summary="List My Clients", response_model=List[ClientResponse])
def list_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns all clients owned by the current user (admins see all)."""
    if current_user.is_admin:
        clients = db.query(Client).order_by(Client.brand_name).all()
    else:
        clients = (
            db.query(Client)
            .filter(Client.user_id == current_user.id)
            .order_by(Client.brand_name)
            .all()
        )
    return [_to_response(c) for c in clients]


@router.post("/clients", summary="Create Client", status_code=status.HTTP_201_CREATED, response_model=ClientResponse)
def create_client(
    body: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Creates a new client (brand profile) for the current user."""
    client = Client(
        user_id=current_user.id,
        brand_name=body.brand_name,
        website_url=body.website_url,
        target_country=body.target_country,
        industry=body.industry,
        product_description=body.product_description,
        core_problem_solved=body.core_problem_solved,
        unique_selling_proposition=body.unique_selling_proposition,
        demographics=body.demographics,
        psychographics=body.psychographics,
        cultural_nuances=body.cultural_nuances,
        main_competitors=body.main_competitors,
        current_marketing_efforts=body.current_marketing_efforts,
        known_customer_objections=body.known_customer_objections,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return _to_response(client)


@router.get("/clients/{client_id}", summary="Get Client", response_model=ClientResponse)
def get_client(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns a single client profile."""
    client = _get_client_or_403(client_id, db, current_user)
    return _to_response(client)


@router.put("/clients/{client_id}", summary="Update Client", response_model=ClientResponse)
def update_client(
    client_id: str,
    body: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Updates an existing client profile."""
    client = _get_client_or_403(client_id, db, current_user)
    for field, value in body.model_dump().items():
        setattr(client, field, value)
    db.commit()
    db.refresh(client)
    return _to_response(client)


@router.delete("/clients/{client_id}", summary="Delete Client", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletes a client. Fails if the client has existing campaigns."""
    client = _get_client_or_403(client_id, db, current_user)
    if client.campaigns:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete client with {len(client.campaigns)} existing campaign(s). Delete campaigns first.",
        )
    db.delete(client)
    db.commit()
