const express = require('express');
const Stat = require('../models/Stat');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/stats
 * Public — returns homepage stats sorted for display.
 */
router.get('/', async (req, res) => {
  try {
    const stats = await Stat.find().sort({ displayOrder: 1 });
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: err.message });
  }
});

/**
 * POST /api/stats
 * Admin only — create a new stat.
 */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const stat = await Stat.create(req.body);
    res.status(201).json({ success: true, stat });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to create stat', error: err.message });
  }
});

/**
 * PUT /api/stats/:id
 * Admin only — update a stat's label/value/suffix/order.
 */
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const stat = await Stat.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!stat) return res.status(404).json({ success: false, message: 'Stat not found' });
    res.json({ success: true, stat });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to update stat', error: err.message });
  }
});

/**
 * DELETE /api/stats/:id
 * Admin only.
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const stat = await Stat.findByIdAndDelete(req.params.id);
    if (!stat) return res.status(404).json({ success: false, message: 'Stat not found' });
    res.json({ success: true, message: 'Stat deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete stat', error: err.message });
  }
});

module.exports = router;
