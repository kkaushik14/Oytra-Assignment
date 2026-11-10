from pathlib import Path
import json
from xml.sax.saxutils import escape
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'task1-qa/findings.json').read_text())
out = ROOT / 'task1-qa/Task1_QA_Report_Kumar_Kaushik.pdf'

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleQA', fontName='Helvetica-Bold', fontSize=18, leading=22, spaceAfter=4, textColor=colors.HexColor('#0F2942')))
styles.add(ParagraphStyle(name='SubTitleQA', fontName='Helvetica', fontSize=8.5, leading=11, spaceAfter=8, textColor=colors.HexColor('#4A5D73')))
styles.add(ParagraphStyle(name='HeadingQA', fontName='Helvetica-Bold', fontSize=12, leading=16, spaceBefore=4, spaceAfter=4, textColor=colors.HexColor('#0F2942')))
styles.add(ParagraphStyle(name='SubHeadingQA', fontName='Helvetica-Bold', fontSize=9, leading=12, spaceBefore=4, spaceAfter=2, textColor=colors.HexColor('#1E3D59')))
styles.add(ParagraphStyle(name='BodyQA', fontName='Helvetica', fontSize=8.5, leading=12, spaceAfter=4, textColor=colors.HexColor('#233240')))
styles.add(ParagraphStyle(name='SmallQA', fontName='Helvetica', fontSize=7, leading=9, spaceAfter=2, textColor=colors.HexColor('#475569')))
styles.add(ParagraphStyle(name='TableHdrQA', fontName='Helvetica-Bold', fontSize=7, leading=9, textColor=colors.white))
styles.add(ParagraphStyle(name='TableBodyQA', fontName='Helvetica', fontSize=6.5, leading=8.5, textColor=colors.HexColor('#1C2833')))
styles.add(ParagraphStyle(name='TableSevQA', fontName='Helvetica-Bold', fontSize=7, leading=9, alignment=TA_CENTER))

def p(text, style='BodyQA'):
    return Paragraph(escape(text).replace('\n', '<br/>'), styles[style])

story = []

# ==================== PAGE 1: EXECUTIVE SUMMARY & SECTION 5 BUG REPORT TABLE ====================
story.append(p('Web Application QA & Debug Report', 'TitleQA'))
story.append(p(f"Author: {data['author']}  |  Target: {data['application']} ({data['url']})  |  Status: {data['status']}", 'SubTitleQA'))
story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#CBD5E1'), spaceAfter=6))

meta_text = (
    f"<b>Target Application & Scope:</b> Live angular frontend at <u>{escape(data['url'])}</u> with session-isolated backend. "
    f"Evaluated core user flows: registration, authentication, article authoring, editing, deletion, tag filtering, "
    f"commenting, keyboard accessibility (WCAG 2.2), and API edge cases. All 5 issues reproduced under controlled test conditions."
)
story.append(Paragraph(meta_text, styles['SmallQA']))
story.append(Spacer(1, 4))

story.append(p('5. Bug Report Table (Assessment Template Compliance)', 'SubHeadingQA'))

headers = [
    Paragraph('<b>#</b>', styles['TableHdrQA']),
    Paragraph('<b>Title / Summary</b>', styles['TableHdrQA']),
    Paragraph('<b>Steps to Reproduce</b>', styles['TableHdrQA']),
    Paragraph('<b>Expected vs Actual</b>', styles['TableHdrQA']),
    Paragraph('<b>Severity</b>', styles['TableHdrQA']),
    Paragraph('<b>Suspected Cause</b>', styles['TableHdrQA']),
]

table_rows = [headers]
for i, f in enumerate(data['findings'], start=1):
    sev = f['severity']
    sev_color = '#C0392B' if sev == 'Critical' else ('#D35400' if sev == 'High' else ('#2980B9' if sev == 'Medium' else '#27AE60'))
    
    exp_act = f"<b>Exp:</b> {escape(f['expected'])}<br/><br/><b>Act:</b> {escape(f['actual'])}"
    
    sev_para = Paragraph(f"<font color='{sev_color}'><b>{sev}</b></font>", styles['TableSevQA'])
    
    row = [
        Paragraph(f"<b>{i}</b><br/><font color='#64748B'>({f['id']})</font>", styles['TableBodyQA']),
        Paragraph(escape(f['title']), styles['TableBodyQA']),
        Paragraph(escape(f['steps']), styles['TableBodyQA']),
        Paragraph(exp_act, styles['TableBodyQA']),
        sev_para,
        Paragraph(escape(f['cause']), styles['TableBodyQA'])
    ]
    table_rows.append(row)

col_widths = [26, 96, 118, 145, 48, 90]
t = Table(table_rows, colWidths=col_widths, repeatRows=1)
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1A365D')),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('TOPPADDING', (0, 0), (-1, -1), 2.5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
    ('LEFTPADDING', (0, 0), (-1, -1), 2.5),
    ('RIGHTPADDING', (0, 0), (-1, -1), 2.5),
    ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#CBD5E1')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
]))
story.append(t)
story.append(Spacer(1, 4))

story.append(p('<b>Verified Passing Baseline Checks:</b> ' + escape(data['passed']), 'SmallQA'))

# ==================== PAGES 2-6: INDIVIDUAL DEEP DIVES WITH SCREENSHOTS ====================
for f in data['findings']:
    story.append(PageBreak())
    sev = f['severity']
    sev_color = '#C0392B' if sev == 'Critical' else ('#D35400' if sev == 'High' else ('#2980B9' if sev == 'Medium' else '#27AE60'))
    
    story.append(p(f"{f['id']} — {f['title']}", 'HeadingQA'))
    story.append(Paragraph(f"<b>Severity:</b> <font color='{sev_color}'><b>{sev}</b></font>  |  <b>Category:</b> Functional / Accessibility  |  <b>Target:</b> Conduit Web App", styles['BodyQA']))
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#E2E8F0'), spaceAfter=8))
    
    details = [
        ('Steps to Reproduce', f['steps']),
        ('Expected Behaviour', f['expected']),
        ('Actual Behaviour', f['actual']),
        ('User Impact', f['impact']),
        ('Suspected / Confirmed Cause', f['cause']),
        ('Recommended Remediation', f['fix']),
    ]
    for lbl, val in details:
        story.append(Paragraph(f"<b>{lbl}:</b> {escape(val)}", styles['BodyQA']))
    
    story.append(p('Attached Evidence Artifacts: ' + ', '.join(f['evidence']), 'SmallQA'))
    
    img = ROOT / 'task1-qa/evidence' / f['image']
    if img.exists():
        w, h = ImageReader(str(img)).getSize()
        scale = min(500 / w, 230 / h)
        story.append(Spacer(1, 6))
        story.append(Image(str(img), width=w * scale, height=h * scale, hAlign='LEFT'))

# ==================== PAGE 7: ROOT CAUSE ANALYSIS & METHODOLOGY ====================
story.append(PageBreak())
story.append(p('Root-Cause Analysis — In-Depth Investigation (QA-05)', 'HeadingQA'))
story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#CBD5E1'), spaceAfter=8))
story.append(p(data['rootCause'], 'BodyQA'))
story.append(Spacer(1, 10))

story.append(p('Investigation Scope, Limitations & Excluded Observations', 'HeadingQA'))
story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#CBD5E1'), spaceAfter=8))
story.append(p(data['limitations'], 'BodyQA'))
story.append(Spacer(1, 10))

story.append(p('Technical References & Standards Grounding', 'HeadingQA'))
story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#CBD5E1'), spaceAfter=8))
for url in data['references']:
    story.append(p(f"• {url}", 'SmallQA'))

def footer(canvas, doc):
    canvas.setStrokeColor(colors.HexColor('#CBD5E1'))
    canvas.line(36, 30, A4[0] - 36, 30)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#64748B'))
    canvas.drawString(36, 18, f"Oytra Assessment | Task 1 QA Report | {data['author']}")
    canvas.drawRightString(A4[0] - 36, 18, f"Page {doc.page} of 7")

doc = SimpleDocTemplate(
    str(out),
    pagesize=A4,
    rightMargin=36,
    leftMargin=36,
    topMargin=30,
    bottomMargin=38,
    title=f"Task 1 QA Report - {data['author']}",
    author=data['author']
)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f"Successfully compiled: {out}")
