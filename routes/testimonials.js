const express = require('express');
const Testimonial = require('../models/Testimonial');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/testimonials
 * Public — returns approved testimonials by default.
 * Admins can pass ?all=true to see every submission (pending + approved).
 */
router.get('/', async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isApproved: true };
    const testimonials = await Testimonial.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: testimonials.length, testimonials });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch testimonials', error: err.message });
  }
});

/**
 * POST /api/testimonials
 * Public — a customer submits a testimonial. Starts unapproved until an admin reviews it.
 */
router.post('/', async (req, res) => {
  try {
    const { name, content, position, rating } = req.body;

    if (!name || !content) {
      return res.status(400).json({ success: false, message: 'Name and testimonial content are required' });
    }

    const testimonial = await Testimonial.create({ name, content, position, rating, isApproved: false });
    res.status(201).json({ success: true, testimonial, message: 'Thank you! Your testimonial is pending review.' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to submit testimonial', error: err.message });
  }
});

/**
 * PUT /api/testimonials/:id/approve
 * Admin only — toggle approval (accepts { isApproved: true|false } in body; defaults to true).
 */
router.put('/:id/approve', verifyToken, requireAdmin, async (req, res) => {
  try {
    const isApproved = req.body.isApproved === undefined ? true : req.body.isApproved;
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, { isApproved }, { new: true });
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found' });
    res.json({ success: true, testimonial });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update testimonial', error: err.message });
  }
});

/**
 * PUT /api/testimonials/:id
 * Admin only — edit testimonial fields (e.g. featured, content).
 */
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found' });
    res.json({ success: true, testimonial });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to update testimonial', error: err.message });
  }
});

/**
 * DELETE /api/testimonials/:id
 * Admin only.
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found' });
    res.json({ success: true, message: 'Testimonial deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete testimonial', error: err.message });
  }
});

module.exports = router;
