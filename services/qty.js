// Quantities and money math shared by product page, cart and checkout (mirrors the server)

// Half-up to cents, same as PHP sa_money
export function round2(v) {
  const n = Number(v) || 0;
  return (n < 0 ? -1 : 1) * Math.round(Math.abs(n) * 100 + 1e-6) / 100;
}

// Float noise off: 0.1 + 0.2 → 0.3
export function cleanQty(v) {
  return Math.round((Number(v) || 0) * 1000) / 1000;
}

export function stepOf(p) {
  return Number(p.qty_step) > 0 ? Number(p.qty_step) : 1;
}
export function minOf(p) {
  return Number(p.min_qty) > 0 ? Number(p.min_qty) : stepOf(p);
}

// Same rule as the server: ≥ minimum and a whole number of steps
export function validQty(q, p) {
  if (q <= 0 || q + 1e-9 < minOf(p)) return false;
  const n = q / stepOf(p);
  return Math.abs(n - Math.round(n)) < 1e-6;
}

export function nextQty(q, p) {
  return cleanQty(q < minOf(p) ? minOf(p) : q + stepOf(p));
}
export function prevQty(q, p) {
  const n = cleanQty(q - stepOf(p));
  return n + 1e-9 < minOf(p) ? 0 : n;
}

// Delivery fee as the server computes it
export function deliveryFee(shop, subtotal, fulfilment = 'delivery') {
  if (!shop || fulfilment === 'pickup') return 0;
  const free = Number(shop.free_delivery_over) || 0;
  return free > 0 && subtotal >= free ? 0 : Number(shop.delivery_fee) || 0;
}
