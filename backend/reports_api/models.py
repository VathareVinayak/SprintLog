from django.db import models
from django.conf import settings 

# Create your models here.
# choices for report type (expandable later)
class ReportType(models.TextChoices):
    SCRUM = "SCRUM", "Scrum Call"
    TRACK_CALL = "TRACK_CALL", "Track Call"
    SPRINT_CALL = "SPRINT_CALL", "Sprint Call"


# main report model
class Report(models.Model):

    # report belongs to a specific user
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports"
    )

    # type of report
    report_type = models.CharField(
        max_length=20,
        choices=ReportType.choices
    )

    # optional title
    title = models.CharField(max_length=500, blank=True)

    # main text content (what you enter daily)
    content = models.TextField()

    # logical date of report
    report_date = models.DateField(auto_now_add=True)

    # auto timestamp
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.report_type} - {self.report_date}"