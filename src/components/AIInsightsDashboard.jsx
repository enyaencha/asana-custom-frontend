import React, { useState, useEffect } from 'react';

const AIInsightsDashboard = ({ workspace, onRefresh }) => {
    const [insights, setInsights] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, [workspace]);

    // Simulate API calls to your server
    const fetchInsights = async (workspaceId) => {
        const response = await fetch(`http://localhost:3001/api/ai/insights?workspace=${workspaceId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch insights: ${response.statusText}`);
        }
        return response.json();
    };

    const fetchAnalytics = async (workspaceId) => {
        const response = await fetch(`http://localhost:3001/api/analytics/dashboard?workspace=${workspaceId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch analytics: ${response.statusText}`);
        }
        return response.json();
    };

    const loadData = async () => {
        // If no workspace provided, show placeholder data
        if (!workspace?.gid) {
            console.log('No workspace available, using sample data');
            setInsights([
                {
                    id: 1,
                    type: 'productivity',
                    title: 'Connect Your Workspace',
                    description: 'Connect your Asana workspace to see real AI insights based on your actual projects and tasks.',
                    priority: 'medium',
                    category: 'setup'
                }
            ]);
            setAnalytics({
                totalProjects: 0,
                activeProjects: 0,
                completedTasks: 0,
                pendingTasks: 0,
                overdueTasks: 0,
                teamMembers: 0,
                productivityScore: 0,
                weeklyProgress: Array.from({ length: 7 }, (_, i) => ({
                    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
                    completed: 0,
                    created: 0
                })),
                tasksByPriority: [
                    { priority: 'High', count: 0 },
                    { priority: 'Medium', count: 0 },
                    { priority: 'Low', count: 0 }
                ],
                projectProgress: []
            });
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Loading AI data for workspace:', workspace.gid);

            const [insightsResponse, analyticsResponse] = await Promise.all([
                fetchInsights(workspace.gid),
                fetchAnalytics(workspace.gid)
            ]);

            console.log('AI Insights loaded:', insightsResponse);
            console.log('Analytics loaded:', analyticsResponse);

            setInsights(insightsResponse.data || []);
            setAnalytics(analyticsResponse.data);
        } catch (error) {
            console.error('Error loading AI data:', error);
            setError(error.message || 'Failed to load AI insights');

            // Fallback to sample data if API fails
            setInsights([
                {
                    id: 1,
                    type: 'error',
                    title: 'Unable to Load Real Data',
                    description: `Error: ${error.message}. Make sure your server is running and workspace is properly configured.`,
                    priority: 'high',
                    category: 'system'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return '#e53e3e';
            case 'medium': return '#ed8936';
            case 'low': return '#48bb78';
            default: return '#718096';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'performance': return '📈';
            case 'team': return '👥';
            case 'deadlines': return '⏰';
            case 'workload': return '⚖️';
            case 'setup': return '🔧';
            case 'system': return '⚠️';
            default: return '💡';
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
                <p style={{ fontSize: '1.25rem', color: '#666' }}>
                    AI is analyzing your workspace data...
                </p>
                {workspace?.name && (
                    <p style={{ fontSize: '0.875rem', color: '#a0aec0' }}>
                        Analyzing "{workspace.name}"
                    </p>
                )}
            </div>
        );
    }

    if (error && insights.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <h3 style={{ color: '#e53e3e', marginBottom: '1rem' }}>Error Loading AI Insights</h3>
                <p style={{ color: '#666', marginBottom: '2rem' }}>{error}</p>
                <button
                    onClick={loadData}
                    style={{
                        backgroundColor: '#3182ce',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    🔄 Retry
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem' }}>
            <h2 style={{
                margin: '0 0 2rem 0',
                fontSize: '2rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                🤖 AI Insights & Analytics
                {workspace?.name && (
                    <span style={{ fontSize: '1rem', color: '#718096', fontWeight: '400' }}>
            for {workspace.name}
          </span>
                )}
            </h2>

            {/* Analytics Overview */}
            {analytics && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                        <div style={{ fontSize: '2rem', fontWeight: '600', color: '#3182ce' }}>
                            {analytics.totalProjects}
                        </div>
                        <div style={{ color: '#718096' }}>Total Projects</div>
                    </div>

                    <div style={{
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                        <div style={{ fontSize: '2rem', fontWeight: '600', color: '#48bb78' }}>
                            {analytics.completedTasks}
                        </div>
                        <div style={{ color: '#718096' }}>Completed Tasks</div>
                    </div>

                    <div style={{
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                        <div style={{ fontSize: '2rem', fontWeight: '600', color: '#ed8936' }}>
                            {analytics.pendingTasks}
                        </div>
                        <div style={{ color: '#718096' }}>Pending Tasks</div>
                    </div>

                    <div style={{
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚨</div>
                        <div style={{ fontSize: '2rem', fontWeight: '600', color: '#e53e3e' }}>
                            {analytics.overdueTasks}
                        </div>
                        <div style={{ color: '#718096' }}>Overdue Tasks</div>
                    </div>

                    <div style={{
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                        <div style={{ fontSize: '2rem', fontWeight: '600', color: '#805ad5' }}>
                            {analytics.teamMembers}
                        </div>
                        <div style={{ color: '#718096' }}>Team Members</div>
                    </div>

                    <div style={{
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
                        <div style={{ fontSize: '2rem', fontWeight: '600', color: '#38a169' }}>
                            {analytics.productivityScore}%
                        </div>
                        <div style={{ color: '#718096' }}>Productivity Score</div>
                    </div>
                </div>
            )}

            {/* AI Insights */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    💡 AI Insights
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {insights.map(insight => (
                        <div
                            key={insight.id}
                            style={{
                                backgroundColor: 'white',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                borderLeft: `4px solid ${getPriorityColor(insight.priority)}`,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '0.75rem'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {getCategoryIcon(insight.category)}
                  </span>
                                    <h4 style={{
                                        margin: 0,
                                        fontSize: '1.125rem',
                                        fontWeight: '600',
                                        color: '#2d3748'
                                    }}>
                                        {insight.title}
                                    </h4>
                                </div>
                                <span style={{
                                    backgroundColor: `${getPriorityColor(insight.priority)}15`,
                                    color: getPriorityColor(insight.priority),
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    textTransform: 'uppercase'
                                }}>
                  {insight.priority}
                </span>
                            </div>

                            <p style={{
                                margin: 0,
                                color: '#4a5568',
                                lineHeight: '1.5'
                            }}>
                                {insight.description}
                            </p>

                            <div style={{
                                marginTop: '0.75rem',
                                fontSize: '0.875rem',
                                color: '#718096'
                            }}>
                                Category: {insight.category} • Type: {insight.type}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Charts Section */}
            {analytics && analytics.weeklyProgress && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '2rem',
                    marginBottom: '2rem'
                }}>
                    {/* Weekly Progress Chart */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <h4 style={{
                            margin: '0 0 1rem 0',
                            fontSize: '1.25rem',
                            fontWeight: '600'
                        }}>
                            📊 Weekly Progress
                        </h4>
                        <div style={{
                            display: 'flex',
                            alignItems: 'end',
                            gap: '0.5rem',
                            height: '200px',
                            padding: '1rem 0'
                        }}>
                            {analytics.weeklyProgress.map((day, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        flex: 1
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '2px',
                                        marginBottom: '0.5rem'
                                    }}>
                                        <div
                                            style={{
                                                backgroundColor: '#48bb78',
                                                width: '100%',
                                                height: `${Math.max(day.completed * 4, 2)}px`,
                                                borderRadius: '2px',
                                                minHeight: '2px'
                                            }}
                                            title={`Completed: ${day.completed}`}
                                        />
                                        <div
                                            style={{
                                                backgroundColor: '#ed8936',
                                                width: '100%',
                                                height: `${Math.max(day.created * 4, 2)}px`,
                                                borderRadius: '2px',
                                                minHeight: '2px'
                                            }}
                                            title={`Created: ${day.created}`}
                                        />
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: '#718096',
                                        fontWeight: '500'
                                    }}>
                    {day.day}
                  </span>
                                </div>
                            ))}
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '1rem',
                            fontSize: '0.875rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: '#48bb78',
                                    borderRadius: '2px'
                                }} />
                                Completed
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: '#ed8936',
                                    borderRadius: '2px'
                                }} />
                                Created
                            </div>
                        </div>
                    </div>

                    {/* Tasks by Priority */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <h4 style={{
                            margin: '0 0 1rem 0',
                            fontSize: '1.25rem',
                            fontWeight: '600'
                        }}>
                            🎯 Tasks by Priority
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {analytics.tasksByPriority.map((item, index) => {
                                const total = analytics.tasksByPriority.reduce((sum, p) => sum + p.count, 0);
                                const percentage = total > 0 ? (item.count / total) * 100 : 0;
                                const color = item.priority === 'High' ? '#e53e3e' :
                                    item.priority === 'Medium' ? '#ed8936' : '#48bb78';

                                return (
                                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            fontSize: '1rem',
                                            fontWeight: '500',
                                            minWidth: '60px'
                                        }}>
                                            {item.priority}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                width: '100%',
                                                height: '20px',
                                                backgroundColor: '#f7fafc',
                                                borderRadius: '10px',
                                                overflow: 'hidden'
                                            }}>
                                                <div
                                                    style={{
                                                        width: `${percentage}%`,
                                                        height: '100%',
                                                        backgroundColor: color,
                                                        borderRadius: '10px',
                                                        transition: 'width 0.3s ease'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: color,
                                            minWidth: '40px'
                                        }}>
                                            {item.count}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Project Progress */}
            {analytics && analytics.projectProgress && analytics.projectProgress.length > 0 && (
                <div style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                }}>
                    <h4 style={{
                        margin: '0 0 1rem 0',
                        fontSize: '1.25rem',
                        fontWeight: '600'
                    }}>
                        🚀 Project Progress
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {analytics.projectProgress.map((project, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px'
                            }}>
                                <div style={{
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    minWidth: '150px',
                                    color: '#2d3748'
                                }}>
                                    {project.project}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        width: '100%',
                                        height: '24px',
                                        backgroundColor: 'white',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div
                                            style={{
                                                width: `${project.progress}%`,
                                                height: '100%',
                                                background: `linear-gradient(90deg, #48bb78, #38a169)`,
                                                borderRadius: '12px',
                                                transition: 'width 0.3s ease'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    color: '#48bb78',
                                    minWidth: '50px',
                                    textAlign: 'right'
                                }}>
                                    {project.progress}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Refresh Button */}
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button
                    onClick={loadData}
                    style={{
                        backgroundColor: '#3182ce',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 2rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        margin: '0 auto'
                    }}
                >
                    🔄 Refresh AI Analysis
                </button>
            </div>
        </div>
    );
};

export default AIInsightsDashboard;