from rest_framework.decorators import api_view, permission_classes  
from rest_framework.permissions import IsAuthenticated              
from rest_framework.response import Response                        
from rest_framework import status                                   

from .models import Report                                          
from .serializers import ReportSerializer                           


# CREATE REPORT
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_report(request):
    """
    Create a new report for the logged-in user.
    User is automatically assigned from JWT token.
    """

    serializer = ReportSerializer(data=request.data)

    if serializer.is_valid():
        # attach logged-in user automatically (security)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# LIST ALL REPORTS OF CURRENT USER
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_reports(request):
    """
    Get all reports created by logged-in user.
    Ordered by newest first.
    """

    reports = Report.objects.filter(user=request.user).order_by("-created_at")

    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)



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

    serializer = ReportSerializer(report, data=request.data, partial=True)

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