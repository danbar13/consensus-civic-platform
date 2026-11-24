import os, sys, subprocess
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def build_proposal_doc(template_path, output_docx_path):
    doc = docx.Document(template_path)
    section = doc.sections[0]

    # Margins: Top 3.0cm for letterhead, 0.9 in left/right/bottom
    section.left_margin = Inches(0.9)
    section.right_margin = Inches(0.9)
    section.bottom_margin = Inches(0.85)

    # 1. Align Header to Right (Logo and phone details)
    header = section.header
    for h_p in header.paragraphs:
        h_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        h_pPr = h_p._p.get_or_add_pPr()
        jc_elems = h_pPr.findall(qn('w:jc'))
        for j in jc_elems:
            h_pPr.remove(j)
        h_pPr.append(parse_xml(f'<w:jc {nsdecls("w")} w:val="right"/>'))
        h_pPr.append(parse_xml(f'<w:bidi {nsdecls("w")}/>'))

    # 2. Configure Footer: Strictly Right-Aligned with divider line and page numbering
    footer = section.footer
    f_p = footer.paragraphs[0]
    f_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    f_pPr = f_p._p.get_or_add_pPr()
    jc_elems = f_pPr.findall(qn('w:jc'))
    for j in jc_elems:
        f_pPr.remove(j)
    f_pPr.append(parse_xml(f'<w:jc {nsdecls("w")} w:val="right"/>'))
    f_pPr.append(parse_xml(f'<w:pBdr {nsdecls("w")}><w:top w:val="single" w:sz="6" w:space="4" w:color="CBD5E1"/></w:pBdr>'))
    f_pPr.append(parse_xml(f'<w:bidi {nsdecls("w")}/>'))

    r_f1 = f_p.add_run("דנבר ייעוץ אסטרטגי, ארגוני ומשאבי אנוש  |  הצעת מחיר: 'המצפן האילתי' למערכת 'ערב ערב באילת'  |  עמוד ")
    r_f1.font.name = "Arial"
    r_f1.font.size = Pt(8.5)
    r_f1.font.color.rgb = RGBColor(100, 116, 139)
    r_f1Pr = r_f1._r.get_or_add_rPr()
    r_f1Pr.append(parse_xml(f'<w:rFonts {nsdecls("w")} w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>'))
    r_f1Pr.append(parse_xml(f'<w:rtl {nsdecls("w")}/>'))

    fld1 = parse_xml(f'<w:fldSimple {nsdecls("w")} w:instr="PAGE"><w:r><w:rPr><w:rFonts w:ascii="Arial" w:cs="Arial"/><w:sz w:val="17"/><w:color w:val="64748B"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>')
    f_p._p.append(fld1)

    r_f2 = f_p.add_run(" מתוך ")
    r_f2.font.name = "Arial"
    r_f2.font.size = Pt(8.5)
    r_f2.font.color.rgb = RGBColor(100, 116, 139)
    r_f2Pr = r_f2._r.get_or_add_rPr()
    r_f2Pr.append(parse_xml(f'<w:rFonts {nsdecls("w")} w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>'))
    r_f2Pr.append(parse_xml(f'<w:rtl {nsdecls("w")}/>'))

    fld2 = parse_xml(f'<w:fldSimple {nsdecls("w")} w:instr="NUMPAGES"><w:r><w:rPr><w:rFonts w:ascii="Arial" w:cs="Arial"/><w:sz w:val="17"/><w:color w:val="64748B"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>')
    f_p._p.append(fld2)

    # Helper functions for adding rich RTL content
    def add_para(text="", align=WD_ALIGN_PARAGRAPH.RIGHT, space_before=2, space_after=4, line_spacing=1.15):
        p = doc.add_paragraph()
        p.alignment = align
        pPr = p._p.get_or_add_pPr()
        pPr.append(parse_xml(f'<w:jc {nsdecls("w")} w:val="right"/>'))
        pPr.append(parse_xml(f'<w:bidi {nsdecls("w")}/>'))
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        if text:
            add_run(p, text)
        return p

    def add_page_break_rtl():
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        pPr = p._p.get_or_add_pPr()
        pPr.append(parse_xml(f'<w:jc {nsdecls("w")} w:val="right"/>'))
        pPr.append(parse_xml(f'<w:bidi {nsdecls("w")}/>'))
        r = p.add_run()
        r._r.append(parse_xml(f'<w:br {nsdecls("w")} w:type="page"/>'))
        return p

    def add_run(para, text, bold=False, italic=False, font_size=10.5, color_rgb=(30, 41, 59), font_name="Arial"):
        run = para.add_run(text)
        run.bold = bold
        run.italic = italic
        run.font.name = font_name
        run.font.size = Pt(font_size)
        run.font.color.rgb = RGBColor(*color_rgb)
        rPr = run._r.get_or_add_rPr()
        rPr.append(parse_xml(f'<w:rFonts {nsdecls("w")} w:ascii="{font_name}" w:hAnsi="{font_name}" w:cs="{font_name}"/>'))
        rPr.append(parse_xml(f'<w:rtl {nsdecls("w")}/>'))
        rPr.append(parse_xml(f'<w:lang {nsdecls("w")} w:val="he-IL" w:bidi="he-IL"/>'))
        return run

    def add_heading_1(text):
        p = add_para(space_before=12, space_after=5)
        pPr = p._p.get_or_add_pPr()
        pPr.append(parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="14" w:space="4" w:color="0C1938"/></w:pBdr>'))
        add_run(p, text, bold=True, font_size=13.5, color_rgb=(12, 25, 56))
        return p

    def add_heading_2(text):
        p = add_para(space_before=9, space_after=3)
        add_run(p, text, bold=True, font_size=11.5, color_rgb=(194, 65, 12))
        return p

    def add_bullet(bold_prefix, text):
        p = add_para(space_before=2, space_after=3)
        p.paragraph_format.right_indent = Pt(14)
        add_run(p, "▪  ", bold=True, font_size=9, color_rgb=(194, 65, 12))
        if bold_prefix:
            add_run(p, bold_prefix, bold=True, font_size=10, color_rgb=(15, 23, 42))
        add_run(p, text, bold=False, font_size=10, color_rgb=(51, 65, 85))
        return p

    # Remove initial empty paragraph if present
    if len(doc.paragraphs) > 0 and not doc.paragraphs[0].text.strip():
        p_elem = doc.paragraphs[0]._p
        p_elem.getparent().remove(p_elem)

    # ==================== PAGE 1: BACKGROUND & VALUE PROPOSITION ====================

    # Header Details Box (Date, Addressee, Subject) - Strictly Right-Aligned
    meta_p = add_para(space_before=4, space_after=10)
    meta_pPr = meta_p._p.get_or_add_pPr()
    meta_pPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="F8FAFC"/>'))
    meta_pPr.append(parse_xml(f'<w:pBdr {nsdecls("w")}><w:right w:val="single" w:sz="24" w:space="8" w:color="0C1938"/><w:top w:val="single" w:sz="4" w:space="6" w:color="E2E8F0"/><w:bottom w:val="single" w:sz="4" w:space="6" w:color="E2E8F0"/><w:left w:val="single" w:sz="4" w:space="6" w:color="E2E8F0"/></w:pBdr>'))
    
    add_run(meta_p, "תאריך: ", bold=True, font_size=10, color_rgb=(71, 85, 105))
    add_run(meta_p, "24 בנובמבר 2026\n", bold=False, font_size=10, color_rgb=(15, 23, 42))
    add_run(meta_p, "לכבוד: ", bold=True, font_size=10, color_rgb=(71, 85, 105))
    add_run(meta_p, "הנהלת ומערכת \"ערב ערב באילת\" | רשת יום יום אילת\n", bold=True, font_size=10.5, color_rgb=(12, 25, 56))
    add_run(meta_p, "מאת: ", bold=True, font_size=10, color_rgb=(71, 85, 105))
    add_run(meta_p, "דני ברקאי – דנבר ייעוץ אסטרטגי, ארגוני ומשאבי אנוש (אילת)\n", bold=True, font_size=10, color_rgb=(15, 23, 42))
    add_run(meta_p, "הנדון: ", bold=True, font_size=10, color_rgb=(71, 85, 105))
    add_run(meta_p, "הצעה עסקית ומודל התקשרות – פלטפורמת \"המצפן האילתי\" (מדור שיתוף ציבור, סקרים חכמים ומיפוי קונצנזוס אזרחי מבוסס AI)", bold=True, font_size=10.5, color_rgb=(194, 65, 12))

    # 1. Executive Summary
    add_heading_1("1. רקע, חזון והערך העיתונאי-כלכלי")
    
    p_intro = add_para(space_before=3, space_after=5)
    add_run(p_intro, "אנו שמחים להגיש בפני מערכת \"ערב ערב באילת\" הצעה עסקית ייחודית להשקת ", color_rgb=(51, 65, 85))
    add_run(p_intro, "\"המצפן האילתי\"", bold=True, color_rgb=(12, 25, 56))
    add_run(p_intro, " — פלטפורמת הדור-החדש לשיתוף ציבור, סקרים אינטראקטיביים ומיפוי קונצנזוס אזרחי (CivicTech) המבוססת על מודל Polis העולמי ומנועי בינה מלאכותית (Gemini AI).", color_rgb=(51, 65, 85))

    p_synergy = add_para(space_before=2, space_after=4)
    add_run(p_synergy, "המערכת נבנתה במיוחד כדי להתחבר לשגרה העיתונאית השבועית של \"ערב ערב\" וליצור סינרגיה מושלמת בין הדיגיטל לעיתון המודפס:\n", color_rgb=(51, 65, 85))
    add_bullet("מעורבות שיא בדיגיטל (חמישי עד שלישי): ", "הקוראים מצביעים על היגדים בוערים, רואים לאיזו קבוצת דעה הם שייכים, ומציעים היגדים חדשים משלהם. מנוע ה-AI מסנן בזמן אמת לשון הרע, שמות וגידופים ומאשר היגדים תוך שניות.")
    add_bullet("אימפקט עיתונאי בדפוס (סגירת גיליון בימי רביעי): ", "אלגוריתם הקונצנזוס מייצר אוטומטית פילוח עומק וגרף קונצנזוס בלעדי המועברים למערכת העיתון לעימוד במדור ייעודי לקראת ירידת העיתון לדפוס.")
    add_bullet("מרכז רווח חדש מיום 1: ", "במקום הוצאה כספית, המדור מייצר לעיתון אפיק הכנסה מסחרי חדש ורווחי ביותר באמצעות חסות עסקית קבועה (ספונסר מסחרי מוביל באילת).")

    # 2. Key Technological & Editorial Features
    add_heading_1("2. מפרט היכולות והגנות המערכת")
    add_bullet("אלגוריתם קונצנזוס חכם: ", "זיהוי הסכמות רחבות (80%+) בין קבוצות קוטביות (למשל: תושבי השכונות הוותיקות מול השחמון, עצמאים מול שכירים, נהגים מול הולכי רגל) במקום ליבוי יצרים.")
    add_bullet("הגנה משפטית מלאה מלשון הרע: ", "שכבת בקרת איכות קפדנית ע\"י AI שמונעת חשיפת העיתון לתביעות דיבה, חוסמת שמות פרטיים והשמצות אישיות, ומבטיחה שקט מוחלט לעורכים.")
    add_bullet("ווידג'ט הטמעה קל ורספונסיבי: ", "הטמעה מלאה של שורת קוד אחת (iFrame Embed) בכל כתבה באתר yomyom.net, תמיכה מלאה במובייל ודסקטופ ועיצוב מותאם (Light / Dark Mode).")
    add_bullet("פאנל ניהול ועריכה עצמאי (Admin Desk): ", "ממשק עורכים נקי המאפשר פתיחת משאלים חדשים, בדיקת נתונים בזמן אמת, וייצוא גרפים ודוחות מותאמים לדפוס בלחיצת כפתור.")

    # ==================== PAGE 2: COMMERCIAL TIERS ====================
    add_page_break_rtl()

    add_heading_1("3. ארבעת מסלולי ההתקשרות והמודלים המסחריים")
    p_tiers_intro = add_para(space_before=2, space_after=6)
    add_run(p_tiers_intro, "כדי לאפשר גמישות מרבית למערכת העיתון, גיבשנו 4 מסלולי התקשרות מובנים. המערכת יכולה לבחור במסלול שותפות חסויות (ללא עלות לעיתון ורווח נקי מיום 1), בפיילוט בדיקה ממוקד, בריטיינר שנתי מלא, או ברכישת רישיון קבוע:")

    # Tier 1
    add_heading_2("מסלול 1: פיילוט ממוקד (חודשיים הרצה) – ₪2,500 / חודש (סה\"כ ₪5,000)")
    add_bullet("מטרה: ", "בדיקת שטח חיה של היענות הקוראים, איכות הדיון ופוטנציאל המפרסמים ללא כל התחייבות ארוכת טווח.")
    add_bullet("תכולה: ", "8 משאלים שבועיים בנושאים אילתיים בוערים | הטמעה מלאה ב-yomyom.net (Mobile & Desktop) | הפקת גרף ופילוח תובנות מותאם לדפוס לקראת גיליון רביעי | ניטור וסינון AI מלא (Gemini API) ללא עלות שרתים נוספת.")
    add_bullet("התאמה: ", "מושלם לבחינה מוקדמת של ביצועי המדור בשטח בטרם התחייבות רחבה.")

    # Tier 2
    add_heading_2("מסלול 2: שותפות חסויות מסחריות (המסלול המומלץ – ₪0 עלות לעיתון / רווח נקי מיום 1)")
    add_bullet("מודל שותפות: ", "מודל חצי-חצי (50% / 50%) בחסות מסחרית קבועה מחברות מובילות באילת (נדל\"ן, רכב, בנקאות, תיירות ומלונאות).")
    add_bullet("תמחור ורווח: ", "גיוס ספונסר מסחרי בסך ₪7,000 – ₪10,000 לחודש. העיתון גוזר רווח נקי של ₪4,000+ נטו בכל חודש ללא כל השקעה כספית או סיכון!")
    add_bullet("תכולה: ", "DANBAR מנהלת באופן מלא את כל התפעול, הניסוחים, האלגוריתם והפקת החומרים לדפוס | מיתוג בלעדי של הספונסר בווידג'ט הדיגיטלי ובכתבה השבועית המודפסת בעיתון | הכנסה חדשה מובטחת מיום ההשקה.")
    add_bullet("יתרון עסקי מכריע: ", "אפס עלות לעיתון, אפס התעסקות תפעולית, ורווח כספי מיידי החל מהמשאל הראשון.")

    # Tier 3
    add_heading_2("מסלול 3: ריטיינר שנתי מלא (שירות Turnkey כולל) – ₪2,000 / חודש (התחייבות שנתית)")
    add_bullet("מטרה: ", "ליווי אסטרטגי שנתי כולל, שדרוגים רציפים, ניהול שוטף ויצירת נכס תוכן מוביל.")
    add_bullet("תכולה: ", "52 משאלים שבועיים + משאלי בזק מיוחדים בעת אירועים חדשותיים חריגים באילת | דוחות עומק רבעוניים מיוחדים (Civic Trends) | זמינות ייעוץ אישית וליווי סגירת הגיליון בימי רביעי | בלעדיות תקשורתית מלאה באזור אילת והערבה.")
    add_bullet("הכנסות מפרסום: ", "כל הכנסות החסויות והפרסום במדור נשארות במלואן (100%) אצל העיתון.")

    # Tier 4
    add_heading_2("מסלול 4: רכישת רישיון שימוש מלא לצמיתות (White-Label) – ₪30,000 חד-פעמי")
    add_bullet("מטרה: ", "בעלות קבועה על נכס טכנולוגי ודיגיטלי עצמאי של העיתון ללא תלות בריטיינר שוטף.")
    add_bullet("תכולה: ", "רישיון שימוש בלעדי לצמיתות במותג \"ערב ערב באילת\" | אינטגרציה טכנולוגית מלאה ב-yomyom.net והדרכת צוות העורכים | שנה ראשונה כוללת ענן, שרתים ותעבורת AI | החל משנה ב': ₪400 / חודש בלבד עבור ענן ותחזוקה, או העברת חשבונות הענן לניהול ישיר של העיתון לבחירתכם | בלעדיות אזורית מוחלטת.")

    # ==================== PAGE 3: COMPARISON TABLE, ROADMAP & SIGNATURE ====================
    add_page_break_rtl()

    add_heading_1("4. טבלת השוואה מרוכזת של המסלולים")

    table_data = [
        ["מאפיין", "מסלול 1: פיילוט ממוקד", "מסלול 2: שותפות חסויות (מומלץ)", "מסלול 3: ריטיינר שנתי מלא", "מסלול 4: רישיון מלא לצמיתות"],
        ["עלות לעיתון", "₪2,500 / חודש", "₪0 (ללא עלות)", "₪2,000 / חודש", "₪30,000 חד-פעמי"],
        ["רווח נקי צפוי לעיתון", "בחינת שטח", "₪4,000+ / חודש", "חסויות 100% לעיתון", "נכס בבעלות מלאה"],
        ["משך התקשרות", "חודשיים (8 שבועות)", "שנתי (מתחדש)", "שנתי (12 חודשים)", "לצמיתות (קבוע)"],
        ["היקף משאלים", "8 משאלים שבועיים", "שוטף (שבועי)", "52 שבועיים + משאלי בזק", "ללא הגבלה"],
        ["עיבוד גרפי לדפוס", "כלול בכל שבוע", "כלול + מיתוג ספונסר", "כלול + דוחות רבעוניים", "כלול (הדרכת המערכת)"],
        ["ניהול ותפעול AI", "ע\"י DANBAR", "ע\"י DANBAR מלא", "ע\"י DANBAR מלא", "הדרכה + ליווי שנתי"],
        ["בלעדיות באילת", "בתקופת הפיילוט", "בלעדיות מלאה", "בלעדיות מלאה", "בלעדיות מלאה לצמיתות"]
    ]

    col_widths = [Inches(1.55), Inches(1.20), Inches(1.32), Inches(1.20), Inches(1.20)]
    
    # Table strictly right-aligned
    table = doc.add_table(rows=len(table_data), cols=5)
    table.alignment = WD_TABLE_ALIGNMENT.RIGHT
    tblPr = table._tbl.tblPr
    tblPr.append(parse_xml(f'<w:bidiVisual {nsdecls("w")}/>'))

    for r_idx, row in enumerate(table_data):
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            cell.width = col_widths[c_idx]
            
            # cell margins & borders
            tcPr = cell._tc.get_or_add_tcPr()
            tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar>')
            tcPr.append(tcMar)
            
            # subtle borders
            borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/><w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/><w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/></w:tcBorders>')
            tcPr.append(borders)

            p = cell.paragraphs[0]
            # ALL CELLS STRICTLY RIGHT-ALIGNED!
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            pPr = p._p.get_or_add_pPr()
            jc_elems = pPr.findall(qn('w:jc'))
            for j in jc_elems:
                pPr.remove(j)
            pPr.append(parse_xml(f'<w:jc {nsdecls("w")} w:val="right"/>'))
            pPr.append(parse_xml(f'<w:bidi {nsdecls("w")}/>'))
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)

            if r_idx == 0:
                # Header row
                tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="0C1938"/>'))
                run = p.add_run(val)
                run.bold = True
                run.font.name = "Arial"
                run.font.size = Pt(9)
                run.font.color.rgb = RGBColor(255, 255, 255)
            elif c_idx == 2:
                # Recommended track highlight column
                tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="FEF3C7"/>'))
                run = p.add_run(val)
                run.bold = (r_idx in [1, 2])
                run.font.name = "Arial"
                run.font.size = Pt(8.5)
                run.font.color.rgb = RGBColor(180, 83, 9) if r_idx in [1, 2] else RGBColor(30, 41, 59)
            else:
                # Normal rows
                if r_idx % 2 == 1:
                    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="F8FAFC"/>'))
                run = p.add_run(val)
                run.bold = (c_idx == 0 or r_idx in [1, 2])
                run.font.name = "Arial"
                run.font.size = Pt(8.5)
                run.font.color.rgb = RGBColor(15, 23, 42)

            rPr = run._r.get_or_add_rPr()
            rPr.append(parse_xml(f'<w:rFonts {nsdecls("w")} w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>'))
            rPr.append(parse_xml(f'<w:rtl {nsdecls("w")}/>'))
            rPr.append(parse_xml(f'<w:lang {nsdecls("w")} w:val="he-IL" w:bidi="he-IL"/>'))

    # Repeat header row on table
    trPr = table.rows[0]._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))

    # 5. Implementation & Roadmap
    add_heading_1("5. לוח זמנים ליישום והשקה (Time-to-Market)")
    add_bullet("שבוע 1 – הגדרות ותיאום מערכתי: ", "הגדרת נושא המשאל הראשון, הטמעת קוד הווידג'ט באתר yomyom.net, וביצוע בדיקות קצה-אל-קצה.")
    add_bullet("שבוע 2 – השקת משאל הבכורה: ", "פתיחת ההצבעה לקוראים בדיגיטל, מעקב אחר קצב ההיגדים, והפקת גרף הקונצנזוס הראשון לעימוד בגיליון יום רביעי.")
    add_bullet("שגרת עבודה שוטפת: ", "העלאת משאל חדש מדי יום חמישי, איסוף וסינון AI רציף בסופ\"ש ובתחילת השבוע, מסירת חומרים מוכנים לדפוס מדי יום רביעי ב-11:00.")

    # 6. Trust, Commitment & Signature
    add_heading_1("6. מחויבות, אחריות אישית והתקשרות")
    p_commit = add_para(space_before=3, space_after=6)
    add_run(p_commit, "ההתקשרות הינה אישית וישירה מול ", color_rgb=(51, 65, 85))
    add_run(p_commit, "דני ברקאי", bold=True, color_rgb=(12, 25, 56))
    add_run(p_commit, ". אנו ערבים לאחריות ביצוע מלאה, שקט עיתונאי ומשפטי, סינון מובנה ללא פשרות, ועמידה מדויקת ובלתי מתפשרת בלוחות הזמנים של הדפוס. אנו מזמינים אתכם לפגישת התאמה אישית במערכת העיתון ללא כל התחייבות.", color_rgb=(51, 65, 85))

    # Signature Block - Strictly Right-Aligned
    sig_p = add_para(space_before=10, space_after=2)
    add_run(sig_p, "בברכה ובהערכה רבה,\n", bold=True, font_size=10.5, color_rgb=(12, 25, 56))
    add_run(sig_p, "דני ברקאי\n", bold=True, font_size=12, color_rgb=(194, 65, 12))
    add_run(sig_p, "דנבר – ייעוץ אסטרטגי, ארגוני ומשאבי אנוש\n", bold=True, font_size=10, color_rgb=(30, 41, 59))
    add_run(sig_p, "אילת  |  טלפון נייד: 052-5340230  |  דוא\"ל: danbar.ai22@gmail.com", bold=False, font_size=9.5, color_rgb=(71, 85, 105))

    doc.save(output_docx_path)
    print(f"Document successfully created at {output_docx_path}")

if __name__ == '__main__':
    template = os.path.abspath("../מסטר דנבר.docx")
    out_docx = os.path.abspath("../הצעת מחיר עסקית - המצפן האילתי - דנבר.docx")
    build_proposal_doc(template, out_docx)
