/**
 * Reserve Alerts Panel Component
 * Display priority-sorted alerts with actionable recommendations
 *
 * REQ-RISK-012: Reserve alert notifications
 */

import React, { useState } from 'react';
import type { ReserveAlert } from '../../types/reserveMonitoring';

export interface ReserveAlertsPanelProps {
  alerts: ReserveAlert[];
  compact?: boolean;
  maxVisible?: number;
  onAlertClick?: (alert: ReserveAlert) => void;
}

export const ReserveAlertsPanel: React.FC<ReserveAlertsPanelProps> = ({
  alerts,
  compact = false,
  maxVisible,
  onAlertClick,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const sortedAlerts = [...alerts].sort((a, b) => a.priority - b.priority);
  const visibleAlerts = maxVisible && !showAll ? sortedAlerts.slice(0, maxVisible) : sortedAlerts;
  const hasMore = maxVisible && sortedAlerts.length > maxVisible && !showAll;

  const getSeverityColor = (severity: string): string => {
    const colors = {
      critical: '#ef4444',
      warning: '#f97316',
      info: '#3b82f6',
    };
    return colors[severity as keyof typeof colors] || '#6b7280';
  };

  const getSeverityBackground = (severity: string): string => {
    const backgrounds = {
      critical: '#fef2f2',
      warning: '#fff7ed',
      info: '#eff6ff',
    };
    return backgrounds[severity as keyof typeof backgrounds] || '#f9fafb';
  };

  const getSeverityIcon = (severity: string): string => {
    const icons = {
      critical: '🚨',
      warning: '⚠️',
      info: '💡',
    };
    return icons[severity as keyof typeof icons] || 'ℹ️';
  };

  const getPriorityLabel = (priority: number): string => {
    if (priority === 1) return 'URGENT';
    if (priority === 2) return 'HIGH';
    if (priority === 3) return 'MEDIUM';
    if (priority === 4) return 'LOW';
    return 'INFO';
  };

  const handleAlertClick = (alert: ReserveAlert, index: number) => {
    if (compact) {
      setExpandedIndex(expandedIndex === index ? null : index);
    }
    onAlertClick?.(alert);
  };

  if (alerts.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          backgroundColor: '#ecfdf5',
          borderRadius: '8px',
          border: '1px solid #10b981',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#059669' }}>
          No Active Alerts
        </div>
        <div style={{ fontSize: '14px', color: '#047857', marginTop: '4px' }}>
          Your emergency fund is in good shape
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
          Active Alerts ({alerts.length})
        </h3>
        {hasMore && (
          <button
            onClick={() => setShowAll(true)}
            style={{
              padding: '4px 12px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#3b82f6',
              backgroundColor: 'transparent',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Show All
          </button>
        )}
      </div>

      {/* Alerts List */}
      <div style={{ display: 'grid', gap: compact ? '8px' : '12px' }}>
        {visibleAlerts.map((alert, index) => {
          const isExpanded = expandedIndex === index;
          const shouldShowDetails = !compact || isExpanded;

          return (
            <div
              key={index}
              onClick={() => handleAlertClick(alert, index)}
              style={{
                padding: compact ? '12px' : '16px',
                backgroundColor: getSeverityBackground(alert.severity),
                borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                borderRadius: '8px',
                cursor: compact ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}
            >
              {/* Alert Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '20px' }}>{getSeverityIcon(alert.severity)}</span>
                    <div
                      style={{
                        fontSize: compact ? '14px' : '16px',
                        fontWeight: 600,
                        color: '#111827',
                      }}
                    >
                      {alert.title}
                    </div>
                  </div>

                  {/* Message */}
                  {shouldShowDetails && (
                    <>
                      <div
                        style={{
                          fontSize: compact ? '13px' : '14px',
                          color: '#374151',
                          marginBottom: '12px',
                          lineHeight: '1.5',
                        }}
                      >
                        {alert.message}
                      </div>

                      {/* Action Required */}
                      <div
                        style={{
                          padding: '12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          borderRadius: '6px',
                          fontSize: compact ? '13px' : '14px',
                          fontWeight: 500,
                          color: getSeverityColor(alert.severity),
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Action Required:</div>
                        {alert.action_required}
                      </div>
                    </>
                  )}
                </div>

                {/* Priority Badge */}
                <div
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: getSeverityColor(alert.severity),
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getPriorityLabel(alert.priority)}
                </div>
              </div>

              {/* Expand/Collapse Indicator */}
              {compact && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#6b7280',
                    textAlign: 'center',
                  }}
                >
                  {isExpanded ? '▲ Click to collapse' : '▼ Click to expand'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      {!compact && alerts.length > 1 && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-around',
            fontSize: '14px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: '#ef4444' }}>
              {alerts.filter(a => a.severity === 'critical').length}
            </div>
            <div style={{ color: '#6b7280' }}>Critical</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: '#f97316' }}>
              {alerts.filter(a => a.severity === 'warning').length}
            </div>
            <div style={{ color: '#6b7280' }}>Warning</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: '#3b82f6' }}>
              {alerts.filter(a => a.severity === 'info').length}
            </div>
            <div style={{ color: '#6b7280' }}>Info</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReserveAlertsPanel;
