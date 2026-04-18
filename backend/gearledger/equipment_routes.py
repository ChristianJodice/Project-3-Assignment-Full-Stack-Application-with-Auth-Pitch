from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from gearledger.models import db, User, EquipmentItem

bp = Blueprint("equipment", __name__)


def _current_user_id():
    return int(get_jwt_identity())


def _require_custodian():
    user = User.query.get(_current_user_id())
    if not user or user.role != "custodian":
        return None
    return user


@bp.get("")
@jwt_required()
def list_equipment():
    items = EquipmentItem.query.order_by(EquipmentItem.name).all()
    return jsonify([i.to_dict() for i in items])


@bp.get("/<int:item_id>")
@jwt_required()
def get_equipment(item_id):
    item = EquipmentItem.query.get(item_id)
    if not item:
        return jsonify({"error": "Equipment not found."}), 404
    return jsonify(item.to_dict())


@bp.post("")
@jwt_required()
def create_equipment():
    if not _require_custodian():
        return jsonify({"error": "Custodian role required."}), 403

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip()
    quantity_total = data.get("quantity_total", 1)

    if not name:
        return jsonify({"error": "Name is required."}), 400
    try:
        quantity_total = int(quantity_total)
    except (TypeError, ValueError):
        return jsonify({"error": "quantity_total must be an integer."}), 400
    if quantity_total < 1:
        return jsonify({"error": "quantity_total must be at least 1."}), 400

    item = EquipmentItem(
        name=name, description=description, quantity_total=quantity_total
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@bp.put("/<int:item_id>")
@jwt_required()
def update_equipment(item_id):
    if not _require_custodian():
        return jsonify({"error": "Custodian role required."}), 403

    item = EquipmentItem.query.get(item_id)
    if not item:
        return jsonify({"error": "Equipment not found."}), 404

    data = request.get_json(silent=True) or {}
    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Name cannot be empty."}), 400
        item.name = name
    if "description" in data:
        item.description = (data.get("description") or "").strip()
    if "quantity_total" in data:
        try:
            q = int(data["quantity_total"])
        except (TypeError, ValueError):
            return jsonify({"error": "quantity_total must be an integer."}), 400
        if q < 1:
            return jsonify({"error": "quantity_total must be at least 1."}), 400
        active = item.active_checkout_quantity()
        if q < active:
            return (
                jsonify(
                    {
                        "error": f"Cannot set quantity below active checkouts ({active})."
                    }
                ),
                400,
            )
        item.quantity_total = q

    db.session.commit()
    return jsonify(item.to_dict())


@bp.delete("/<int:item_id>")
@jwt_required()
def delete_equipment(item_id):
    if not _require_custodian():
        return jsonify({"error": "Custodian role required."}), 403

    item = EquipmentItem.query.get(item_id)
    if not item:
        return jsonify({"error": "Equipment not found."}), 404
    if item.active_checkout_quantity() > 0:
        return jsonify({"error": "Cannot delete equipment with active checkouts."}), 400

    db.session.delete(item)
    db.session.commit()
    return "", 204
