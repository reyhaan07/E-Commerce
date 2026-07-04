// Plain factory function describing the shape of a Delivery Partner record.

function createDeliveryPartner({ id, name, email, password, phone, vehicle }) {
  return {
    id,
    name,
    email,
    password,
    phone,
    vehicle: vehicle || "Bike",
    status: "Active",
  };
}

module.exports = { createDeliveryPartner };
