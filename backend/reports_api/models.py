from django.db import models
from django.conf import settings
from django.utils import timezone


class ReportType(models.TextChoices):
    SCRUM = "SCRUM", "Scrum Call"
    TRACK_CALL = "TRACK_CALL", "Track Call"
    SPRINT_CALL = "SPRINT_CALL", "Sprint Call"


class Report(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports"
    )

    report_type = models.CharField(
        max_length=20,
        choices=ReportType.choices
    )

    title = models.CharField(max_length=500, blank=True)

    content = models.TextField()

    # correct default date
    report_date = models.DateField(default=timezone.localdate, db_index=True)

    # actual creation timestamp
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "report_type", "report_date"],
                name="unique_user_report_type_per_day",
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.report_type} - {self.report_date}"
