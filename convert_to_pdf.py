import os, subprocess, shutil

docx_path = os.path.abspath("../הצעת מחיר עסקית - המצפן האילתי - דנבר.docx")
pdf_path = os.path.abspath("../הצעת מחיר עסקית - המצפן האילתי - דנבר.pdf")

ps_script = f"""
$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {{
    $doc = $word.Documents.Open('{docx_path}')
    $doc.SaveAs('{pdf_path}', 17)
    $doc.Close($false)
    Write-Host "SUCCESS: Exported PDF to {pdf_path}"
}} catch {{
    Write-Error $_
}} finally {{
    $word.Quit()
}}
"""

ps_file = "convert_proposal.ps1"
with open(ps_file, "w", encoding="utf-8-sig") as f:
    f.write(ps_script)

res = subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", ps_file], capture_output=True, text=True)
print("STDOUT:", res.stdout.strip())
print("STDERR:", res.stderr.strip())

if os.path.exists(pdf_path):
    print("PDF size:", os.path.getsize(pdf_path))
    # Copy to client/public and client/dist for web access
    pub_pdf = os.path.abspath("client/public/הצעת מחיר עסקית - המצפן האילתי - דנבר.pdf")
    dist_pdf = os.path.abspath("client/dist/הצעת מחיר עסקית - המצפן האילתי - דנבר.pdf")
    pub_docx = os.path.abspath("client/public/הצעת מחיר עסקית - המצפן האילתי - דנבר.docx")
    dist_docx = os.path.abspath("client/dist/הצעת מחיר עסקית - המצפן האילתי - דנבר.docx")
    
    shutil.copyfile(pdf_path, pub_pdf)
    shutil.copyfile(pdf_path, dist_pdf)
    shutil.copyfile(docx_path, pub_docx)
    shutil.copyfile(docx_path, dist_docx)
    print("Copied PDF and DOCX to client/public and client/dist")
else:
    print("PDF NOT created!")

if os.path.exists(ps_file):
    os.remove(ps_file)
