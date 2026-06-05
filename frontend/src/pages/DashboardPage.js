import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

const StatCard = ({ icon, label, value, color, trend }) => (
  <div className={`stat-card stat-card--${color}`}>
    <div className="stat-card__icon" aria-hidden="true">{icon}</div>
    <div className="stat-card__content">
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      {trend && <p className="stat-card__trend">{trend}</p>}
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        api.get('/tasks/stats'),
        api.get('/tasks?limit=5&sortBy=createdAt&order=desc'),
      ]);
      setStats(statsRes.data);
      setRecentTasks(tasksRes.data.tasks);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getPriorityBadge = (priority) => {
    const map = { high: 'badge--danger', medium: 'badge--warning', low: 'badge--info' };
    return map[priority] || 'badge--info';
  };

  const getStatusBadge = (status) => {
    const map = { completed: 'badge--success', 'in-progress': 'badge--primary', pending: 'badge--secondary' };
    return map[status] || 'badge--secondary';
  };

  const formatDueDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(d);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, overdue: true };
    if (diff === 0) return { text: 'Due today', today: true };
    if (diff === 1) return { text: 'Due tomorrow', soon: true };
    return { text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
  };

  const completionRate = stats && stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  if (loading) {
    return (
      <div className="page-loading" aria-busy="true" aria-label="Loading dashboard">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="page-subtitle">Here's what's happening with your tasks today.</p>
        </div>
        <Link to="/tasks" className="btn btn--primary">
          + New Task
        </Link>
      </div>

      {/* Stats Grid */}
      <section aria-label="Task statistics">
        <div className="stats-grid">
          <StatCard icon="📋" label="Total Tasks" value={stats?.total ?? 0} color="default" />
          <StatCard icon="⏳" label="Pending" value={stats?.pending ?? 0} color="warning" />
          <StatCard icon="🔄" label="In Progress" value={stats?.inProgress ?? 0} color="info" />
          <StatCard icon="✅" label="Completed" value={stats?.completed ?? 0} color="success" />
          <StatCard icon="🔥" label="High Priority" value={stats?.highPriority ?? 0} color="danger" />
          <StatCard icon="⚠️" label="Overdue" value={stats?.overdue ?? 0} color="overdue" />
        </div>
      </section>

      {/* Progress + Recent Tasks */}
      <div className="dashboard-grid">
        {/* Completion Progress */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Overall Progress</h2>
          </div>
          <div className="card__body">
            <div className="progress-section">
              <div className="progress-info">
                <span className="progress-label">Task Completion Rate</span>
                <span className="progress-value">{completionRate}%</span>
              </div>
              <div className="progress-bar" role="progressbar" aria-valuenow={completionRate} aria-valuemin="0" aria-valuemax="100">
                <div
                  className="progress-bar__fill"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <p className="progress-detail">
                {stats?.completed ?? 0} of {stats?.total ?? 0} tasks completed
              </p>
            </div>

            <div className="breakdown-list">
              {[
                { label: 'Pending', value: stats?.pending ?? 0, color: 'warning' },
                { label: 'In Progress', value: stats?.inProgress ?? 0, color: 'info' },
                { label: 'Completed', value: stats?.completed ?? 0, color: 'success' },
              ].map(({ label, value, color }) => (
                <div className="breakdown-item" key={label}>
                  <div className="breakdown-item__left">
                    <span className={`breakdown-dot breakdown-dot--${color}`} aria-hidden="true" />
                    <span className="breakdown-item__label">{label}</span>
                  </div>
                  <span className="breakdown-item__value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Recent Tasks</h2>
            <Link to="/tasks" className="card__action">View all →</Link>
          </div>
          <div className="card__body">
            {recentTasks.length === 0 ? (
              <div className="empty-state empty-state--sm">
                <span aria-hidden="true">📝</span>
                <p>No tasks yet</p>
                <Link to="/tasks" className="btn btn--primary btn--sm">Create your first task</Link>
              </div>
            ) : (
              <ul className="recent-task-list" aria-label="Recent tasks">
                {recentTasks.map((task) => {
                  const due = formatDueDate(task.dueDate);
                  return (
                    <li key={task._id} className="recent-task-item">
                      <div className="recent-task__top">
                        <span className="recent-task__title">{task.title}</span>
                        <span className={`badge ${getStatusBadge(task.status)}`}>
                          {task.status.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="recent-task__meta">
                        <span className={`badge badge--sm ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                        {due && (
                          <span className={`due-label ${due.overdue ? 'due-label--overdue' : due.today ? 'due-label--today' : ''}`}>
                            📅 {due.text}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
};

export default DashboardPage;
