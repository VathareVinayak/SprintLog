from collections import OrderedDict
from datetime import datetime

from reports_api.models import Report

from .exceptions import InvalidDateRangeError, NoReportsFoundError


def parse_date_range(start_date_value, end_date_value):
    if not start_date_value or not end_date_value:
        raise InvalidDateRangeError(
            "start_date and end_date query parameters are required."
        )

    try:
        start_date = datetime.strptime(start_date_value, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise InvalidDateRangeError(
            "start_date and end_date must be in YYYY-MM-DD format."
        ) from exc

    if start_date > end_date:
        raise InvalidDateRangeError("start_date cannot be after end_date.")

    return start_date, end_date


def get_reports_for_date_range(user, start_date, end_date):
    reports = list(
        Report.objects.filter(
            user=user,
            report_date__range=(start_date, end_date),
        ).order_by("report_date", "report_type", "created_at")
    )

    if not reports:
        raise NoReportsFoundError("No reports found for the selected date range.")

    return reports


def group_reports_for_pdf(reports):
    grouped_reports = OrderedDict()

    for report in reports:
        date_bucket = grouped_reports.setdefault(report.report_date, OrderedDict())
        type_bucket = date_bucket.setdefault(
            report.report_type,
            {
                "report_type": report.report_type,
                "report_type_label": report.get_report_type_display(),
                "reports": [],
            },
        )
        type_bucket["reports"].append(
            {
                "id": report.id,
                "title": report.title,
                "content": report.content,
                "created_at": report.created_at.isoformat(),
            }
        )

    pdf_groups = []
    ai_groups = []

    for report_date, report_types in grouped_reports.items():
        type_groups = list(report_types.values())
        pdf_groups.append(
            {
                "report_date": report_date,
                "report_types": type_groups,
            }
        )
        ai_groups.append(
            {
                "report_date": report_date.isoformat(),
                "report_types": type_groups,
            }
        )

    return pdf_groups, ai_groups
