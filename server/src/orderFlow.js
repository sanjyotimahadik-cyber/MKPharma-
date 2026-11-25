// Order fulfilment flow. Staff (admin or employee) move an order one step at a time; every step is logged in
// order_events so buyers see a tracking timeline. Keep in sync with web/src/lib/orders.js.

export const STAFF = ['admin', 'employee'];
export const isStaff = (user) => STAFF.includes(user?.role);

export const ORDER_FLOW = ['Placed', 'Confirmed', 'Packed', 'Dispatched', 'Out for Delivery', 'Delivered'];
export const ORDER_STATUSES = [...ORDER_FLOW, 'Cancelled'];

/** Statuses that can still be cancelled (stock goes back). Buyers may cancel only while Placed. */
export const CANCELLABLE = ['Placed', 'Confirmed', 'Packed'];

/** Statuses staff may move an order to from `status`. */
export function nextStatuses(status) {
  const i = ORDER_FLOW.indexOf(status);
  const next = i >= 0 && i < ORDER_FLOW.length - 1 ? [ORDER_FLOW[i + 1]] : [];
  return CANCELLABLE.includes(status) ? [...next, 'Cancelled'] : next;
}

/** Statuses that still need work from the team (shown as "to do"). */
export const OPEN = ORDER_FLOW.slice(0, -1);
