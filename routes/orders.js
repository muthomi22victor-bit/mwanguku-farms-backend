const express = require('express');
const Order = require('../models/Order');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/orders
 * Public — a customer places an order (guest checkout supported).
 * Expects: { customer: {name, phone, email, address}, items: [{name, price, quantity, product?}], deliveryFee? }
 */
router.post('/', async (req, res) => {
  try {
    const { customer, items, deliveryFee = 0, notes } = req.body;

    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({ success: false, message: 'Customer name and phone are required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must include at least one item' });
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal + Number(deliveryFee || 0);

    const order = await Order.create({
      customer,
      items,
      subtotal,
      deliveryFee,
      total,
      notes,
    });

    res.status(201).json({ success: true, order, message: 'Order placed! We will contact you to confirm.' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to place order', error: err.message });
  }
});

/**
 * GET /api/orders
 * Admin only — list all orders. Supports ?status= filter.
 */
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: err.message });
  }
});

/**
 * GET /api/orders/:id
 * Admin only — view a single order.
 */
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch order', error: err.message });
  }
});

/**
 * PUT /api/orders/:id/status
 * Admin only — update order status and/or payment status.
 */
router.put('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to update order', error: err.message });
  }
});

module.exports = router;
