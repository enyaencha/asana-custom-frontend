const JsonUtils = {
    safeStringify: (obj, defaultValue = '{}') => {
        if (obj === null || obj === undefined) {
            return defaultValue;
        }

        if (typeof obj === 'string') {
            if (obj.includes('[object Object]') || obj === '[object Object]') {
                console.warn('Found [object Object] in string, using default:', defaultValue);
                return defaultValue;
            }

            try {
                JSON.parse(obj);
                return obj;
            } catch (e) {
                console.warn('Invalid JSON string, using default:', obj.substring(0, 100));
                return defaultValue;
            }
        }

        if (typeof obj === 'object') {
            try {
                JSON.stringify(obj);
                return JSON.stringify(obj);
            } catch (e) {
                console.error('Failed to stringify object:', e.message);
                return defaultValue;
            }
        }

        try {
            return JSON.stringify(obj);
        } catch (e) {
            console.error('Failed to stringify value:', e.message);
            return defaultValue;
        }
    },

    safeParse: (jsonString, defaultValue = {}) => {
        if (!jsonString || jsonString === '' || jsonString === '[]' || jsonString === '{}') {
            return defaultValue;
        }

        if (typeof jsonString === 'object' && jsonString !== null) {
            return jsonString;
        }

        if (typeof jsonString === 'string') {
            if (jsonString.includes('[object Object]') || jsonString === '[object Object]') {
                console.warn('Found [object Object] in JSON field, using default');
                return defaultValue;
            }

            try {
                const parsed = JSON.parse(jsonString);
                return parsed;
            } catch (parseError) {
                console.warn('JSON parse error:', parseError.message, 'Raw value:', jsonString.substring(0, 100));
                return defaultValue;
            }
        }

        return defaultValue;
    },

    ensureJsonString: (value, defaultValue = '{}') => {
        if (typeof value === 'string') {
            try {
                JSON.parse(value);
                return value;
            } catch (e) {
                if (value.includes('[object Object]')) {
                    return defaultValue;
                }
                try {
                    return JSON.stringify(value);
                } catch (e2) {
                    return defaultValue;
                }
            }
        }

        return JsonUtils.safeStringify(value, defaultValue);
    }
};

module.exports = JsonUtils;