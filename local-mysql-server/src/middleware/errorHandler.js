const errorHandler = (error, req, res, next) => {
    console.error('Unhandled error:', error);

    res.status(error.status || 500).json({
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
        path: req.path
    });
};

module.exports = errorHandler;