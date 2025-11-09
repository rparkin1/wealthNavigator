/**
 * Custom Reports API Service
 * REQ-REPORT-012: API client for custom reports functionality
 */

import { apiClient } from './api';

// ==================== Types ====================

export type ReportMetric =
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

export type VisualizationType =
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'area_chart'
  | 'scatter_plot'
  | 'heat_map'
  | 'table';

export type FilterType = 'account' | 'goal' | 'asset_class' | 'date_range' | 'tag';

export interface ReportFilter {
  filter_type: FilterType;
  values: string[];
}

export interface ReportSection {
  section_id: string;
  title: string;
  metrics: ReportMetric[];
  visualization: VisualizationType;
  filters: ReportFilter[];
  order: number;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  day_of_week?: number;
  day_of_month?: number;
  time_of_day: string;
  timezone: string;
  enabled: boolean;
  email_recipients: string[];
}

export interface CustomReportRequest {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  sections: ReportSection[];
  filters: ReportFilter[];
  schedule?: ReportSchedule;
  tags: string[];
}

export interface CustomReportResponse {
  report_id: string;
  user_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  sections: ReportSection[];
  filters: ReportFilter[];
  schedule?: ReportSchedule;
  tags: string[];
  created_at: string;
  updated_at: string;
  last_generated?: string;
}

export interface ReportDataPoint {
  date: string;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface ReportSectionData {
  section_id: string;
  title: string;
  metric: ReportMetric;
  visualization: VisualizationType;
  data: ReportDataPoint[];
  summary_stats: Record<string, number>;
}

export interface GeneratedReportResponse {
  report_id: string;
  name: string;
  description?: string;
  generated_at: string;
  date_range: string;
  sections: ReportSectionData[];
  filters_applied: ReportFilter[];
  export_formats: string[];
}

export interface ReportExportRequest {
  report_id: string;
  format: 'pdf' | 'excel' | 'csv';
  include_charts: boolean;
  include_raw_data: boolean;
}

export interface ReportExportResponse {
  export_id: string;
  report_id: string;
  format: string;
  filename: string;
  file_size: number;
  download_url: string;
  expires_at: string;
  generated_at: string;
}

export interface ReportTemplate {
  template_id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  sections: ReportSection[];
  default_filters: ReportFilter[];
  is_premium: boolean;
}

export interface ReportListResponse {
  reports: CustomReportResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface ScheduledReportRun {
  run_id: string;
  report_id: string;
  scheduled_time: string;
  actual_time: string;
  status: 'success' | 'failed' | 'pending';
  generated_file?: string;
  error_message?: string;
  email_sent: boolean;
  email_recipients: string[];
}

// ==================== API Functions ====================

/**
 * Create a new custom report
 */
export async function createCustomReport(
  request: CustomReportRequest
): Promise<CustomReportResponse> {
  const response = await apiClient.post<CustomReportResponse>(
    '/api/v1/reports/custom/',
    request
  );
  return response.data;
}

/**
 * List all custom reports
 */
export async function listCustomReports(params?: {
  page?: number;
  page_size?: number;
  tag?: string;
}): Promise<ReportListResponse> {
  const response = await apiClient.get<ReportListResponse>('/api/v1/reports/custom/', {
    params,
  });
  return response.data;
}

/**
 * Get a specific custom report
 */
export async function getCustomReport(reportId: string): Promise<CustomReportResponse> {
  const response = await apiClient.get<CustomReportResponse>(
    `/api/v1/reports/custom/${reportId}`
  );
  return response.data;
}

/**
 * Update an existing custom report
 */
export async function updateCustomReport(
  reportId: string,
  request: CustomReportRequest
): Promise<CustomReportResponse> {
  const response = await apiClient.put<CustomReportResponse>(
    `/api/v1/reports/custom/${reportId}`,
    request
  );
  return response.data;
}

/**
 * Delete a custom report
 */
export async function deleteCustomReport(reportId: string): Promise<void> {
  await apiClient.delete(`/api/v1/reports/custom/${reportId}`);
}

/**
 * Generate report data
 */
export async function generateReport(
  reportId: string,
  overrides?: {
    start_date?: string;
    end_date?: string;
  }
): Promise<GeneratedReportResponse> {
  const response = await apiClient.post<GeneratedReportResponse>(
    `/api/v1/reports/custom/${reportId}/generate`,
    null,
    { params: overrides }
  );
  return response.data;
}

/**
 * Export report to PDF, Excel, or CSV
 */
export async function exportReport(
  request: ReportExportRequest
): Promise<ReportExportResponse> {
  const response = await apiClient.post<ReportExportResponse>(
    `/api/v1/reports/custom/${request.report_id}/export`,
    request
  );
  return response.data;
}

/**
 * Download exported report file
 */
export async function downloadExportedReport(
  exportId: string
): Promise<Blob> {
  const response = await apiClient.get(`/api/v1/reports/custom/export/${exportId}/download`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Get list of report templates
 */
export async function listReportTemplates(
  category?: string
): Promise<ReportTemplate[]> {
  const response = await apiClient.get<ReportTemplate[]>(
    '/api/v1/reports/custom/templates/list',
    { params: { category } }
  );
  return response.data;
}

/**
 * Create report from template
 */
export async function createFromTemplate(params: {
  template_id: string;
  name: string;
  start_date: string;
  end_date: string;
}): Promise<CustomReportResponse> {
  const response = await apiClient.post<CustomReportResponse>(
    `/api/v1/reports/custom/templates/${params.template_id}/create`,
    null,
    { params }
  );
  return response.data;
}

/**
 * Enable report schedule
 */
export async function scheduleReport(reportId: string): Promise<CustomReportResponse> {
  const response = await apiClient.post<CustomReportResponse>(
    `/api/v1/reports/custom/${reportId}/schedule`
  );
  return response.data;
}

/**
 * Disable report schedule
 */
export async function disableReportSchedule(reportId: string): Promise<void> {
  await apiClient.delete(`/api/v1/reports/custom/${reportId}/schedule`);
}

/**
 * Get schedule execution history
 */
export async function getScheduleHistory(
  reportId: string,
  limit?: number
): Promise<ScheduledReportRun[]> {
  const response = await apiClient.get<ScheduledReportRun[]>(
    `/api/v1/reports/custom/${reportId}/schedule/history`,
    { params: { limit } }
  );
  return response.data;
}

/**
 * Helper function to trigger file download from export response
 */
export async function downloadReportFile(exportResponse: ReportExportResponse): Promise<void> {
  try {
    const blob = await downloadExportedReport(exportResponse.export_id);

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportResponse.filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}
