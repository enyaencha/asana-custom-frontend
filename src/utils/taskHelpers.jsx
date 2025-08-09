// utils/taskHelpers.jsx
export const extractCustomFieldValue = (task, fieldName) => {
    const field = task.custom_fields?.find(f => f.name === fieldName);
    return field?.enum_value?.name || field?.display_value || null;
};

export const extractPriority = (task) => {
    const priority = extractCustomFieldValue(task, "Priority");
    return priority?.toLowerCase() || null;
};

export const extractTaskProgress = (task) => {
    return extractCustomFieldValue(task, "Task Progress");
};