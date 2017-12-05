#!/usr/bin/python

import subprocess, sys

commands = [
    ['pdflatex', 'thesis' + '.tex'],
    ['bibtex',   'thesis.aux'],
    ['pdflatex', 'thesis.tex'],
    ['pdflatex',  'thesis.tex']
]

for c in commands:
    subprocess.call(c)

print 'zipping folder'
    
import shutil
shutil.make_archive('/u/16/dellap1/unix/Desktop/ThesisBackup', 'zip', '/u/16/dellap1/unix/Desktop/Tesi/')