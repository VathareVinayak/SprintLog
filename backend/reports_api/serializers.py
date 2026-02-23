from rest_framework import serializers
from .models import Report


# serializer converts model ↔ JSON
class ReportSerializer(serializers.ModelSerializer):

    class Meta:
        model = Report

        # user auto assigned → not from request body
        fields = [
            "id",
            "report_type",
            "title",
            "content",
            "report_date",
            "created_at"
        ]

        read_only_fields = ["id", "report_date", "created_at"]