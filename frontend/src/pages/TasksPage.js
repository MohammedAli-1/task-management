import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import TaskModal from '../components/TaskModal';
import DeleteModal from '../components/DeleteModal';
import './TasksPage.css';

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Title' },
];

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    sortBy: 'createdAt',
    order: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const searchTimerRef = useRef(null);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchTasks = useCallback(async (currentFilters, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFilters.search) params.set('search', currentFilters.search);
      if (currentFilters.status) params.set('status', currentFilters.status);
      if (currentFilters.priority) params.set('priority', currentFilters.priority);
      params.set('sortBy', currentFilters.sortBy);
      params.set('order', currentFilters.order);
      params.set('page', page);
      params.set('limit', 12);

      const res = await api.get(`/tasks?${params.toString()}`);
      setTasks(res.data.tasks);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks(filters, 1);
  }, [fetchTasks, filters]);

  // Debounce search input
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
    }, 400);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ search: '', status: '', priority: '', sortBy: 'createdAt', order: 'desc' });
  };

  const hasActiveFilters = filters.search || filters.status || filters.priority;

  // Quick status toggle
  const handleStatusToggle = async (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.put(`/tasks/${task._id}`, { status: nextStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: nextStatus } : t))
      );
      toast.success(`Task marked as ${nextStatus}`);
    } catch {
      toast.error('Failed to update task status');
    }
  };

  // Save (create or update)
  const handleSaveTask = async (data) => {
    try {
      if (editingTask) {
        const res = await api.put(`/tasks/${editingTask._id}`, data);
        setTasks((prev) =>
          prev.map((t) => (t._id === editingTask._id ? res.data : t))
        );
        toast.success('Task updated');
      } else {
        await api.post('/tasks', data);
        toast.success('Task created');
        fetchTasks(filters, 1);
      }
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/tasks/${deleteTarget._id}`);
      setTasks((prev) => prev.filter((t) => t._id !== deleteTarget._id));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setDeleteTarget(null);
    }
  };

  const openCreate = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const getPriorityClass = (priority) => {
    const map = { high: 'badge--danger', medium: 'badge--warning', low: 'badge--info' };
    return map[priority] || '';
  };

  const getStatusClass = (status) => {
    const map = { completed: 'badge--success', 'in-progress': 'badge--primary', pending: 'badge--secondary' };
    return map[status] || '';
  };

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(d);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    let label = '';
    if (diff < 0) label = `overdue`;
    else if (diff === 0) label = 'today';
    else if (diff === 1) label = 'tomorrow';
    return { formatted, overdue: diff < 0, today: diff === 0, soon: diff === 1, label };
  };

  return (
    <div className="tasks-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">
            {pagination.total} task{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <button className="btn btn--primary" onClick={openCreate} aria-label="Create new task">
          + New Task
        </button>
      </div>

      {/* Filters toolbar */}
      <div className="filters-bar" role="search" aria-label="Filter tasks">
        <div className="search-box">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            className="search-input"
            placeholder="Search tasks..."
            value={searchInput}
            onChange={handleSearchChange}
            aria-label="Search tasks"
          />
          {searchInput && (
            <button
              className="search-clear"
              onClick={() => { setSearchInput(''); setFilters((p) => ({ ...p, search: '' })); }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-controls">
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            aria-label="Filter by priority"
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={`${filters.sortBy}-${filters.order}`}
            onChange={(e) => {
              const [sortBy, order] = e.target.value.split('-');
              setFilters((p) => ({ ...p, sortBy, order }));
            }}
            aria-label="Sort tasks"
          >
            {SORT_OPTIONS.map((o) => (
              <React.Fragment key={o.value}>
                <option value={`${o.value}-desc`}>{o.label} ↓</option>
                <option value={`${o.value}-asc`}>{o.label} ↑</option>
              </React.Fragment>
            ))}
          </select>

          {hasActiveFilters && (
            <button className="btn btn--secondary btn--sm" onClick={clearFilters} aria-label="Clear all filters">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="page-loading" aria-busy="true" aria-label="Loading tasks">
          <div className="spinner" />
          <p>Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <span aria-hidden="true">📭</span>
          <h3>{hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}</h3>
          <p>{hasActiveFilters ? 'Try adjusting your search or filters.' : 'Create your first task to get started.'}</p>
          {!hasActiveFilters && (
            <button className="btn btn--primary" onClick={openCreate}>
              + Create Task
            </button>
          )}
          {hasActiveFilters && (
            <button className="btn btn--secondary btn--sm" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="task-grid" role="list" aria-label="Task list">
            {tasks.map((task) => {
              const due = formatDate(task.dueDate);
              const isCompleted = task.status === 'completed';
              return (
                <article
                  key={task._id}
                  className={`task-card ${isCompleted ? 'task-card--completed' : ''}`}
                  role="listitem"
                >
                  <div className="task-card__header">
                    <button
                      className={`task-check ${isCompleted ? 'task-check--done' : ''}`}
                      onClick={() => handleStatusToggle(task)}
                      aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                      title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                    >
                      {isCompleted ? '✓' : ''}
                    </button>
                    <div className="task-card__actions">
                      <button
                        className="action-btn action-btn--edit"
                        onClick={() => openEdit(task)}
                        aria-label={`Edit task: ${task.title}`}
                        title="Edit task"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn action-btn--delete"
                        onClick={() => setDeleteTarget(task)}
                        aria-label={`Delete task: ${task.title}`}
                        title="Delete task"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <h3 className={`task-card__title ${isCompleted ? 'task-card__title--done' : ''}`}>
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="task-card__desc">{task.description}</p>
                  )}

                  <div className="task-card__footer">
                    <div className="task-card__badges">
                      <span className={`badge badge--sm ${getPriorityClass(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`badge badge--sm ${getStatusClass(task.status)}`}>
                        {task.status.replace('-', ' ')}
                      </span>
                    </div>
                    {due && (
                      <span
                        className={`task-due ${due.overdue ? 'task-due--overdue' : due.today ? 'task-due--today' : ''}`}
                        title={due.label ? `Due ${due.label}` : ''}
                      >
                        📅 {due.formatted}
                        {due.label && <span className="task-due__label"> ({due.label})</span>}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination" role="navigation" aria-label="Pagination">
              <button
                className="btn btn--secondary btn--sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchTasks(filters, pagination.page - 1)}
                aria-label="Previous page"
              >
                ← Prev
              </button>
              <span className="pagination__info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="btn btn--secondary btn--sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchTasks(filters, pagination.page + 1)}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          onSave={handleSaveTask}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          taskTitle={deleteTarget.title}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default TasksPage;
