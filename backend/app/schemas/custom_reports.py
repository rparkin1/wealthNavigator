"""
Custom Reports Schemas
REQ-REPORT-012: Customizable Reports
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class ReportMetric(str, Enum):
    """Available report metrics"""
    TOTAL_RETURN = "total_return"
    TIME_WEIGHTED_RETURN = "time_weighted_return"
    MONEY_WEIGHTED_RETURN = "money_weighted_return"
    ALPHA = "alpha"
    BETA = "beta"
    SHARPE_RATIO = "sharpe_ratio"
    VOLATILITY = "volatility"
    MAX_DRAWDOWN = "max_drawdown"
    NET_WORTH = "net_worth"
    ASSET_ALLOCATION = "asset_allocation"
    FEES = "fees"
    TAX_LIABILITY = "tax_liability"
    GOAL_PROGRESS = "goal_progress"
    RISK_SCORE = "risk_score"


class VisualizationType(str, Enum):
    """Available visualization types"""
    LINE_CHART = "line_chart"
    BAR_CHART = "bar_chart"
    PIE_CHART = "pie_chart"
    AREA_CHART = "area_chart"
    SCATTER_PLOT = "scatter_plot"
    HEAT_MAP = "heat_map"
    TABLE = "table"


class ReportFilterType(str, Enum):
    """Filter types"""
    ACCOUNT = "account"
    GOAL = "goal"
    ASSET_CLASS = "asset_class"
    DATE_RANGE = "date_range"
    TAG = "tag"


class ReportFilter(BaseModel):
    """Individual report filter"""
    filter_type: ReportFilterType
    values: List[str]  # List of IDs or values to filter by


class ReportSection(BaseModel):
    """Section within a report"""
    section_id: str = Field(..., description="Unique section identifier")
    title: str = Field(..., description="Section title")
    metrics: List[ReportMetric] = Field(..., description="Metrics to display")
    visualization: VisualizationType = Field(..., description="How to visualize data")
    filters: List[ReportFilter] = Field(default_factory=list)
    order: int = Field(default=0, description="Display order")


class ReportSchedule(BaseModel):
    """Schedule for automatic report generation"""
    frequency: str = Field(..., description="daily, weekly, monthly, quarterly")
    day_of_week: Optional[int] = Field(None, description="0-6 for weekly")
    day_of_month: Optional[int] = Field(None, description="1-31 for monthly")
    time_of_day: str = Field(default="09:00", description="HH:MM format")
    timezone: str = Field(default="UTC")
    enabled: bool = Field(default=True)
    email_recipients: List[str] = Field(default_factory=list)


class CustomReportRequest(BaseModel):
    """Request to create or update a custom report"""
    name: str = Field(..., description="Report name", max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    start_date: str = Field(..., description="Start date YYYY-MM-DD")
    end_date: str = Field(..., description="End date YYYY-MM-DD")
    sections: List[ReportSection] = Field(..., min_items=1)
    filters: List[ReportFilter] = Field(default_factory=list)
    schedule: Optional[ReportSchedule] = None
    tags: List[str] = Field(default_factory=list)


class CustomReportResponse(BaseModel):
    """Custom report metadata response"""
    report_id: str
    user_id: str
    name: str
    description: Optional[str]
    start_date: str
    end_date: str
    sections: List[ReportSection]
    filters: List[ReportFilter]
    schedule: Optional[ReportSchedule]
    tags: List[str]
    created_at: datetime
    updated_at: datetime
    last_generated: Optional[datetime]


class ReportDataPoint(BaseModel):
    """Single data point in report"""
    date: str
    value: float
    label: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ReportSectionData(BaseModel):
    """Data for a report section"""
    section_id: str
    title: str
    metric: ReportMetric
    visualization: VisualizationType
    data: List[ReportDataPoint]
    summary_stats: Dict[str, float] = Field(default_factory=dict)


class GeneratedReportResponse(BaseModel):
    """Generated report with data"""
    report_id: str
    name: str
    description: Optional[str]
    generated_at: datetime
    date_range: str
    sections: List[ReportSectionData]
    filters_applied: List[ReportFilter]
    export_formats: List[str] = Field(default=["pdf", "excel", "csv"])


class ReportExportRequest(BaseModel):
    """Request to export a report"""
    report_id: str
    format: str = Field(..., description="pdf, excel, or csv")
    include_charts: bool = Field(default=True)
    include_raw_data: bool = Field(default=False)


class ReportExportResponse(BaseModel):
    """Export response"""
    export_id: str
    report_id: str
    format: str
    filename: str
    file_size: int  # bytes
    download_url: str
    expires_at: datetime
    generated_at: datetime


class ReportTemplate(BaseModel):
    """Pre-defined report template"""
    template_id: str
    name: str
    description: str
    category: str  # "performance", "tax", "goals", "risk"
    icon: str
    sections: List[ReportSection]
    default_filters: List[ReportFilter]
    is_premium: bool = Field(default=False)


class ReportListResponse(BaseModel):
    """List of custom reports"""
    reports: List[CustomReportResponse]
    total: int
    page: int
    page_size: int


class ScheduledReportRun(BaseModel):
    """Record of a scheduled report run"""
    run_id: str
    report_id: str
    scheduled_time: datetime
    actual_time: datetime
    status: str  # "success", "failed", "pending"
    generated_file: Optional[str]
    error_message: Optional[str]
    email_sent: bool
    email_recipients: List[str]
