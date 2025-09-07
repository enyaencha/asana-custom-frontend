const validateProject = (data) => {
    const { name, workspace } = data;

    if (!name || !workspace) {
        throw new Error('Project name and workspace are required');
    }

    return true;
};

const validateTask = (data) => {
    const { name, projects } = data;

    if (!name || !projects) {
        throw new Error('Task name and projects are required');
    }

    return true;
};

const validateSyncSettings = (data) => {
    const { enabled, delayCreate, delayUpdate, batchSize, retryEnabled } = data;

    if (delayCreate && (delayCreate < 0 || delayCreate > 60000)) {
        throw new Error('Create delay must be between 0 and 60000ms');
    }

    if (delayUpdate && (delayUpdate < 0 || delayUpdate > 60000)) {
        throw new Error('Update delay must be between 0 and 60000ms');
    }

    if (batchSize && (batchSize < 1 || batchSize > 100)) {
        throw new Error('Batch size must be between 1 and 100');
    }

    return true;
};

module.exports = {
    validateProject,
    validateTask,
    validateSyncSettings
};