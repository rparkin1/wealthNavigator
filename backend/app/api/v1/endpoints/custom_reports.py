"""
Custom Reports API Endpoints
REQ-REPORT-012: Customizable Reports with filtering, scheduling, and export
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.custom_reports import (
    CustomReportRequest,
    CustomReportResponse,
    GeneratedReportResponse,
    ReportExportRequest,
    ReportExportResponse,
    ReportTemplate,
    ReportListResponse,
    ReportSection,
    ReportSectionData,
    ReportDataPoint,
    ReportMetric,
    VisualizationType,
    ReportFilter,
    ReportFilterType,
    ScheduledReportRun
)
from app.services.custom_reports_service import CustomReportsService
from app.services.report_export_service import ReportExportService

router = APIRouter(prefix="/reports/custom", tags=["custom-reports"])


# ==================== Report CRUD ====================

@router.post("/", response_model=CustomReportResponse, status_code=201)
async def create_custom_report(
    request: CustomReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new custom report configuration

    REQ-REPORT-012: Select date ranges, choose metrics and visualizations,
    filter by account/goal/asset class
    """
    service = CustomReportsService(db)

    report = await service.create_report(
        user_id=str(current_user.id),
        report_data=request
    )

    return report


@router.get("/", response_model=ReportListResponse)
async def list_custom_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    tag: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all custom reports for the current user
    """
    service = CustomReportsService(db)

    reports, total = await service.list_reports(
        user_id=str(current_user.id),
        page=page,
        page_size=page_size,
        tag=tag
    )

    return ReportListResponse(
        reports=reports,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{report_id}", response_model=CustomReportResponse)
async def get_custom_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific custom report configuration
    """
    service = CustomReportsService(db)

    report = await service.get_report(report_id, str(current_user.id))

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return report


@router.put("/{report_id}", response_model=CustomReportResponse)
async def update_custom_report(
    report_id: str,
    request: CustomReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an existing custom report
    """
    service = CustomReportsService(db)

    report = await service.update_report(
        report_id=report_id,
        user_id=str(current_user.id),
        report_data=request
    )

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return report


@router.delete("/{report_id}", status_code=204)
async def delete_custom_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a custom report
    """
    service = CustomReportsService(db)

    success = await service.delete_report(report_id, str(current_user.id))

    if not success:
        raise HTTPException(status_code=404, detail="Report not found")

    return None


# ==================== Report Generation ====================

@router.post("/{report_id}/generate", response_model=GeneratedReportResponse)
async def generate_report(
    report_id: str,
    start_date: Optional[str] = Query(None, description="Override start date"),
    end_date: Optional[str] = Query(None, description="Override end date"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate report data based on configuration

    Applies all filters and generates visualizations
    """
    service = CustomReportsService(db)

    report = await service.get_report(report_id, str(current_user.id))
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Override dates if provided
    if start_date:
        report.start_date = start_date
    if end_date:
        report.end_date = end_date

    # Generate report data
    generated_report = await service.generate_report_data(report, str(current_user.id))

    return generated_report


# ==================== Report Export ====================

@router.post("/{report_id}/export", response_model=ReportExportResponse)
async def export_report(
    report_id: str,
    export_request: ReportExportRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export report to PDF, Excel, or CSV

    REQ-REPORT-012: Export reports to PDF, Excel, CSV
    """
    service = CustomReportsService(db)
    export_service = ReportExportService()

    # Get report
    report = await service.get_report(report_id, str(current_user.id))
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Generate report data first
    generated_report = await service.generate_report_data(report, str(current_user.id))

    # Export to requested format
    export_result = await export_service.export_report(
        generated_report=generated_report,
        format=export_request.format,
        include_charts=export_request.include_charts,
        include_raw_data=export_request.include_raw_data
    )

    return export_result


@router.get("/export/{export_id}/download")
async def download_export(
    export_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Download an exported report file
    """
    export_service = ReportExportService()

    file_response = await export_service.get_export_file(
        export_id=export_id,
        user_id=str(current_user.id)
    )

    if not file_response:
        raise HTTPException(status_code=404, detail="Export not found or expired")

    return file_response


# ==================== Report Templates ====================

@router.get("/templates/list", response_model=List[ReportTemplate])
async def list_report_templates(
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of pre-defined report templates

    Templates provide quick-start configurations for common reports
    """
    service = CustomReportsService(None)  # Templates don't need DB

    templates = service.get_templates(category=category)

    return templates


@router.post("/templates/{template_id}/create", response_model=CustomReportResponse, status_code=201)
async def create_from_template(
    template_id: str,
    name: str = Query(..., description="Name for the new report"),
    start_date: str = Query(..., description="Start date YYYY-MM-DD"),
    end_date: str = Query(..., description="End date YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a custom report from a template
    """
    service = CustomReportsService(db)

    report = await service.create_from_template(
        user_id=str(current_user.id),
        template_id=template_id,
        name=name,
        start_date=start_date,
        end_date=end_date
    )

    if not report:
        raise HTTPException(status_code=404, detail="Template not found")

    return report


# ==================== Scheduled Reports ====================

@router.post("/{report_id}/schedule", response_model=CustomReportResponse)
async def schedule_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Enable/update scheduled generation for a report

    REQ-REPORT-012: Schedule automatic report generation and delivery
    """
    service = CustomReportsService(db)

    report = await service.get_report(report_id, str(current_user.id))
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if not report.schedule:
        raise HTTPException(
            status_code=400,
            detail="Report does not have a schedule configured. Update the report with schedule details."
        )

    # Enable the schedule
    report.schedule.enabled = True
    updated = await service.update_report_schedule(report_id, str(current_user.id), report.schedule)

    return updated


@router.delete("/{report_id}/schedule", status_code=204)
async def disable_report_schedule(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Disable scheduled generation for a report
    """
    service = CustomReportsService(db)

    success = await service.disable_schedule(report_id, str(current_user.id))

    if not success:
        raise HTTPException(status_code=404, detail="Report not found")

    return None


@router.get("/{report_id}/schedule/history", response_model=List[ScheduledReportRun])
async def get_schedule_history(
    report_id: str,
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get history of scheduled report runs
    """
    service = CustomReportsService(db)

    history = await service.get_schedule_history(
        report_id=report_id,
        user_id=str(current_user.id),
        limit=limit
    )

    return history
