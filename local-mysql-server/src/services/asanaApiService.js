const axios = require('axios');
const { MAIN_SERVER_URL } = require('../config/server');

class AsanaApiService {
    static async isMainServerOnline() {
        try {
            const response = await axios.get(`${MAIN_SERVER_URL}/health`, { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            console.log('Main server offline:', error.message);
            return false;
        }
    }

    static async createProject(projectData) {
        const response = await axios.post(`${MAIN_SERVER_URL}/projects`, projectData, {
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data.data || response.data;
    }

    static async createTask(taskData) {
        const response = await axios.post(`${MAIN_SERVER_URL}/tasks`, taskData, {
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data.data || response.data;
    }

    static async updateResource(resourceType, resourceId, data) {
        const response = await axios.put(`${MAIN_SERVER_URL}/${resourceType}s/${resourceId}`, data, {
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    }

    static async deleteResource(resourceType, resourceId) {
        await axios.delete(`${MAIN_SERVER_URL}/${resourceType}s/${resourceId}`, {
            timeout: 30000
        });
    }
}

module.exports = AsanaApiService;