from datetime import date, datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from gearledger.models import db, User, EquipmentItem, Checkout

bp = Blueprint("checkouts", __name__)


def _current_user_id():
    return int(get_jwt_identity())


def _is_custodian():
    user = User.query.get(_current_user_id())
    return user and user.role == "custodian"


def _parse_date(value):
    if not value:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


@bp.get("")
@jwt_required()
def list_checkouts():
    q = Checkout.query.options(
        joinedload(Checkout.equipment), joinedload(Checkout.user)
    )
    if not _is_custodian():
        q = q.filter(Checkout.user_id == _current_user_id())
    rows = q.order_by(Checkout.created_at.desc()).all()
    return jsonify([c.to_dict() for c in rows])


@bp.get("/<int:checkout_id>")
@jwt_required()
def get_checkout(checkout_id):
    c = Checkout.query.options(
        joinedload(Checkout.equipment), joinedload(Checkout.user)
    ).get(checkout_id)
    if not c:
        return jsonify({"error": "Checkout not found."}), 404
    uid = _current_user_id()
    if c.user_id != uid and not _is_custodian():
        return jsonify({"error": "Forbidden."}), 403
    return jsonify(c.to_dict())


@bp.post("")
@jwt_required()
def create_checkout():
    uid = _current_user_id()
    data = request.get_json(silent=True) or {}
    equipment_id = data.get("equipment_id")
    quantity = data.get("quantity", 1)
    due_raw = data.get("due_date")
    notes = (data.get("notes") or "").strip()[:500]

    if equipment_id is None:
        return jsonify({"error": "equipment_id is required."}), 400
    try:
        equipment_id = int(equipment_id)
    except (TypeError, ValueError):
        return jsonify({"error": "equipment_id must be an integer."}), 400
    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return jsonify({"error": "quantity must be an integer."}), 400
    if quantity < 1:
        return jsonify({"error": "quantity must be at least 1."}), 400

    due_date = _parse_date(due_raw)
    if not due_date:
        return jsonify({"error": "due_date is required (YYYY-MM-DD)."}), 400

    item = EquipmentItem.query.get(equipment_id)
    if not item:
        return jsonify({"error": "Equipment not found."}), 404

    available = item.available_quantity()
    if quantity > available:
        return (
            jsonify(
                {
                    "error": f"Not enough available stock (available: {available}).",
                }
            ),
            400,
        )

    c = Checkout(
        user_id=uid,
        equipment_id=equipment_id,
        quantity=quantity,
        due_date=due_date,
        status="active",
        notes=notes,
    )
    db.session.add(c)
    db.session.commit()
    db.session.refresh(c)
    c = Checkout.query.options(
        joinedload(Checkout.equipment), joinedload(Checkout.user)
    ).get(c.id)
    return jsonify(c.to_dict()), 201


@bp.put("/<int:checkout_id>")
@jwt_required()
def update_checkout(checkout_id):
    c = Checkout.query.get(checkout_id)
    if not c:
        return jsonify({"error": "Checkout not found."}), 404
    uid = _current_user_id()
    custodian = _is_custodian()
    if c.user_id != uid and not custodian:
        return jsonify({"error": "Forbidden."}), 403

    data = request.get_json(silent=True) or {}

    if "notes" in data:
        c.notes = (data.get("notes") or "").strip()[:500]

    if "status" in data:
        status = (data.get("status") or "").strip().lower()
        if status not in ("active", "returned"):
            return jsonify({"error": "status must be active or returned."}), 400
        c.status = status

    if "due_date" in data and (c.user_id == uid or custodian):
        due_date = _parse_date(data.get("due_date"))
        if not due_date:
            return jsonify({"error": "due_date must be YYYY-MM-DD."}), 400
        c.due_date = due_date

    if "quantity" in data and custodian:
        try:
            q = int(data["quantity"])
        except (TypeError, ValueError):
            return jsonify({"error": "quantity must be an integer."}), 400
        if q < 1:
            return jsonify({"error": "quantity must be at least 1."}), 400
        item = EquipmentItem.query.get(c.equipment_id)
        other_active = (
            db.session.query(func.coalesce(func.sum(Checkout.quantity), 0))
            .filter(
                Checkout.equipment_id == c.equipment_id,
                Checkout.status == "active",
                Checkout.id != c.id,
            )
            .scalar()
            or 0
        )
        if q + int(other_active) > item.quantity_total:
            return jsonify({"error": "Quantity would exceed equipment stock."}), 400
        c.quantity = q

    db.session.commit()
    c = Checkout.query.options(
        joinedload(Checkout.equipment), joinedload(Checkout.user)
    ).get(c.id)
    return jsonify(c.to_dict())


@bp.delete("/<int:checkout_id>")
@jwt_required()
def delete_checkout(checkout_id):
    c = Checkout.query.get(checkout_id)
    if not c:
        return jsonify({"error": "Checkout not found."}), 404
    uid = _current_user_id()
    if c.user_id != uid and not _is_custodian():
        return jsonify({"error": "Forbidden."}), 403

    db.session.delete(c)
    db.session.commit()
    return "", 204
