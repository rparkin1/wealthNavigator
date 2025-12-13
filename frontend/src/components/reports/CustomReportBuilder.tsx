/**
 * Custom Report Builder Component
 * REQ-REPORT-012: Customizable Reports with date ranges, metrics, filters
 *
 * Allows users to create custom reports by selecting:
 * - Date ranges
 * - Metrics to display
 * - Visualizations
 * - Filters (account, goal, asset class)
 * - Export formats
 * - Scheduled generation
 */

import React, { useState } from 'react';
import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ChartPieIcon,
  CircleStackIcon,
  FireIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Plus,
  Trash2,
  Save,
  Download,
  Calendar,
  Filter,
  Eye,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ==================== Types ====================

type ReportMetric =
  | 'total_return'
  | 'time_weighted_return'
  | 'money_weighted_return'
  | 'alpha'
  | 'beta'
  | 'sharpe_ratio'
  | 'volatility'
  | 'max_drawdown'
  | 'net_worth'
  | 'asset_allocation'
  | 'fees'
  | 'tax_liability'
  | 'goal_progress'
  | 'risk_score';

type VisualizationType =
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'area_chart'
  | 'scatter_plot'
  | 'heat_map'
  | 'table';

type FilterType = 'account' | 'goal' | 'asset_class' | 'date_range' | 'tag';

interface ReportFilter {
  filter_type: FilterType;
  values: string[];
}

interface ReportSection {
  section_id: string;
  title: string;
  metrics: ReportMetric[];
  visualization: VisualizationType;
  filters: ReportFilter[];
  order: number;
}

interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  day_of_week?: number;
  day_of_month?: number;
  time_of_day: string;
  timezone: string;
  enabled: boolean;
  email_recipients: string[];
}

interface CustomReportConfig {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  sections: ReportSection[];
  filters: ReportFilter[];
  schedule?: ReportSchedule;
  tags: string[];
}

// ==================== Constants ====================

const AVAILABLE_METRICS: Array<{ value: ReportMetric; label: string; category: string }> = [
  { value: 'total_return', label: 'Total Return', category: 'Performance' },
  { value: 'time_weighted_return', label: 'Time-Weighted Return', category: 'Performance' },
  { value: 'money_weighted_return', label: 'Money-Weighted Return', category: 'Performance' },
  { value: 'alpha', label: 'Alpha', category: 'Performance' },
  { value: 'beta', label: 'Beta', category: 'Risk' },
  { value: 'sharpe_ratio', label: 'Sharpe Ratio', category: 'Risk' },
  { value: 'volatility', label: 'Volatility', category: 'Risk' },
  { value: 'max_drawdown', label: 'Max Drawdown', category: 'Risk' },
  { value: 'net_worth', label: 'Net Worth', category: 'Wealth' },
  { value: 'asset_allocation', label: 'Asset Allocation', category: 'Portfolio' },
  { value: 'fees', label: 'Fees', category: 'Costs' },
  { value: 'tax_liability', label: 'Tax Liability', category: 'Taxes' },
  { value: 'goal_progress', label: 'Goal Progress', category: 'Goals' },
  { value: 'risk_score', label: 'Risk Score', category: 'Risk' },
];

const VISUALIZATIONS: Array<{ value: VisualizationType; label: string; icon: React.ReactNode }> = [
  { value: 'line_chart', label: 'Line Chart', icon: <ArrowTrendingUpIcon className="w-10 h-10" /> },
  { value: 'bar_chart', label: 'Bar Chart', icon: <ChartBarIcon className="w-10 h-10" /> },
  { value: 'pie_chart', label: 'Pie Chart', icon: <ChartPieIcon className="w-10 h-10" /> },
  { value: 'area_chart', label: 'Area Chart', icon: <ChartBarIcon className="w-10 h-10" /> },
  { value: 'scatter_plot', label: 'Scatter Plot', icon: <CircleStackIcon className="w-10 h-10" /> },
  { value: 'heat_map', label: 'Heat Map', icon: <FireIcon className="w-10 h-10" /> },
  { value: 'table', label: 'Table', icon: <TableCellsIcon className="w-10 h-10" /> },
];

// ==================== Component ====================

export function CustomReportBuilder() {
  const [reportConfig, setReportConfig] = useState<CustomReportConfig>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    sections: [],
    filters: [],
    tags: [],
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // ==================== Section Management ====================

  const addSection = () => {
    const newSection: ReportSection = {
      section_id: `section-${Date.now()}`,
      title: `Section ${reportConfig.sections.length + 1}`,
      metrics: [],
      visualization: 'line_chart',
      filters: [],
      order: reportConfig.sections.length,
    };

    setReportConfig(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));

    setExpandedSections(prev => new Set([...prev, newSection.section_id]));
  };

  const removeSection = (sectionId: string) => {
    setReportConfig(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.section_id !== sectionId),
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<ReportSection>) => {
    setReportConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.section_id === sectionId ? { ...s, ...updates } : s
      ),
    }));
  };

  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // ==================== Filter Management ====================

  const addFilter = (filterType: FilterType) => {
    const newFilter: ReportFilter = {
      filter_type: filterType,
      values: [],
    };

    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter],
    }));
  };

  const removeFilter = (index: number) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index),
    }));
  };

  // ==================== Actions ====================

  const handleSave = async () => {
    // TODO: API call to save report
    console.log('Saving report:', reportConfig);
    alert('Report saved successfully!');
  };

  const handleGenerate = async () => {
    // TODO: API call to generate report
    console.log('Generating report:', reportConfig);
    alert('Report generated!');
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    // TODO: API call to export report
    console.log(`Exporting report as ${format}:`, reportConfig);
    alert(`Exporting as ${format.toUpperCase()}...`);
  };

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Custom Report Builder</CardTitle>
              <CardDescription>
                Create custom reports with your choice of metrics, visualizations, and filters
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleGenerate} size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Report Name *</Label>
                  <Input
                    id="name"
                    value={reportConfig.name}
                    onChange={e =>
                      setReportConfig(prev => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="My Custom Report"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={reportConfig.description}
                    onChange={e =>
                      setReportConfig(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Brief description of this report"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={reportConfig.start_date}
                      onChange={e =>
                        setReportConfig(prev => ({ ...prev, start_date: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={reportConfig.end_date}
                      onChange={e =>
                        setReportConfig(prev => ({ ...prev, end_date: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Tags</Label>
                  <Input
                    placeholder="Add tags (comma separated)"
                    onBlur={e => {
                      const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      setReportConfig(prev => ({ ...prev, tags }));
                    }}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {reportConfig.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Sections Tab */}
            <TabsContent value="sections" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Add sections to organize your report metrics and visualizations
                </p>
                <Button onClick={addSection} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>

              {reportConfig.sections.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No sections yet. Click "Add Section" to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {reportConfig.sections.map(section => (
                    <Card key={section.section_id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSectionExpanded(section.section_id)}
                            >
                              {expandedSections.has(section.section_id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Input
                              value={section.title}
                              onChange={e =>
                                updateSection(section.section_id, { title: e.target.value })
                              }
                              className="font-medium"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSection(section.section_id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </CardHeader>

                      {expandedSections.has(section.section_id) && (
                        <CardContent className="space-y-4">
                          <div>
                            <Label>Metrics</Label>
                            <select
                              multiple
                              className="w-full p-2 border rounded"
                              value={section.metrics}
                              onChange={e => {
                                const selected = Array.from(e.target.selectedOptions).map(
                                  o => o.value as ReportMetric
                                );
                                updateSection(section.section_id, { metrics: selected });
                              }}
                            >
                              {AVAILABLE_METRICS.map(metric => (
                                <option key={metric.value} value={metric.value}>
                                  {metric.category}: {metric.label}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              Hold Ctrl/Cmd to select multiple
                            </p>
                          </div>

                          <div>
                            <Label>Visualization</Label>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                              {VISUALIZATIONS.map(viz => (
                                <button
                                  key={viz.value}
                                  onClick={() =>
                                    updateSection(section.section_id, {
                                      visualization: viz.value,
                                    })
                                  }
                                  className={`p-3 border rounded text-center transition-colors ${
                                    section.visualization === viz.value
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex justify-center mb-1">{viz.icon}</div>
                                  <div className="text-xs">{viz.label}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Filters Tab */}
            <TabsContent value="filters" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Filter report data by account, goal, or asset class
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => addFilter('account')} size="sm" variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Account
                  </Button>
                  <Button onClick={() => addFilter('goal')} size="sm" variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Goal
                  </Button>
                  <Button onClick={() => addFilter('asset_class')} size="sm" variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Asset Class
                  </Button>
                </div>
              </div>

              {reportConfig.filters.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No filters applied. Add filters to narrow down your report data.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {reportConfig.filters.map((filter, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Badge className="mb-2">{filter.filter_type}</Badge>
                            <Input
                              placeholder="Enter filter values (comma separated)"
                              onBlur={e => {
                                const values = e.target.value.split(',').map(v => v.trim());
                                const updated = [...reportConfig.filters];
                                updated[idx] = { ...filter, values };
                                setReportConfig(prev => ({ ...prev, filters: updated }));
                              }}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFilter(idx)}
                            className="ml-2"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Schedule automatic report generation and email delivery (Premium feature)
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div>
                  <Label>Frequency</Label>
                  <select className="w-full p-2 border rounded">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>

                <div>
                  <Label>Email Recipients</Label>
                  <Input placeholder="email@example.com (comma separated)" />
                </div>

                <div>
                  <Label>Time of Day</Label>
                  <Input type="time" defaultValue="09:00" />
                </div>

                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Enable Schedule
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={() => handleExport('pdf')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={() => handleExport('excel')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => handleExport('csv')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
