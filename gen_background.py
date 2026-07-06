##############################################################################
#
#  script name:   gen_background.py
#  author:        Kyle Ahern
#  date:          6 July 2026
#
###      Purpose : Generate a background sounding file for Cloud Model 1
###                 (lsnudge file) with user-specified flow;
###                 key parameters include steering, shear, and helicity
###
###        Usage : from shell:  python gen_background.py [arguments]
###
### Requirements : input_sounding file (e.g., from Dunion (2011)) 
###                 to fill in temperature and moisture data
###
###    Mandatory 
###    arguments :  1)  Sounding name for output      (string)
###                 2)  Nudging period start          (s, string)
###                 3)  Nudging period end            (s, string)
###                 4)  z0 = Bottom of steering layer (m, real)
###                 5)  zb = Bottom of shear layer    (m, real)
###                 6)  zt = Top of shear layer       (m, real)
###                 7)  D  = Top of steering layer    (m, real)
###                 8)  Top of model domain           (m, real)
###
###      Optional 
###     arguments : 9)  Mu = u-component of steering  (m/s, real)
###                 10) Mv = v-component of steering  (m/s, real)
###                 11) Su = u-component of shear     (m/s, real)
###                 12) Sv = v-component of shear     (m/s, real)
###                 13) Hn = Non-dimensional helicity (unitless, real)
###
###   Assumptions : 1) disk space & permission to create output sounding
###                     in working directory
###                 2) input_sounding file (e.g., from Dunion (2011))
###                     exists in working directory
###
###      Products : Products are generated in the working directory.
###                 1) a background profile for Cloud Model 1 (lsnudge),
###                     with filename lsnudge_0001.dat.[name] , where
###                     [name] is provided as mandatory argument #1.
###
###     Questions : send to kyle.k.ahern at gmail.com
###
###    References : Cloud Model 1 (Bryan & Fritsch 2002):
###                     https://www2.mmm.ucar.edu/people/bryan/cm1
###                 Bryan, G. H., and J. M. Fritsch, 2002: 
###                   A benchmark simulation for moist nonhydrostatic 
###                   numerical models. Mon. Wea. Rev., 130 (12), 
###                   2917–2928.
###                 Dunion, J. P., 2011: 
###                   Rewriting the climatology of the 
###                   tropical North Atlantic and Caribbean Sea
###                   atmosphere. J. Climate, 24 (3), 893–908.
###
##############################################################################

import os
import sys
import math
import numpy as np

if len(sys.argv) < 9:
    print('gen_background.py --')
    print('   a script for generating Cloud Model 1')
    print('   background soundings with flow,')
    print('   adjustable via steering, shear,')
    print('   and helicity parameters.')
    print()
    print('Mandatory arguments:')
    print('  1)  Sounding name for output           (string)')
    print('  2)  Nudging period start               (s, string)')
    print('  3)  Nudging period end                 (s, string)')
    print('  4)  z0 = Bottom of steering layer      (m, real)')
    print('  5)  zb = Bottom of shear layer         (m, real)')
    print('  6)  zt = Top of shear layer            (m, real)')
    print('  7)  D  = Top of steering layer         (m, real)')
    print('  8)  Top of model domain                (m, real)')
    print()
    print('Optional arguments:')
    print('  9)  Mu = u-component of steering       (m/s, real)')
    print('  10) Mv = v-component of steering       (m/s, real)')
    print('  11) Su = u-component of shear          (m/s, real)')
    print('  12) Sv = v-component of shear          (m/s, real)')
    print('  13) Hn = Non-dimensional helicity      (unitless, real)')
    sys.exit(1)

##############################################################################
# sounding specifications
##############################################################################

# output file information (required)
# sounding name
_NAME = str(sys.argv[1])
# vertical spacing for output sounding (m)
_dz = 100.0


# nudging period bounds (s, required)
# Note: these don't have to be numbers,
#       allowing for creating profile templates
#       with placeholder strings.
_NUDGESTART = str(sys.argv[2])
_NUDGEEND   = str(sys.argv[3])


# layer information (required)
# Note: 0 <= _z0 <= _zb < _zt <= _D <= _ztop
# bottom of steering layer (m)
_z0   = float(sys.argv[4])
# bottom of shear layer (m)
_zb   = float(sys.argv[5])
# top of shear layer (m)
_zt   = float(sys.argv[6])
# top of steering layer (m)
_D    = float(sys.argv[7])
# top of model (m)
_ztop = float(sys.argv[8])


# steering (optional)
# u-component of steering (m/s)
if len(sys.argv) > 9:
    _us = float(sys.argv[9])
else:
    _us = 0.0
    
# v-component of steering (m/s)
if len(sys.argv) > 10:
    _vs = float(sys.argv[10])
else:
    _vs = 0.0


# shear [optional, must specify steering (can be 0)]
# u-component of shear (m/s)
if len(sys.argv) > 11:
    _Su = float(sys.argv[11])
else:
    _Su = 0.0
    
# v-component of shear (m/s)
if len(sys.argv) > 12:
    _Sv = float(sys.argv[12])
else:
    _Sv = 0.0


# helicity (optional, must specify shear)
# non-dimensional helicity parameter (unitless)
if len(sys.argv) > 13:
    _Hn = float(sys.argv[13])
else:
    _Hn = 0.0

##############################################################################

def amisane():
    e_any = False

    layeropts = [_z0, _zb, _zt, _D, _ztop]
    layeroptnames = ['z0', 'zb', 'zt', 'D', 'ztop']
    layeroptdescs = [
                        'steering layer bottom',
                        'shear layer bottom',
                        'shear layer top',
                        'steering layer top',
                        'model top'
                    ]

    for i in range(len(layeropts)):
        opt = layeropts[i]
        name = layeroptnames[i]
        desc = layeroptdescs[i]
        e_type  = False
        e_value = False
        if isinstance(opt, bool) or not isinstance(opt, (int, float)):
            print(f'type error in {name}: {desc} must be int or real.')
            e_type = True
        if not e_type and opt < 0.0:
            print(f'value error in {name}: {desc} must be non-negative.')
            e_value = True
        if e_type or e_value:
            e_any = True

    if not e_any:
        if _D > _ztop:
            print(f'Info:  ztop = {_ztop}')
            print(f'Info:  D    = {_D}')
            print('Error: top of steering layer cannot be above the model top.')
            e_any = True

        if _zt > _D:
            print(f'Info:  D  = {_D}')
            print(f'Info:  zt = {_zt}')
            print('Error: top of shear layer cannot be above the steering layer top.')
            e_any = True

        if _zb >= _zt:
            print(f'Info:  zt = {_zt}')
            print(f'Info:  zb = {_zb}')
            print('Error: shear layer thickness must be positive.')
            e_any = True

        if _z0 > _zb:
            print(f'Info:  zb = {_zb}')
            print(f'Info:  z0 = {_z0}')
            print('Error: bottom of steering layer cannot be above the shear layer bottom.')
            e_any = True

        if _z0 < 0.0:
            print(f'Info:  z0 = {_z0}')
            print('Error: bottom of steering layer cannot be at negative altitude.')
            e_any = True

    windopts = [_us, _vs, _Su, _Sv, _Hn]
    windoptnames = ['us', 'vs', 'Su', 'Sv', 'Hn']
    windoptdescs = [
                        'u-component of steering',
                        'v-component of steering',
                        'u-component of shear',
                        'v-component of shear',
                        'non-dimensional helicity'
                    ]

    for i in range(len(windopts)):
        opt = windopts[i]
        name = windoptnames[i]
        desc = windoptdescs[i]
        if isinstance(opt, bool) or not isinstance(opt, (int, float)):
            print(f'type error in {name}: {desc} must be int or real.')
            e_any = True

    return not e_any

def calc_t_q():
    # read Dunion (2011) input sounding
    # to fill temp & moisture data
    filein = 'input_sounding'
    if not os.path.exists(filein):
        print('Error: input_sounding file not found')
        return True

    numlines = 15
    in_z = np.zeros((numlines), dtype=float)
    in_t = np.zeros((numlines), dtype=float)
    in_q = np.zeros((numlines), dtype=float)
    with open(filein, "r") as f:
        lin = 0
        for line in f:
            x = line.strip().split()
            if lin == 0:
                in_z[lin] = 2.0
                in_psfc   = x[0]
            else:
                in_z[lin] = x[0]

            in_t[lin] = x[1]
            in_q[lin] = x[2]
            lin = lin + 1

    if _ztop > in_z[-1]:
        print(f'Info: ztop = {_ztop}')
        print(f'Info: in_z[-1] = {in_z[-1]}')
        print('Error: model top must be below highest input_sounding level')
        return True

    # construct soundings of T and q to use with derived u, v
    i = 0
    k = 0
    z = 0
    z0 = in_z[i]
    z1 = in_z[i+1]
    t0 = in_t[i]
    t1 = in_t[i+1]
    q0 = in_q[i]
    q1 = in_q[i+1]

    while k < profsiz:
        if k == profsiz - 1:
            z = _ztop

        _z[k] = z

        if z > z1:
            i = i + 1
            z0 = in_z[i]
            z1 = in_z[i+1]
            t0 = in_t[i]
            t1 = in_t[i+1]
            q0 = in_q[i]
            q1 = in_q[i+1]
        if k == 0:
            _T[k] = in_t[0]
            _q[k] = in_q[0]
        else:
            _T[k] = t0 + (t1 - t0) * ((z - z0) / (z1 - z0))
            _q[k] = q0 + (q1 - q0) * ((z - z0) / (z1 - z0))
        z = z + _dz
        k = k + 1
    return False

def calc_wind():
    # Uniform adjustment parameters
    ub1 = _us + ((_Su / 2.0) * ((_zt+_zb-2*_D) / (_D-_z0))) + ((_Sv * _Hn / 4.0) * (_zt-_zb)/(_D-_z0))
    vb1 = _vs + ((_Sv / 2.0) * ((_zt+_zb-2*_D) / (_D-_z0))) - ((_Su * _Hn / 4.0) * (_zt-_zb)/(_D-_z0))
    ut1 = ub1 + _Su
    vt1 = vb1 + _Sv
    uc1 = (ub1 + ut1) / 2.0
    vc1 = (vb1 + vt1) / 2.0

    # wavenumbers
    m1 = np.pi / (_zt - _zb)
    m2 = 2.0 * m1

    # make u, v profiles throughout the model depth
    sumu = 0
    sumv = 0
    n = 0
    k = 0
    while k < profsiz:
        z = _z[k]
        if z <= _zb:
            _u[k] = ub1
            _v[k] = vb1
        elif z >= _zt:
            _u[k] = ut1
            _v[k] = vt1
        else:
            f1 = (ut1 + ub1 - _Su * np.cos(m1 * (z - _zb))) / 2.0
            g1 = (vt1 + vb1 - _Sv * np.cos(m1 * (z - _zb))) / 2.0
            f2 = -(_Hn * _Sv / 4.0) * (1.0 - np.cos(m2 * (z - _zb)))
            g2 =  (_Hn * _Su / 4.0) * (1.0 - np.cos(m2 * (z - _zb)))
            _u[k] = f1 + f2
            _v[k] = g1 + g2

        # add up u and v
        # so we can calculate steering-layer mean u and v
        if z >= _z0 and z <= _D:
            if z != _z0 and z != _D:
                wgt = 1.0
            else:
                wgt = 0.5
            sumu = sumu + (_u[k] * wgt)
            sumv = sumv + (_v[k] * wgt)
            n = n + wgt
        k = k + 1

    # calculated steering-layer mean u and v
    meanu = sumu / n
    meanv = sumv / n

    # calculated steering-relative helicity in the shear layer
    _H0 = 0
    k = 0
    while k < profsiz:
        z = _z[k]
        if z >= _zb and z <= _zt:
            du = _u[k+1] - _u[k]
            dv = _v[k+1] - _v[k]
            hpart = -(dv * (_u[k] - _us)) + (du * (_v[k] - _vs))
            _H0 = _H0 + hpart
        k = k + 1
        z = z + _dz

    print(' <=============== results ===============>')
    print(f' Method 1 ub...............: {ub1}')
    print(f' Method 1 vb...............: {vb1}')
    print(f' Method 1 ut...............: {ut1}')
    print(f' Method 1 vt...............: {vt1}')
    print(f' Steering-layer mean u.....: {meanu}')
    print(f' Steering-layer mean v.....: {meanv}')
    print(f' u-component of shear......: {ut1 - ub1}')
    print(f' v-component of shear......: {vt1 - vb1}')
    print(f' Steering-relative H.......: {_H0}')
    print(' <=======================================>')
    return

def save_profile():
    fileout = f'lsnudge_0001.dat.{_NAME}'
    with open(fileout, "w") as f:
        hdr1 = '*  Header:   lsnudge_time1 (s)   lsnudge_time2 (s)'
        hdr2 = f'                 {_NUDGESTART}       {_NUDGEEND}'
        hdr3 = '*  Profile.   Note: values will be ignored if nudging for that variable is off.'
        hdr4 = '*    z (m)   theta (K)    qv (g/kg)  u (m/s, grnd-reltv)   v (m/s, grnd-reltv)'
        f.write(f'{hdr1}\n')
        f.write(f'{hdr2}\n')
        f.write(f'{hdr3}\n')
        f.write(f'{hdr4}\n')

        k = 1
        while k < profsiz:
            rec = f'{_z[k]} {_T[k]} {_q[k]} {_u[k]} {_v[k]}'
            f.write(f'{rec}\n')
            k = k + 1
    return



sane = amisane()
if sane:
    print(' <=========== profile options ===========>')
    print(f' name......................: {_NAME}')
    print(f' nudging start.............: {_NUDGESTART}')
    print(f' nudging end...............: {_NUDGEEND}')
    print(f' steer-layer bottom........: {_z0}')
    print(f' shear-layer bottom........: {_zb}')
    print(f' shear-layer top...........: {_zt}')
    print(f' steer-layer top...........: {_D}')
    print(f' model top.................: {_ztop}')
    print(f' u-component of steering...: {_us}')
    print(f' v-component of steering...: {_vs}')
    print(f' u-component of shear......: {_Su}')
    print(f' v-component of shear......: {_Sv}')
    print(f' Hn........................: {_Hn}')
    print(' <=======================================>')
    print()

    profsiz = int(math.ceil(_ztop / _dz)) + 1
    _T = np.zeros((profsiz), dtype=float)
    _q = np.zeros((profsiz), dtype=float)
    _u = np.zeros((profsiz), dtype=float)
    _v = np.zeros((profsiz), dtype=float)
    _z = np.zeros((profsiz), dtype=float)

    if calc_t_q():
        print('Error in calc_t_q')
    else:
        calc_wind()
        save_profile()
