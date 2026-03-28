from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from reports_api.models import Report, ReportType


User = get_user_model()


class ReportAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="vinayak",
            email="vinayak@example.com",
            password="strong-pass-123",
        )
        self.client.force_authenticate(user=self.user)

    def _create_report(
        self,
        report_type,
        report_date,
        title="Report",
        content="Worked on SprintLog.",
    ):
        return Report.objects.create(
            user=self.user,
            report_type=report_type,
            report_date=report_date,
            title=title,
            content=content,
        )

    def test_create_report_accepts_manual_report_date(self):
        report_date = timezone.localdate() - timedelta(days=3)

        response = self.client.post(
            reverse("create-report"),
            {
                "report_type": ReportType.SCRUM,
                "title": "Backdated Scrum",
                "content": "Completed API cleanup.",
                "report_date": report_date.isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["report_date"], report_date.isoformat())
        self.assertEqual(Report.objects.count(), 1)

    def test_create_report_prevents_duplicate_type_on_same_day(self):
        report_date = timezone.localdate()
        self._create_report(ReportType.SCRUM, report_date)

        response = self.client.post(
            reverse("create-report"),
            {
                "report_type": ReportType.SCRUM,
                "title": "Duplicate Scrum",
                "content": "Tried to add a second scrum entry.",
                "report_date": report_date.isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)
        self.assertEqual(Report.objects.count(), 1)

    def test_list_reports_supports_pagination_filter_search_and_ordering(self):
        base_date = timezone.localdate() - timedelta(days=5)
        report_types = [
            ReportType.SCRUM,
            ReportType.TRACK_CALL,
            ReportType.SPRINT_CALL,
            ReportType.SCRUM,
            ReportType.TRACK_CALL,
            ReportType.SPRINT_CALL,
        ]

        for index, report_type in enumerate(report_types):
            self._create_report(
                report_type=report_type,
                report_date=base_date + timedelta(days=index),
                title=f"Task {index}",
                content="Keyword match" if index == 2 else "General update",
            )

        list_response = self.client.get(reverse("list-reports"))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data["count"], 6)
        self.assertEqual(len(list_response.data["results"]), 5)

        filter_response = self.client.get(
            reverse("list-reports"),
            {"report_type": ReportType.TRACK_CALL},
        )
        self.assertEqual(filter_response.status_code, status.HTTP_200_OK)
        self.assertEqual(filter_response.data["count"], 2)

        search_response = self.client.get(
            reverse("list-reports"),
            {"search": "Keyword"},
        )
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        self.assertEqual(search_response.data["count"], 1)
        self.assertEqual(search_response.data["results"][0]["title"], "Task 2")

        ordering_response = self.client.get(
            reverse("list-reports"),
            {"ordering": "report_date"},
        )
        self.assertEqual(ordering_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            ordering_response.data["results"][0]["report_date"],
            base_date.isoformat(),
        )

    def test_analytics_endpoints_return_expected_shapes(self):
        today = timezone.localdate()
        dates = [
            today - timedelta(days=3),
            today - timedelta(days=2),
            today - timedelta(days=1),
            today,
        ]

        self._create_report(ReportType.SCRUM, dates[0], title="Day 1")
        self._create_report(ReportType.TRACK_CALL, dates[1], title="Day 2")
        self._create_report(ReportType.SPRINT_CALL, dates[2], title="Day 3")
        self._create_report(ReportType.SCRUM, dates[3], title="Day 4")

        weekly_response = self.client.get(reverse("weekly-activity"))
        self.assertEqual(weekly_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(weekly_response.data["days"]), 7)
        self.assertEqual(weekly_response.data["total_reports"], 4)

        distribution_response = self.client.get(reverse("report-distribution"))
        self.assertEqual(distribution_response.status_code, status.HTTP_200_OK)
        distribution = {
            item["report_type"]: item["count"]
            for item in distribution_response.data["distribution"]
        }
        self.assertEqual(distribution[ReportType.SCRUM], 2)
        self.assertEqual(distribution[ReportType.TRACK_CALL], 1)
        self.assertEqual(distribution[ReportType.SPRINT_CALL], 1)

        timeline_response = self.client.get(reverse("report-timeline"))
        self.assertEqual(timeline_response.status_code, status.HTTP_200_OK)
        self.assertEqual(timeline_response.data["total_days"], 4)
        self.assertEqual(timeline_response.data["timeline"][0]["date"], today.isoformat())

        streak_response = self.client.get(reverse("productivity-streak"))
        self.assertEqual(streak_response.status_code, status.HTTP_200_OK)
        self.assertEqual(streak_response.data["current_streak"], 4)
        self.assertEqual(streak_response.data["longest_streak"], 4)
        self.assertTrue(streak_response.data["active_today"])

    def test_dashboard_stats_returns_expected_keys(self):
        today = timezone.localdate()
        self._create_report(ReportType.SCRUM, today, title="Today Scrum")
        self._create_report(
            ReportType.TRACK_CALL,
            today - timedelta(days=1),
            title="Yesterday Track",
        )

        response = self.client.get(reverse("dashboard-stats"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(set(response.data.keys()), {
            "total_reports",
            "today_reports",
            "this_week_reports",
            "report_type_distribution",
            "recent_reports",
        })
        self.assertIsInstance(response.data["total_reports"], int)
        self.assertIsInstance(response.data["today_reports"], int)
        self.assertIsInstance(response.data["this_week_reports"], int)
        self.assertIsInstance(response.data["report_type_distribution"], dict)
        self.assertIsInstance(response.data["recent_reports"], list)

    def test_heatmap_supports_custom_range_and_validation(self):
        today = timezone.localdate()
        start_date = today - timedelta(days=2)

        self._create_report(ReportType.SCRUM, today - timedelta(days=1), title="Heat")

        response = self.client.get(
            reverse("report-heatmap"),
            {
                "start_date": start_date.isoformat(),
                "end_date": today.isoformat(),
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["start_date"], start_date.isoformat())
        self.assertEqual(response.data["end_date"], today.isoformat())
        self.assertEqual(len(response.data["heatmap"]), 3)
        self.assertEqual(response.data["heatmap"][1]["count"], 1)

        invalid_response = self.client.get(
            reverse("report-heatmap"),
            {"start_date": "2026-99-99"},
        )
        self.assertEqual(invalid_response.status_code, status.HTTP_400_BAD_REQUEST)
