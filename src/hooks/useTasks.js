import { useState, useCallback } from 'react';
import api from '../services/api';

export const useTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadTasks = useCallback(async (projectId) => {
        if (!projectId) return;
        
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/tasks?project=${projectId}`);
            setTasks(response.data);
        } catch (err) {
            setError(err.message);
            console.error('Error loading tasks:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createTask = useCallback(async (taskData) => {
        try {
            setLoading(true);
            const response = await api.post('/tasks', taskData);
            setTasks(prev => [...prev, response.data]);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateTask = useCallback(async (taskId, updateData) => {
        try {
            setLoading(true);
            const response = await api.put(`/tasks/${taskId}`, updateData);
            setTasks(prev => 
                prev.map(task => 
                    task.gid === taskId ? { ...task, ...response.data } : task
                )
            );
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteTask = useCallback(async (taskId) => {
        try {
            setLoading(true);
            await api.delete(`/tasks/${taskId}`);
            setTasks(prev => prev.filter(task => task.gid !== taskId));
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleComplete = useCallback(async (taskId, completed) => {
        try {
            setLoading(true);
            await api.put(`/tasks/${taskId}/toggle`, { completed });
            setTasks(prev => 
                prev.map(task => 
                    task.gid === taskId ? { ...task, completed } : task
                )
            );
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        tasks,
        loading,
        error,
        setTasks,
        loadTasks,
        createTask,
        updateTask,
        deleteTask,
        toggleComplete
    };
};
