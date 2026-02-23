from django.urls import path
from .views import create_report, list_reports, reports_by_date , update_report, delete_report

urlpatterns = [
    path("create/", create_report),
    path("list/", list_reports),
    path("by-date/", reports_by_date),
    path("create/", create_report),
    path("list/", list_reports),
    path("by-date/", reports_by_date),
    path("update/<int:pk>/", update_report),
    path("delete/<int:pk>/", delete_report),
]