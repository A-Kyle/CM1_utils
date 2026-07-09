# Utilities for Cloud Model 1 (CM1)
#### Repo created 6 July 2026

This repository contains utility scripts and notebooks for 
use with Cloud Model 1 (CM1) that may be of general use.
There is currently only one functionality provided here:
The generation of __lsnudge__ (background sounding) files,
with customizable specifications of various properties of the wind profile,
that can be used to set or nudge the background in CM1 simulations. 

## Summary of contents

- __gen_background.gs__ : A Grid Analysis and Display System (GrADS) script
that generates an __lsnudge__ file with winds that satisfy specifications
of mean-layer steering, vertical shear, and steering-relative helicity.
Also saves an image __demo_<name>.png__ of the hodograph from
the generated __lsnudge__ file. Requires an __input_sounding__ 
file to populate background profiles of temperature and moisture.
- __gen_background.py__ : A Python script that generates __lsnudge__ files
as in __gen_background.gs__---requires __input_sounding__.
- __gen_background.ipynb__ : A Jupyter Notebook that generates __lsnudge__ files
as in __gen_background.gs__---requires __input_sounding__.
- __input_sounding__ : Taken from Dunion (2011).
- __lsnudge_0001.dat.testgs__ : An example __lsnudge__ file generated
using __gen_background.gs__.
- __lsnudge_0001.dat.testpy__ : An example __lsnudge__ file generated
using __gen_background.py__. Uses the same parameters used to generate
__lsnudge_001.dat.testgs__.
- __lsnudge_0001.dat.testnb__ : An example __lsnudge__ file generated
using __gen_background.ipynb__. Uses the same parameters used to generate
__lsnudge_001.dat.testgs__.
- __demo_testgs.png__ : Image saved by __gen_background.gs__ in the example
to generate __lsnudge_0001.dat.testgs__.

### Questions / contact info

For any questions, suggestions, comments, etc., 
reach out to Kyle Ahern ([k.ahern@leeds.ac.uk](mailto:k.ahern@leeds.ac.uk)).
