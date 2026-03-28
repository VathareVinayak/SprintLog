from io import BytesIO
from xml.sax.saxutils import escape

from .exceptions import PdfGenerationError


def _safe_text(value):
    return escape(str(value or ""))


def generate_pdf_report(user, start_date, end_date, grouped_reports, ai_summary):
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import inch
        from reportlab.platypus import ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer
    except ImportError as exc:
        raise PdfGenerationError("PDF generation dependency is not installed.") from exc

    try:
        buffer = BytesIO()
        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = getSampleStyleSheet()
        body_style = styles["BodyText"]
        section_style = ParagraphStyle(
            "SectionTitle",
            parent=styles["Heading2"],
            spaceAfter=8,
        )
        subsection_style = ParagraphStyle(
            "SubSectionTitle",
            parent=styles["Heading3"],
            spaceAfter=6,
        )

        user_name = getattr(user, "full_name", "") or user.username
        highlights = ai_summary.get("highlights") or []

        story = [
            Paragraph("SprintLog PDF Report", styles["Title"]),
            Spacer(1, 0.2 * inch),
            Paragraph(f"<b>User:</b> {_safe_text(user_name)}", body_style),
            Paragraph(f"<b>Email:</b> {_safe_text(user.email)}", body_style),
            Paragraph(
                f"<b>Date Range:</b> {_safe_text(start_date)} to {_safe_text(end_date)}",
                body_style,
            ),
            Spacer(1, 0.2 * inch),
            Paragraph("AI Summary", section_style),
            Paragraph(_safe_text(ai_summary.get("summary", "")), body_style),
            Spacer(1, 0.15 * inch),
            Paragraph("Key Highlights", section_style),
        ]

        if highlights:
            story.append(
                ListFlowable(
                    [
                        ListItem(Paragraph(_safe_text(item), body_style))
                        for item in highlights
                    ],
                    bulletType="bullet",
                )
            )
        else:
            story.append(Paragraph("No highlights available.", body_style))

        story.append(Spacer(1, 0.25 * inch))
        story.append(Paragraph("Daily Reports", section_style))

        for day_group in grouped_reports:
            story.append(
                Paragraph(
                    _safe_text(day_group["report_date"].isoformat()),
                    styles["Heading3"],
                )
            )

            for report_type_group in day_group["report_types"]:
                story.append(
                    Paragraph(
                        _safe_text(report_type_group["report_type_label"]),
                        subsection_style,
                    )
                )

                for report in report_type_group["reports"]:
                    title = report.get("title") or "Untitled Report"
                    story.append(Paragraph(f"<b>Title:</b> {_safe_text(title)}", body_style))
                    story.append(
                        Paragraph(
                            f"<b>Content:</b> {_safe_text(report.get('content', ''))}",
                            body_style,
                        )
                    )
                    story.append(
                        Paragraph(
                            f"<b>Created At:</b> {_safe_text(report.get('created_at', ''))}",
                            body_style,
                        )
                    )
                    story.append(Spacer(1, 0.1 * inch))

            story.append(Spacer(1, 0.2 * inch))

        document.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        if not pdf_bytes:
            raise PdfGenerationError("Failed to generate PDF report.")

        return pdf_bytes
    except PdfGenerationError:
        raise
    except Exception as exc:
        raise PdfGenerationError("Failed to generate PDF report.") from exc
