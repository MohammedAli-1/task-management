const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All task routes require authentication
router.use(protect);

// @route   GET /api/tasks/stats
// @desc    Get dashboard statistics for current user
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;

    const [total, pending, inProgress, completed, highPriority, overdue] = await Promise.all([
      Task.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, status: 'pending' }),
      Task.countDocuments({ user: userId, status: 'in-progress' }),
      Task.countDocuments({ user: userId, status: 'completed' }),
      Task.countDocuments({ user: userId, priority: 'high', status: { $ne: 'completed' } }),
      Task.countDocuments({
        user: userId,
        status: { $ne: 'completed' },
        dueDate: { $lt: new Date() },
      }),
    ]);

    res.json({ total, pending, inProgress, completed, highPriority, overdue });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// @route   GET /api/tasks
// @desc    Get all tasks with search, filter, and sorting
// @access  Private
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { search, status, priority, sortBy = 'createdAt', order = 'desc', page = 1, limit = 20 } = req.query;

    const filter = { user: userId };

    if (status && ['pending', 'in-progress', 'completed'].includes(status)) {
      filter.status = status;
    }

    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      filter.priority = priority;
    }

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const allowedSortFields = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find(filter).sort({ [sortField]: sortOrder }).skip(skip).limit(limitNum).lean(),
      Task.countDocuments(filter),
    ]);

    res.json({
      tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Get tasks error:', err.message);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get a single task
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(500).json({ message: 'Failed to fetch task' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('status').optional().isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status'),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { title, description, priority, status, dueDate } = req.body;

      const task = await Task.create({
        user: req.user._id,
        title,
        description: description || '',
        priority: priority || 'medium',
        status: status || 'pending',
        dueDate: dueDate || null,
      });

      res.status(201).json(task);
    } catch (err) {
      console.error('Create task error:', err.message);
      res.status(500).json({ message: 'Failed to create task' });
    }
  }
);

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('status').optional().isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status'),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const { title, description, priority, status, dueDate } = req.body;

      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (priority !== undefined) task.priority = priority;
      if (status !== undefined) task.status = status;
      if (dueDate !== undefined) task.dueDate = dueDate || null;

      await task.save();
      res.json(task);
    } catch (err) {
      if (err.name === 'CastError') {
        return res.status(404).json({ message: 'Task not found' });
      }
      console.error('Update task error:', err.message);
      res.status(500).json({ message: 'Failed to update task' });
    }
  }
);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Task not found' });
    }
    console.error('Delete task error:', err.message);
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

module.exports = router;
