from datetime import date, datetime, timezone

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(32), nullable=False, default="member")
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    checkouts = db.relationship(
        "Checkout", backref="user", lazy="dynamic", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class EquipmentItem(db.Model):
    __tablename__ = "equipment_items"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    quantity_total = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    checkouts = db.relationship("Checkout", backref="equipment", lazy="dynamic")

    def active_checkout_quantity(self):
        total = (
            db.session.query(func.coalesce(func.sum(Checkout.quantity), 0))
            .filter(
                Checkout.equipment_id == self.id,
                Checkout.status == "active",
            )
            .scalar()
        )
        return int(total or 0)

    def available_quantity(self):
        return max(0, self.quantity_total - self.active_checkout_quantity())

    def to_dict(self, include_availability=True):
        d = {
            "id": self.id,
            "name": self.name,
            "description": self.description or "",
            "quantity_total": self.quantity_total,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_availability:
            d["available_quantity"] = self.available_quantity()
        return d


class Checkout(db.Model):
    __tablename__ = "checkouts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    equipment_id = db.Column(
        db.Integer, db.ForeignKey("equipment_items.id"), nullable=False
    )
    quantity = db.Column(db.Integer, nullable=False, default=1)
    due_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(32), nullable=False, default="active")
    notes = db.Column(db.String(500), default="")
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_email": self.user.email if self.user else None,
            "equipment_id": self.equipment_id,
            "quantity": self.quantity,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "status": self.status,
            "notes": self.notes or "",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "equipment": self.equipment.to_dict(include_availability=False)
            if self.equipment
            else None,
        }
