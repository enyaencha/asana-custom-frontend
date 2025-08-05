import { useQuery } from '@tanstack/react-query';
import { userApi, projectApi } from '../services/asanaApi';

// User and workspace hooks
export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: userApi.getMe,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useWorkspaces = () => {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: userApi.getWorkspaces,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Project hooks
export const useProjects = (workspaceId) => {
  return useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => projectApi.getProjects(workspaceId),
    enabled: !!workspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
