const express = require('express');
const ContactMessage = require('../models/ContactMessage');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/contact
 * Public — submit the contact form.
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required' });
    }

    const contactMessage = await ContactMessage.create({ name, email, phone, message });
    res.status(201).json({
      success: true,
      message: "Thank you! Your message has been sent — we'll be in touch shortly.",
      contactMessage,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to send message', error: err.message });
  }
});

/**
 * GET /api/contact
 * Admin only — list all contact messages. Supports ?status= filter.
 */
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const messages = await ContactMessage.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: messages.length, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages', error: err.message });
  }
});

/**
 * PUT /api/contact/:id
 * Admin only — update message status (e.g. mark as read/replied).
 */
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const message = await ContactMessage.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to update message', error: err.message });
  }
});

/**
 * DELETE /api/contact/:id
 * Admin only.
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete message', error: err.message });
  }
});

module.exports = router;
