from collections import defaultdict
from datetime import timedelta

from django.db.models import Count
from django.utils import timezone

from reports_api.models import Report


def _serialize_report(report):
    return {
        "id": report.id,
        "title": report.title,
        "content": report.content,
        "report_type": report.report_type,
        "report_date": report.report_date,
        "created_at": report.created_at,
    }


def get_dashboard_data(user):
    """
    Collect dashboard analytics for a specific user.
    """

    today = timezone.localdate()
    week_start = today - timedelta(days=6)

    # total reports
    total_reports = Report.objects.filter(user=user).count()

    # today's reports
    today_reports = Report.objects.filter(
        user=user,
        report_date=today
    ).count()

    # weekly reports
    weekly_reports = Report.objects.filter(
        user=user,
        report_date__range=(week_start, today),
    ).count()

    # report type distribution
    distribution = (
        Report.objects.filter(user=user)
        .values("report_type")
        .annotate(count=Count("report_type"))
    )

    report_type_distribution = {
        item["report_type"]: item["count"] for item in distribution
    }

    # recent reports
    recent_reports = Report.objects.filter(user=user).order_by("-created_at")[:5]

    recent_data = [
        {
            "id": r.id,
            "title": r.title,
            "report_type": r.report_type,
            "created_at": r.created_at
        }
        for r in recent_reports
    ]

    return {
        "total_reports": total_reports,
        "today_reports": today_reports,
        "this_week_reports": weekly_reports,
        "report_type_distribution": report_type_distribution,
        "recent_reports": recent_data
    }


def get_weekly_activity(user, days=7):
    today = timezone.localdate()
    start_date = today - timedelta(days=days - 1)

    reports = (
        Report.objects.filter(
            user=user,
            report_date__range=(start_date, today),
        )
        .values("report_date")
        .annotate(count=Count("id"))
    )

    report_counts = {item["report_date"]: item["count"] for item in reports}

    activity = []
    current_date = start_date
    while current_date <= today:
        activity.append(
            {
                "date": current_date,
                "count": report_counts.get(current_date, 0),
            }
        )
        current_date += timedelta(days=1)

    return {
        "start_date": start_date,
        "end_date": today,
        "total_reports": sum(item["count"] for item in activity),
        "days": activity,
    }


def get_report_distribution(user):
    distribution = (
        Report.objects.filter(user=user)
        .values("report_type")
        .annotate(count=Count("id"))
        .order_by("report_type")
    )
    rows = list(distribution)

    return {
        "total_reports": sum(item["count"] for item in rows),
        "distribution": rows,
    }


def get_timeline_data(user):
    reports = Report.objects.filter(user=user).order_by("-report_date", "-created_at")
    grouped_reports = defaultdict(list)

    for report in reports:
        grouped_reports[report.report_date].append(_serialize_report(report))

    timeline = [
        {
            "date": report_date,
            "count": len(entries),
            "reports": entries,
        }
        for report_date, entries in grouped_reports.items()
    ]

    return {
        "total_days": len(timeline),
        "timeline": timeline,
    }


def get_productivity_streak(user):
    report_dates = list(
        Report.objects.filter(user=user)
        .order_by("report_date")
        .values_list("report_date", flat=True)
        .distinct()
    )

    if not report_dates:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "last_report_date": None,
            "active_today": False,
        }

    longest_streak = 1
    running_streak = 1

    for index in range(1, len(report_dates)):
        if report_dates[index] == report_dates[index - 1] + timedelta(days=1):
            running_streak += 1
        else:
            longest_streak = max(longest_streak, running_streak)
            running_streak = 1

    longest_streak = max(longest_streak, running_streak)

    today = timezone.localdate()
    yesterday = today - timedelta(days=1)
    current_streak = 0

    if report_dates[-1] in {today, yesterday}:
        current_streak = 1
        for index in range(len(report_dates) - 1, 0, -1):
            if report_dates[index] - report_dates[index - 1] == timedelta(days=1):
                current_streak += 1
            else:
                break

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "last_report_date": report_dates[-1],
        "active_today": report_dates[-1] == today,
    }


def get_heatmap_data(user, start_date=None, end_date=None):
    end_date = end_date or timezone.localdate()
    start_date = start_date or (end_date - timedelta(days=89))

    reports = (
        Report.objects.filter(
            user=user,
            report_date__range=(start_date, end_date),
        )
        .values("report_date")
        .annotate(count=Count("id"))
    )

    report_counts = {item["report_date"]: item["count"] for item in reports}

    data = []
    current_date = start_date
    while current_date <= end_date:
        data.append(
            {
                "date": current_date,
                "count": report_counts.get(current_date, 0),
            }
        )
        current_date += timedelta(days=1)

    return {
        "start_date": start_date,
        "end_date": end_date,
        "heatmap": data,
    }
