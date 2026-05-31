'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface AgentEvent {
    id: string;
    type: 'text' | 'tool_call' | 'tool_result' | 'state_delta' | 'interrupt' | 'reasoning';
    content: string;
    timestamp: number;
    agentId?: string;
    toolName?: string;
    data?: Record<string, unknown>;
}

export interface AgentActivityState {
    isConnected: boolean;
    events: AgentEvent[];
    lastEventTime: number | null;
    error: string | null;
}

interface UseAgentActivityOptions {
    agentId?: string;
    onEvent?: (event: AgentEvent) => void;
    maxEvents?: number;
}

export function useAgentActivity(options: UseAgentActivityOptions = {}) {
    const { agentId = 'primary', onEvent, maxEvents = 100 } = options;
    
    const [state, setState] = useState<AgentActivityState>({
        isConnected: false,
        events: [],
        lastEventTime: null,
        error: null,
    });
    
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const connect = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        const eventSourceUrl = `/api/agents/${agentId}/stream`;
        
        try {
            const eventSource = new EventSource(eventSourceUrl);
            eventSourceRef.current = eventSource;

            eventSource.onopen = function() {
                setState(function(prev) {
                    return {
                        ...prev,
                        isConnected: true,
                        error: null,
                    };
                });
            };

            eventSource.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    const agentEvent: AgentEvent = {
                        id: data.id || crypto.randomUUID(),
                        type: data.type || 'text',
                        content: data.content || data.text || '',
                        timestamp: data.timestamp || Date.now(),
                        agentId: data.agentId,
                        toolName: data.toolName,
                        data: data.data,
                    };

                    setState(function(prev) {
                        return {
                            ...prev,
                            events: [agentEvent, ...prev.events].slice(0, maxEvents),
                            lastEventTime: agentEvent.timestamp,
                        };
                    });

                    onEvent?.(agentEvent);
                } catch (e) {
                    console.error('[AG-UI] Failed to parse event:', e);
                }
            };

            eventSource.onerror = function() {
                setState(function(prev) {
                    return {
                        ...prev,
                        isConnected: false,
                        error: 'Connection lost',
                    };
                });

                eventSource.close();
                
                reconnectTimeoutRef.current = setTimeout(function() {
                    connect();
                }, 5000);
            };
        } catch (error) {
            setState(function(prev) {
                return {
                    ...prev,
                    isConnected: false,
                    error: error instanceof Error ? error.message : 'Connection failed',
                };
            });
        }
    }, [agentId, maxEvents, onEvent]);

    const disconnect = useCallback(function() {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        setState({
            isConnected: false,
            events: [],
            lastEventTime: null,
            error: null,
        });
    }, []);

    const clearEvents = useCallback(function() {
        setState(function(prev) {
            return {
                ...prev,
                events: [],
                lastEventTime: null,
            };
        });
    }, []);

    useEffect(function() {
        return function() {
            disconnect();
        };
    }, [disconnect]);

    return {
        ...state,
        connect,
        disconnect,
        clearEvents,
    };
}
