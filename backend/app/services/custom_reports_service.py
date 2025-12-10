"""
Custom Reports Service
Business logic for custom report generation and management
"""

from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import json

from app.schemas.custom_reports import (
    CustomReportRequest,
    CustomReportResponse,
    GeneratedReportResponse,
    ReportSection,
    ReportSectionData,
    ReportDataPoint,
    ReportMetric,
    ReportFilter,
    ReportFilterType,
    ReportTemplate,
    ReportSchedule,
    ScheduledReportRun
)


class CustomReportsService:
    """Service for managing custom reports"""

    def __init__(self, db: Optional[AsyncSession]):
        self.db = db
        self._templates = self._initialize_templates()

    async def create_report(
        self,
        user_id: str,
        report_data: CustomReportRequest
    ) -> CustomReportResponse:
        """Create a new custom report"""
        report_id = str(uuid.uuid4())
        now = datetime.now()

        report = CustomReportResponse(
            report_id=report_id,
            user_id=user_id,
            name=report_data.name,
            description=report_data.description,
            start_date=report_data.start_date,
            end_date=report_data.end_date,
            sections=report_data.sections,
            filters=report_data.filters,
            schedule=report_data.schedule,
            tags=report_data.tags,
            created_at=now,
            updated_at=now,
            last_generated=None
        )

        # In production, save to database
        # For now, return the report
        return report

    async def list_reports(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
        tag: Optional[str] = None
    ) -> Tuple[List[CustomReportResponse], int]:
        """List user's custom reports"""
        # In production, query database
        # For now, return empty list
        reports: List[CustomReportResponse] = []
        total = 0

        return reports, total

    async def get_report(
        self,
        report_id: str,
        user_id: str
    ) -> Optional[CustomReportResponse]:
        """Get a specific report"""
        # In production, query database
        # For now, return None
        return None

    async def update_report(
        self,
        report_id: str,
        user_id: str,
        report_data: CustomReportRequest
    ) -> Optional[CustomReportResponse]:
        """Update an existing report"""
        existing = await self.get_report(report_id, user_id)
        if not existing:
            return None

        # Update fields
        existing.name = report_data.name
        existing.description = report_data.description
        existing.start_date = report_data.start_date
        existing.end_date = report_data.end_date
        existing.sections = report_data.sections
        existing.filters = report_data.filters
        existing.schedule = report_data.schedule
        existing.tags = report_data.tags
        existing.updated_at = datetime.now()

        # In production, save to database
        return existing

    async def delete_report(
        self,
        report_id: str,
        user_id: str
    ) -> bool:
        """Delete a report"""
        # In production, delete from database
        return True

    async def generate_report_data(
        self,
        report: CustomReportResponse,
        user_id: str
    ) -> GeneratedReportResponse:
        """Generate report data based on configuration"""
        section_data_list = []

        for section in report.sections:
            section_data = await self._generate_section_data(
                section=section,
                start_date=report.start_date,
                end_date=report.end_date,
                filters=report.filters,
                user_id=user_id
            )
            section_data_list.append(section_data)

        generated = GeneratedReportResponse(
            report_id=report.report_id,
            name=report.name,
            description=report.description,
            generated_at=datetime.now(),
            date_range=f"{report.start_date} to {report.end_date}",
            sections=section_data_list,
            filters_applied=report.filters,
            export_formats=["pdf", "excel", "csv"]
        )

        return generated

    async def _generate_section_data(
        self,
        section: ReportSection,
        start_date: str,
        end_date: str,
        filters: List[ReportFilter],
        user_id: str
    ) -> ReportSectionData:
        """Generate data for a single report section"""
        # Mock data generation
        # In production, fetch actual data from database based on filters

        data_points = self._generate_mock_data_points(
            metric=section.metrics[0] if section.metrics else ReportMetric.TOTAL_RETURN,
            start_date=start_date,
            end_date=end_date
        )

        summary_stats = self._calculate_summary_stats(data_points)

        return ReportSectionData(
            section_id=section.section_id,
            title=section.title,
            metric=section.metrics[0] if section.metrics else ReportMetric.TOTAL_RETURN,
            visualization=section.visualization,
            data=data_points,
            summary_stats=summary_stats
        )

    def _generate_mock_data_points(
        self,
        metric: ReportMetric,
        start_date: str,
        end_date: str
    ) -> List[ReportDataPoint]:
        """Generate mock data points for demonstration"""
        import numpy as np

        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        days = (end - start).days

        # Generate monthly data points
        points = []
        current = start
        base_value = 100.0

        np.random.seed(42)

        while current <= end:
            if metric == ReportMetric.TOTAL_RETURN:
                value = base_value * (1 + np.random.normal(0.07, 0.15))
            elif metric == ReportMetric.NET_WORTH:
                value = base_value * 5000
            elif metric == ReportMetric.SHARPE_RATIO:
                value = np.random.uniform(0.5, 2.0)
            else:
                value = np.random.uniform(50, 150)

            points.append(ReportDataPoint(
                date=current.strftime("%Y-%m-%d"),
                value=round(value, 2),
                label=current.strftime("%b %Y")
            ))

            current += timedelta(days=30)
            base_value = value

        return points

    def _calculate_summary_stats(
        self,
        data_points: List[ReportDataPoint]
    ) -> Dict[str, float]:
        """Calculate summary statistics"""
        if not data_points:
            return {}

        values = [p.value for p in data_points]

        return {
            "min": min(values),
            "max": max(values),
            "mean": sum(values) / len(values),
            "start": values[0],
            "end": values[-1],
            "change": values[-1] - values[0],
            "change_pct": ((values[-1] - values[0]) / values[0] * 100) if values[0] != 0 else 0
        }

    def get_templates(self, category: Optional[str] = None) -> List[ReportTemplate]:
        """Get report templates"""
        templates = list(self._templates.values())

        if category:
            templates = [t for t in templates if t.category == category]

        return templates

    async def create_from_template(
        self,
        user_id: str,
        template_id: str,
        name: str,
        start_date: str,
        end_date: str
    ) -> Optional[CustomReportResponse]:
        """Create a report from a template"""
        template = self._templates.get(template_id)
        if not template:
            return None

        request = CustomReportRequest(
            name=name,
            description=template.description,
            start_date=start_date,
            end_date=end_date,
            sections=template.sections,
            filters=template.default_filters,
            schedule=None,
            tags=[template.category]
        )

        return await self.create_report(user_id, request)

    async def update_report_schedule(
        self,
        report_id: str,
        user_id: str,
        schedule: ReportSchedule
    ) -> Optional[CustomReportResponse]:
        """Update report schedule"""
        report = await self.get_report(report_id, user_id)
        if not report:
            return None

        report.schedule = schedule
        report.updated_at = datetime.now()

        # In production, save to database
        return report

    async def disable_schedule(
        self,
        report_id: str,
        user_id: str
    ) -> bool:
        """Disable report schedule"""
        report = await self.get_report(report_id, user_id)
        if not report or not report.schedule:
            return False

        report.schedule.enabled = False
        # In production, save to database
        return True

    async def get_schedule_history(
        self,
        report_id: str,
        user_id: str,
        limit: int = 20
    ) -> List[ScheduledReportRun]:
        """Get schedule execution history"""
        # In production, query database
        # For now, return empty list
        return []

    def _initialize_templates(self) -> Dict[str, ReportTemplate]:
        """Initialize pre-defined report templates"""
        from app.schemas.custom_reports import VisualizationType

        templates = {
            "performance-summary": ReportTemplate(
                template_id="performance-summary",
                name="Performance Summary",
                description="Comprehensive portfolio performance overview",
                category="performance",
                icon="📊",
                sections=[
                    ReportSection(
                        section_id="returns",
                        title="Total Returns",
                        metrics=[ReportMetric.TOTAL_RETURN, ReportMetric.TIME_WEIGHTED_RETURN],
                        visualization=VisualizationType.LINE_CHART,
                        order=0
                    ),
                    ReportSection(
                        section_id="allocation",
                        title="Asset Allocation",
                        metrics=[ReportMetric.ASSET_ALLOCATION],
                        visualization=VisualizationType.PIE_CHART,
                        order=1
                    ),
                    ReportSection(
                        section_id="risk",
                        title="Risk Metrics",
                        metrics=[ReportMetric.SHARPE_RATIO, ReportMetric.VOLATILITY],
                        visualization=VisualizationType.TABLE,
                        order=2
                    )
                ],
                default_filters=[],
                is_premium=False
            ),
            "tax-summary": ReportTemplate(
                template_id="tax-summary",
                name="Tax Summary",
                description="Tax liability and opportunities",
                category="tax",
                icon="💰",
                sections=[
                    ReportSection(
                        section_id="tax-liability",
                        title="Tax Liability",
                        metrics=[ReportMetric.TAX_LIABILITY],
                        visualization=VisualizationType.BAR_CHART,
                        order=0
                    ),
                    ReportSection(
                        section_id="fees",
                        title="Fees Impact",
                        metrics=[ReportMetric.FEES],
                        visualization=VisualizationType.PIE_CHART,
                        order=1
                    )
                ],
                default_filters=[],
                is_premium=False
            ),
            "goals-progress": ReportTemplate(
                template_id="goals-progress",
                name="Goals Progress",
                description="Track progress toward financial goals",
                category="goals",
                icon="🎯",
                sections=[
                    ReportSection(
                        section_id="goal-progress",
                        title="Goal Achievement",
                        metrics=[ReportMetric.GOAL_PROGRESS],
                        visualization=VisualizationType.BAR_CHART,
                        order=0
                    ),
                    ReportSection(
                        section_id="net-worth",
                        title="Net Worth Growth",
                        metrics=[ReportMetric.NET_WORTH],
                        visualization=VisualizationType.AREA_CHART,
                        order=1
                    )
                ],
                default_filters=[
                    ReportFilter(
                        filter_type=ReportFilterType.GOAL,
                        values=[]
                    )
                ],
                is_premium=False
            ),
            "risk-analysis": ReportTemplate(
                template_id="risk-analysis",
                name="Risk Analysis",
                description="Detailed portfolio risk assessment",
                category="risk",
                icon="⚠️",
                sections=[
                    ReportSection(
                        section_id="risk-score",
                        title="Risk Score",
                        metrics=[ReportMetric.RISK_SCORE],
                        visualization=VisualizationType.LINE_CHART,
                        order=0
                    ),
                    ReportSection(
                        section_id="volatility",
                        title="Volatility Analysis",
                        metrics=[ReportMetric.VOLATILITY, ReportMetric.MAX_DRAWDOWN],
                        visualization=VisualizationType.AREA_CHART,
                        order=1
                    ),
                    ReportSection(
                        section_id="sharpe",
                        title="Risk-Adjusted Returns",
                        metrics=[ReportMetric.SHARPE_RATIO],
                        visualization=VisualizationType.BAR_CHART,
                        order=2
                    )
                ],
                default_filters=[],
                is_premium=True
            )
        }

        return templates
