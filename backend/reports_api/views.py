from datetime import datetime

from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Report
from .serializers import ReportSerializer
from .services import ai_service, pdf_service, report_service
from .services.analytics_service import (
    get_dashboard_data,
    get_heatmap_data,
    get_productivity_streak,
    get_report_distribution,
    get_timeline_data,
    get_weekly_activity,
)
from .services.exceptions import (
    InvalidDateRangeError,
    NoReportsFoundError,
    PdfGenerationError,
)


def _parse_date(value, field_name):
    if not value:
        return None

    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise ValueError(f"{field_name} must be in YYYY-MM-DD format.")



# CREATE REPORT
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_report(request):
    """
    Create a new report for the logged-in user.
    User is automatically assigned from JWT token.
    """

    serializer = ReportSerializer(data=request.data, context={"request": request})

    if serializer.is_valid():
        # attach logged-in user automatically (security)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# LIST ALL REPORTS OF CURRENT USER
# Note: class-based views shouldn't use @api_view decorator, which converts
# the object to a function and breaks as_view(). Instead apply permissions
# directly via attributes or mixins.
class ReportListView(ListAPIView):
    """
    Returns paginated list of user's reports.
    Supports search, filtering and ordering.
    """

    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    # fields that support filtering
    filterset_fields = ["report_type", "report_date"]

    # fields that support search
    search_fields = ["title", "content"]

    # fields that support ordering
    ordering_fields = ["created_at", "report_date"]

    def get_queryset(self):
        # return only logged-in user's reports
        return Report.objects.filter(user=self.request.user).order_by("-created_at")



# FILTER REPORTS BY DATE
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reports_by_date(request):
    """
    Filter reports by specific date.
    Query param: ?date=YYYY-MM-DD
    """

    date = request.GET.get("date")

    if not date:
        return Response(
            {"error": "Date query parameter required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    reports = Report.objects.filter(
        user=request.user,
        report_date=date
    )

    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)



# UPDATE REPORT
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_report(request, pk):
    """
    Update an existing report.
    Only owner can update.
    """

    try:
        report = Report.objects.get(id=pk, user=request.user)
    except Report.DoesNotExist:
        return Response(
            {"error": "Report not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = ReportSerializer(
        report,
        data=request.data,
        partial=True,
        context={"request": request},
    )

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# DELETE REPORT
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_report(request, pk):
    """
    Delete a report.
    Only owner can delete.
    """

    try:
        report = Report.objects.get(id=pk, user=request.user)
    except Report.DoesNotExist:
        return Response(
            {"error": "Report not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    report.delete()
    return Response(
        {"message": "Report deleted successfully"},
        status=status.HTTP_200_OK
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    # Returns dashboard analytics for logged-in user.
    data = get_dashboard_data(request.user)
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def weekly_activity(request):
    data = get_weekly_activity(request.user)
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_distribution(request):
    data = get_report_distribution(request.user)
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def timeline(request):
    data = get_timeline_data(request.user)
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def productivity_streak(request):
    data = get_productivity_streak(request.user)
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def heatmap(request):
    try:
        start_date = _parse_date(request.GET.get("start_date"), "start_date")
        end_date = _parse_date(request.GET.get("end_date"), "end_date")
    except ValueError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    if start_date and end_date and start_date > end_date:
        return Response(
            {"error": "start_date cannot be after end_date."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = get_heatmap_data(
        request.user,
        start_date=start_date,
        end_date=end_date,
    )
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_pdf_report(request):
    try:
        start_date, end_date = report_service.parse_date_range(
            request.GET.get("start_date"),
            request.GET.get("end_date"),
        )
        reports = report_service.get_reports_for_date_range(
            request.user,
            start_date,
            end_date,
        )
        grouped_reports, ai_payload = report_service.group_reports_for_pdf(reports)
        summary_data = ai_service.generate_report_summary(
            request.user,
            start_date,
            end_date,
            ai_payload,
        )
        pdf_bytes = pdf_service.generate_pdf_report(
            request.user,
            start_date,
            end_date,
            grouped_reports,
            summary_data,
        )
    except InvalidDateRangeError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except NoReportsFoundError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_404_NOT_FOUND)
    except PdfGenerationError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = (
        f'attachment; filename="sprintlog-report-{start_date.isoformat()}-to-{end_date.isoformat()}.pdf"'
    )
    return response
