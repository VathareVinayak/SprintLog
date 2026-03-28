from django.urls import path
from .views import (
    ReportListView,
    create_report,
    generate_pdf_report,
    heatmap,
    reports_by_date,
    productivity_streak,
    report_distribution,
    timeline,
    update_report,
    delete_report,
    dashboard_stats,
    weekly_activity,
)


urlpatterns = [
    # create report
    path("create/", create_report, name="create-report"),

    # list reports with pagination/search/filter
    path("list/", ReportListView.as_view(), name="list-reports"),

    # filter reports by date
    path("by-date/", reports_by_date, name="reports-by-date"),

    # dashboard analytics
    path("dashboard/", dashboard_stats, name="dashboard-stats"),

    # advanced analytics
    path("weekly/", weekly_activity, name="weekly-activity"),
    path("distribution/", report_distribution, name="report-distribution"),
    path("timeline/", timeline, name="report-timeline"),
    path("streak/", productivity_streak, name="productivity-streak"),
    path("heatmap/", heatmap, name="report-heatmap"),
    path("generate-pdf/", generate_pdf_report, name="generate-report-pdf"),

    # update report
    path("update/<int:pk>/", update_report, name="update-report"),

    # delete report
    path("delete/<int:pk>/", delete_report, name="delete-report"),
]
