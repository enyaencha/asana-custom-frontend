import { useState, useCallback } from 'react';
import api from '../services/api';

export const useProjects = (workspaceId) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadProjects = useCallback(async () => {
        if (!workspaceId) return;
        
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/projects?workspace=${workspaceId}`);
            setProjects(response.data);
        } catch (err) {
            setError(err.message);
            console.error('Error loading projects:', err);
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    const createProject = useCallback(async (projectData) => {
        try {
            setLoading(true);
            const response = await api.post('/projects', projectData);
            setProjects(prev => [...prev, response.data]);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateProject = useCallback(async (projectId, updateData) => {
        try {
            setLoading(true);
            const response = await api.put(`/projects/${projectId}`, updateData);
            setProjects(prev => 
                prev.map(project => 
                    project.gid === projectId ? { ...project, ...response.data } : project
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

    const deleteProject = useCallback(async (projectId) => {
        try {
            setLoading(true);
            await api.delete(`/projects/${projectId}`);
            setProjects(prev => prev.filter(project => project.gid !== projectId));
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        projects,
        loading,
        error,
        setProjects,
        loadProjects,
        createProject,
        updateProject,
        deleteProject
    };
};
