from rest_framework import serializers
from django.utils import timezone
from .models import Report


# serializer converts model ↔ JSON
class ReportSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if user is None or not user.is_authenticated:
            return attrs

        report_type = attrs.get(
            "report_type",
            getattr(self.instance, "report_type", None),
        )
        report_date = attrs.get(
            "report_date",
            getattr(self.instance, "report_date", timezone.localdate()),
        )

        if report_type is None or report_date is None:
            return attrs

        duplicate_queryset = Report.objects.filter(
            user=user,
            report_type=report_type,
            report_date=report_date,
        )

        if self.instance is not None:
            duplicate_queryset = duplicate_queryset.exclude(pk=self.instance.pk)

        if duplicate_queryset.exists():
            raise serializers.ValidationError(
                {
                    "non_field_errors": [
                        "Only one report per type is allowed for a user on a given report date."
                    ]
                }
            )

        return attrs

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

        read_only_fields = ["id", "created_at"]
