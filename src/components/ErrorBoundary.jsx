import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null 
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log to external service in production
        if (process.env.NODE_ENV === 'production') {
            // logErrorToService(error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8f9fa',
                    padding: '2rem'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '3rem',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        maxWidth: '600px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💥</div>
                        <h2 style={{
                            color: '#e53e3e',
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            marginBottom: '1rem'
                        }}>
                            Oops! Something went wrong
                        </h2>
                        <p style={{
                            color: '#718096',
                            marginBottom: '2rem',
                            lineHeight: '1.6'
                        }}>
                            The application encountered an unexpected error. Don't worry, 
                            your data is safe. Please try refreshing the page.
                        </p>
                        
                        <div style={{ marginBottom: '2rem' }}>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    backgroundColor: '#3182ce',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 2rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    marginRight: '1rem'
                                }}
                            >
                                🔄 Reload Page
                            </button>
                            <button
                                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                                style={{
                                    backgroundColor: '#48bb78',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 2rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                🔄 Try Again
                            </button>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <details style={{
                                backgroundColor: '#f7fafc',
                                padding: '1rem',
                                borderRadius: '6px',
                                textAlign: 'left',
                                marginTop: '1rem'
                            }}>
                                <summary style={{ 
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    marginBottom: '0.5rem'
                                }}>
                                    🐛 Error Details (Development)
                                </summary>
                                <pre style={{
                                    fontSize: '0.875rem',
                                    color: '#e53e3e',
                                    overflow: 'auto',
                                    marginTop: '0.5rem'
                                }}>
                                    {this.state.error && this.state.error.toString()}
                                    <br />
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
