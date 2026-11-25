// Product helpers shared by pages. Product data itself comes from GET /api/products.

// Low stock = stock at or below each product's reorderLevel (editable per product).

export const CATEGORIES = ['Feed Supplement', 'Calcium', 'Veterinary Medicine'];

export const isExpired = (p) => Boolean(p.expiry) && p.expiry < new Date().toLocaleDateString('en-CA');
