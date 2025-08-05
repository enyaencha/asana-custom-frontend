import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [workspaces, setWorkspaces] = useState([]);
    const [workspaceUsers, setWorkspaceUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadUserData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [userData, workspacesData] = await Promise.all([
                api.get('/users/me'),
                api.get('/workspaces')
            ]);

            setUser(userData.data);
            setWorkspaces(workspacesData.data);

            // Load workspace users from first workspace
            if (workspacesData.data.length > 0) {
                const workspaceId = workspacesData.data[0].gid;
                const usersData = await api.get(`/workspaces/${workspaceId}/users`);
                setWorkspaceUsers(usersData.data);
            }
        } catch (err) {
            setError(err.message);
            console.error('Error loading user data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    return {
        user,
        workspaces,
        workspaceUsers,
        loading,
        error,
        loadUserData,
        setError
    };
};
