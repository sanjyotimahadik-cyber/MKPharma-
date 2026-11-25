// Order fulfilment flow, mirrored from server/src/orderFlow.js.
import { currentUser } from './auth.js';

export const ORDER_FLOW = ['Placed', 'Confirmed', 'Packed', 'Dispatched', 'Out for Delivery', 'Delivered'];
export const ORDER_STATUSES = [...ORDER_FLOW, 'Cancelled'];
export const CANCELLABLE = ['Placed', 'Confirmed', 'Packed'];

/** The single next step in the flow, or null when finished/cancelled. */
export const nextStep = (status) => {
  const i = ORDER_FLOW.indexOf(status);
  return i >= 0 && i < ORDER_FLOW.length - 1 ? ORDER_FLOW[i + 1] : null;
};

/** Button text and icon for moving an order to `status`. */
export const STEP_ACTION = {
  Confirmed: ['Confirm order', 'fa-circle-check'],
  Packed: ['Mark packed', 'fa-box'],
  Dispatched: ['Dispatch', 'fa-truck-ramp-box'],
  'Out for Delivery': ['Out for delivery', 'fa-truck-fast'],
  Delivered: ['Mark delivered', 'fa-house-circle-check'],
};

/** Icon per status, for badges and timelines. */
export const STATUS_ICON = {
  Placed: 'fa-cart-shopping',
  Confirmed: 'fa-circle-check',
  Packed: 'fa-box',
  Dispatched: 'fa-truck-ramp-box',
  'Out for Delivery': 'fa-truck-fast',
  Delivered: 'fa-house-circle-check',
  Cancelled: 'fa-ban',
};

/** CSS class for a status ("Out for Delivery" → "out-for-delivery"). */
export const statusClass = (status) => String(status ?? '').toLowerCase().replaceAll(' ', '-');

/** Base path of the signed-in staff member's area: /admin or /employee. */
export const staffBase = () => (currentUser()?.role === 'employee' ? '/employee' : '/admin');
