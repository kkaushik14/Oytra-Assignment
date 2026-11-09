from pathlib import Path
import json
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4

ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'task1-qa/findings.json').read_text())
out=ROOT/'task1-qa/Task1_QA_Report_Kumar_Kaushik.pdf'
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyQA',fontName='Helvetica',fontSize=10,leading=14,spaceAfter=8,textColor=colors.HexColor('#27364A')))
styles.add(ParagraphStyle(name='TitleQA',fontName='Helvetica-Bold',fontSize=25,leading=30,spaceAfter=14,textColor=colors.HexColor('#132C47')))
styles.add(ParagraphStyle(name='HeadingQA',fontName='Helvetica-Bold',fontSize=16,leading=21,spaceAfter=12,textColor=colors.HexColor('#132C47')))
styles.add(ParagraphStyle(name='SmallQA',fontName='Helvetica',fontSize=8,leading=11,spaceAfter=6,textColor=colors.HexColor('#526277')))
def p(text,style='BodyQA'):
    return Paragraph(escape(text).replace('\n','<br/>'),styles[style])
story=[p('Web Application QA & Debug Report','TitleQA'),p(data['author']+' | '+data['testedDate']),p(data['status'],'HeadingQA'),p(data['application']+'\n'+data['url']),Spacer(1,12),p('Scope and testing environment','HeadingQA'),p('Live browser testing on macOS using the in-app browser, DOM/accessibility inspection, computed-style measurements and a separate direct API request. Test data used a synthetic @example.com account and clearly labelled disposable content.'),p('Five reproducible findings','HeadingQA')]
rows=[[p('ID','SmallQA'),p('Finding','SmallQA'),p('Severity','SmallQA')]]
for f in data['findings']: rows.append([p(f['id'],'SmallQA'),p(f['title'],'SmallQA'),p(f['severity'],'SmallQA')])
t=Table(rows,colWidths=[48,330,80],hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#E8EFF5')),('VALIGN',(0,0),(-1,-1),'TOP'),('BOTTOMPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),9),('LINEBELOW',(0,0),(-1,-1),.4,colors.HexColor('#D1DAE3'))]));story+=[t,Spacer(1,16),p('Passing checks','HeadingQA'),p(data['passed'])]
for f in data['findings']:
    story += [PageBreak(),p(f["id"]+' | '+f['title'],'HeadingQA'),p('Severity: '+f['severity'])]
    for key,label in [('steps','Steps to reproduce'),('expected','Expected'),('actual','Actual'),('impact','Impact'),('cause','Suspected or confirmed cause'),('fix','Recommended fix')]:
        story.append(Paragraph('<b>'+label+':</b> '+escape(f[key]),styles['BodyQA']))
    story.append(p('Evidence: '+', '.join(f['evidence']),'SmallQA'))
    img=ROOT/'task1-qa/evidence'/f['image']
    if img.exists():
        w,h=ImageReader(str(img)).getSize(); scale=min(458/w,230/h)
        story += [Spacer(1,5),Image(str(img),width=w*scale,height=h*scale,hAlign='LEFT')]
story += [PageBreak(),p('Root-cause analysis | QA-05','HeadingQA'),p(data['rootCause']),Spacer(1,12),p('Limitations and exclusions','HeadingQA'),p(data['limitations']),Spacer(1,10),p('References','HeadingQA')]
for url in data['references']: story.append(p(url,'SmallQA'))
def footer(canvas,doc):
    canvas.setStrokeColor(colors.HexColor('#D1DAE3'));canvas.line(42,38,A4[0]-42,38)
    canvas.setFont('Helvetica',8);canvas.setFillColor(colors.HexColor('#526277'));canvas.drawString(42,25,'Oytra assessment | '+data['status']);canvas.drawRightString(A4[0]-42,25,str(doc.page))
SimpleDocTemplate(str(out),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=42,bottomMargin=50,title='RealWorld QA report - Kumar Kaushik',author=data['author']).build(story,onFirstPage=footer,onLaterPages=footer)
print(out)
