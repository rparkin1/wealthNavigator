/**
 * Hedge Education Panel Component
 * Educational content about hedging strategies
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpenIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  BoltIcon,
  AcademicCapIcon,
  FlagIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  getHedgingEducation,
  getHedgingEducationTopic,
} from '../../services/hedgingStrategiesApi';
import type { HedgingEducationContent, HedgingEducationTopic } from '../../types/hedgingStrategies';

export const HedgeEducationPanel: React.FC = () => {
  const [content, setContent] = useState<HedgingEducationContent | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<HedgingEducationTopic | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'overview' | 'topic' | 'glossary'>('overview');

  useEffect(() => {
    loadEducationContent();
  }, []);

  const loadEducationContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getHedgingEducation();
      setContent(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load education content');
    } finally {
      setLoading(false);
    }
  };

  const loadTopic = async (topicId: string) => {
    try {
      setLoading(true);
      setError(null);
      const topic = await getHedgingEducationTopic(topicId);
      setSelectedTopic(topic);
      setView('topic');
    } catch (err: any) {
      setError(err.message || 'Failed to load topic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div
        style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpenIcon style={{ width: '28px', height: '28px', color: '#3b82f6' }} />
          Hedging Education Center
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
          Learn about hedging strategies, when to use them, and their trade-offs
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {(['overview', 'topic', 'glossary'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              disabled={tab === 'topic' && !selectedTopic}
              style={{
                padding: '8px 16px',
                backgroundColor: view === tab ? '#3b82f6' : '#f3f4f6',
                color: view === tab ? '#ffffff' : '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: tab === 'topic' && !selectedTopic ? 'not-allowed' : 'pointer',
                opacity: tab === 'topic' && !selectedTopic ? 0.5 : 1,
              }}
            >
              {tab === 'overview' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ClipboardDocumentListIcon style={{ width: '16px', height: '16px' }} />
                  Overview
                </span>
              )}
              {tab === 'topic' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DocumentTextIcon style={{ width: '16px', height: '16px' }} />
                  Topic
                </span>
              )}
              {tab === 'glossary' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpenIcon style={{ width: '16px', height: '16px' }} />
                  Glossary
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            Loading education content...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              borderRadius: '8px',
            }}
          >
            Error: {error}
          </div>
        )}

        {content && !loading && (
          <>
            {/* Overview */}
            {view === 'overview' && (
              <div>
                {/* Quick Reference */}
                <div
                  style={{
                    padding: '24px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '8px',
                    marginBottom: '24px',
                  }}
                >
                  <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BoltIcon style={{ width: '24px', height: '24px', color: '#eab308' }} />
                    Quick Reference
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {Object.entries(content.quick_reference).map(([key, value]) => (
                      <QuickRefItem key={key} label={key} value={value} />
                    ))}
                  </div>
                </div>

                {/* Topics */}
                <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AcademicCapIcon style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                  Educational Topics
                </h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {content.topics.map((topic, index) => (
                    <TopicCard
                      key={index}
                      topic={topic}
                      onClick={() => {
                        setSelectedTopic(topic);
                        setView('topic');
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Topic Detail */}
            {view === 'topic' && selectedTopic && (
              <div>
                <button
                  onClick={() => setView('overview')}
                  style={{
                    marginBottom: '16px',
                    padding: '8px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  ← Back to Overview
                </button>

                <div
                  style={{
                    padding: '24px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <h2 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 700 }}>
                    {selectedTopic.title}
                  </h2>

                  <div
                    style={{
                      fontSize: '15px',
                      lineHeight: '1.7',
                      color: '#374151',
                      marginBottom: '24px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selectedTopic.content}
                  </div>

                  {/* Key Points */}
                  <Section title="Key Points" icon={<FlagIcon style={{ width: '20px', height: '20px', color: '#3b82f6' }} />}>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {selectedTopic.key_points.map((point, index) => (
                        <li key={index} style={{ marginBottom: '8px', fontSize: '14px', color: '#059669' }}>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </Section>

                  {/* Examples */}
                  {selectedTopic.examples.length > 0 && (
                    <Section title="Examples" icon={<LightBulbIcon style={{ width: '20px', height: '20px', color: '#eab308' }} />}>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {selectedTopic.examples.map((example, index) => (
                          <div
                            key={index}
                            style={{
                              padding: '12px',
                              backgroundColor: '#f9fafb',
                              borderRadius: '6px',
                              fontSize: '14px',
                              color: '#374151',
                            }}
                          >
                            {example}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Common Mistakes */}
                  {selectedTopic.common_mistakes.length > 0 && (
                    <Section title="Common Mistakes to Avoid" icon={<ExclamationTriangleIcon style={{ width: '20px', height: '20px', color: '#ef4444' }} />}>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {selectedTopic.common_mistakes.map((mistake, index) => (
                          <li key={index} style={{ marginBottom: '8px', fontSize: '14px', color: '#dc2626' }}>
                            {mistake}
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}
                </div>
              </div>
            )}

            {/* Glossary */}
            {view === 'glossary' && (
              <div>
                <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpenIcon style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                  Hedging Glossary
                </h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {Object.entries(content.glossary).map(([term, definition]) => (
                    <GlossaryItem key={term} term={term} definition={definition} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const QuickRefItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    style={{
      padding: '12px',
      backgroundColor: '#ffffff',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
    }}
  >
    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 500 }}>
      {label}
    </div>
    <div style={{ fontSize: '14px', color: '#111827' }}>{value}</div>
  </div>
);

const TopicCard: React.FC<{ topic: HedgingEducationTopic; onClick: () => void }> = ({ topic, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = '#3b82f6';
      e.currentTarget.style.backgroundColor = '#eff6ff';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = '#e5e7eb';
      e.currentTarget.style.backgroundColor = '#ffffff';
    }}
  >
    <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
      {topic.title}
    </div>
    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
      {topic.content.slice(0, 150)}...
    </div>
    <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 500 }}>
      Read more →
    </div>
  </div>
);

const GlossaryItem: React.FC<{ term: string; definition: string }> = ({ term, definition }) => (
  <div
    style={{
      padding: '16px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
    }}
  >
    <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
      {term}
    </div>
    <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>{definition}</div>
  </div>
);

const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div style={{ marginTop: '24px' }}>
    <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {icon}
      {title}
    </h3>
    {children}
  </div>
);

export default HedgeEducationPanel;
