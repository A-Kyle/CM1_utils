function mn(args)
*************************************************************************
*
*  script name: gen_background.gs
*  author:      Kyle Ahern
*  date:        5 July 2026
*
***      Purpose : Generate a background sounding file for Cloud Model 1
***                 (lsnudge file) with user-specified flow;
***                 key parameters include steering, shear, and helicity.
***
***        Usage : from shell:  grads -blcx "gen_background.gs [arguments]"
***                in GrADS:    gen_background.gs [arguments]
***
*** Requirements : input_sounding file (e.g., from Dunion (2011)) 
***                 to fill in temperature and moisture data
***
***    Mandatory 
***    arguments :  1)  Sounding name for output      (string)
***                 2)  Nudging period start          (s, string)
***                 3)  Nudging period end            (s, string)
***                 4)  z0 = Bottom of steering layer (m, real)
***                 5)  zb = Bottom of shear layer    (m, real)
***                 6)  zt = Top of shear layer       (m, real)
***                 7)  D  = Top of steering layer    (m, real)
***                 8)  Top of model domain           (m, real)
***
***      Optional 
***     arguments : 9)  Mu = u-component of steering  (m/s, real)
***                 10) Mv = v-component of steering  (m/s, real)
***                 11) Su = u-component of shear     (m/s, real)
***                 12) Sv = v-component of shear     (m/s, real)
***                 13) Hn = Non-dimensional helicity (unitless, real)
***
***   Assumptions : 1) disk space & permission to create outputs 
***                     (lsnudge file and image) in working directory
***                 2) input_sounding file (e.g., from Dunion (2011))
***                     exists in working directory
***
***      Products : Products are generated in the working directory.
***                 1) a background profile for Cloud Model 1 (lsnudge),
***                     with filename lsnudge_0001.dat.[name] , where
***                     [name] is provided as mandatory argument #1.
***                 2) an image in PNG format that includes a hodograph
***                     of the background wind, along with
***                     lists of input parameters and output values.
***                     Has filename demo_[name].png , where
***                     [name] is provided as mandatory argument #1.
***
***     Questions : send to kyle.k.ahern at gmail.com
***
***    References : Cloud Model 1 (Bryan & Fritsch 2002):
***                     https://www2.mmm.ucar.edu/people/bryan/cm1
***                 Bryan, G. H., and J. M. Fritsch, 2002: 
***                   A benchmark simulation for moist nonhydrostatic 
***                   numerical models. Mon. Wea. Rev., 130 (12), 
***                   2917–2928.
***                 Dunion, J. P., 2011: 
***                   Rewriting the climatology of the 
***                   tropical North Atlantic and Caribbean Sea
***                   atmosphere. J. Climate, 24 (3), 893–908.
***
*************************************************************************

**************** sounding specifications *******************

;* output file information (required)
_NAME = subwrd(args, 1); ;* sounding name
_dz = 100                ;* vertical spacing for output sounding (m)

;* nudging period bounds (s, required)
;* Note: these don't have to be numbers,
;*       allowing for creating profile templates
;*       with placeholder strings.
_NUDGESTART = subwrd(args, 2);
_NUDGEEND   = subwrd(args, 3);

;* layer information (required)
_z0   = subwrd(args, 4);  ;* bottom of steering layer (m)
_zb   = subwrd(args, 5);  ;* bottom of shear layer (m)
_zt   = subwrd(args, 6);  ;* top of shear layer (m)
_D    = subwrd(args, 7);  ;* top of steering layer (m)
_ztop = subwrd(args, 8);  ;* top of model (m)

;* steering (optional)
_us = subwrd(args, 9);    ;* u-component of steering (m/s)
_vs = subwrd(args, 10);   ;* v-component of steering (m/s)

;* shear [optional, must specify steering (can be 0)]
_Su = subwrd(args, 11);   ;* u-component of shear (m/s)
_Sv = subwrd(args, 12);   ;* v-component of shear (m/s)

;* helicity (optional, must specify shear)
_Hn = subwrd(args, 13);   ;* non-dimensional helicity parameter (unitless)

*************************************************************

issteer = 0 ;* do steering?
isshear = 0 ;* do shear?
ishelic = 0 ;* do helicity?

**************** sanity check *******************
if (_ztop="")
  say 'Error: Not enough arguments given (8 minimum).'
  info();
  exit;
endif

i = 4; while(i <= 8)
  val = subwrd(args, i);
  chk = valnum(val);
  if (chk = 0)
    say 'Info:  Argument 'i': 'val
    say 'Error: Argument 'i' not a number.'
    info();
    exit;
  endif
  if (val < 0)
    say 'Info:  Argument 'i': 'val
    say 'Error: Argument 'i' must be non-negative.'
    info();
    exit;
  endif
  i = i + 1;
endwhile

if (_Hn != "")
  issteer = 1;
  isshear = 1;
  ishelic = 1;
else
  if (_Su != "")
    issteer = 1;
    isshear = 1;
  else
    if (_us != "")
      issteer = 1;
    endif
  endif
endif

if (issteer)
  if (valnum(_us) = 0)
    say 'Info:  _us = '_us
    say 'Error: u-component of steering not a number.'
    info();
    exit;
  endif
  if (valnum(_vs) = 0)
    say 'Info:  _vs = '_vs
    say 'Warn:  v-component of steering not a number. Assuming 0.'
    _vs = 0;
  endif
  if (isshear)
    if (valnum(_Su) = 0)
      say 'Info:  _Su = '_Su
      say 'Error: u-component of shear not a number.'
      info();
      exit;
    endif
    if (valnum(_Sv) = 0)
      say 'Info:  _Sv = '_Sv
      say 'Warn:  v-component of shear not a number. Assuming 0.'
      _Sv = 0;
    endif
    if (ishelic)
      if (valnum(_Hn) = 0)
        say 'Info:  _Hn = '_Hn
        say 'Error: helicity not a number.'
        info();
        exit;
      endif
    else
      _Hn = 0;
    endif
  else
    _Su = 0;
    _Sv = 0;
    _Hn = 0;
  endif
else
  _us = 0;
  _vs = 0;
  _Su = 0;
  _Sv = 0;
  _Hn = 0;
endif

if (_D > _ztop)
  say 'Info:  _ztop = '_ztop
  say 'Info:  _D = '_D
  say 'Error: top of steering layer is above the model top.'
  exit;  
endif
if (_zt > _D)
  say 'Info:  _D = '_D
  say 'Info:  _zt = '_zt
  say 'Error: top of shear layer is above the steering layer top.'
  exit;  
endif
if (_zb >= _zt)
  say 'Info:  _zt = '_zt
  say 'Info:  _zb = '_zb
  say 'Error: shear layer thickness is non-positive.'
  exit;  
endif
if (_z0 > _zb)
  say 'Info:  _zb = '_zb
  say 'Info:  _z0 = '_z0
  say 'Error: bottom of steering layer is above the shear layer bottom.'
  exit;  
endif
if (_z0 < 0)
  say 'Info:  _z0 = '_z0
  say 'Error: bottom of steering layer is at negative altitude.'
  exit;  
endif

_pi = 3.14159265359 ;* a tasty snack

;* text/image reporting information
_VMIN = -15    ;* vmin on hodograph (m/s)
_VMAX = 15     ;* vmax on hodograph (m/s)
_dk   = 1000   ;* vertical spacing for hodograph (m)
_extrastats=0  ;* for debugging

;* plot framework settings
numcols = 1;
numrows = 1;
_PAGE_W = 11.0;
_PAGE_H = 8.5;
_PLOT_W = 4.5;
_PLOT_H = _PLOT_W;
_MARG   = 1.5;

'reinit'
'set background 1'
'c'

;* initialize sounding with default thermo/mass profiles
get_sounding();

;* do the thing
say
say ' <=========== profile options ===========>'
say ' name......................: '_NAME
say ' nudging start.............: '_NUDGESTART
say ' nudging end...............: '_NUDGEEND
say ' steer-layer bottom........: '_z0
say ' shear-layer bottom........: '_zb
say ' shear-layer top...........: '_zt
say ' steer-layer top...........: '_D
say ' model top.................: '_ztop
say ' x steering................: '_us
say ' y steering................: '_vs
say ' x shear...................: '_Su
say ' y shear...................: '_Sv
say ' Hn........................: '_Hn
say ' <=======================================>'
say

;* set background winds to 0
reset_hodo();

;* calculate background winds given steering, shear, and helicity
calc_wind();

;* plot the results on a hodograph
plot_hodo(_us, _vs, _Su, _Sv, _NAME);

;* save profile data for nudging in CM1
save_sounding(_NAME);

'gxprint demo_'_NAME'.png'

return

* !@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@! *
* !@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@! *
* !@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@! *
* !@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@!@#$#@! *

function reset_hodo()
  k = 0;
  z = 0;
  while (z <= _ztop)
    _u.k = 0;
    _v.k = 0;
    z = z + _dz;
    k = k + 1;
  endwhile
return

function calc_wind()
  ;* Uniform adjustment parameters (method 1)
  ub1 = _us + ((_Su / 2) * ((_zt+_zb-2*_D) / (_D-_z0))) + ((_Sv * _Hn / 4) * (_zt-_zb)/(_D-_z0));
  vb1 = _vs + ((_Sv / 2) * ((_zt+_zb-2*_D) / (_D-_z0))) - ((_Su * _Hn / 4) * (_zt-_zb)/(_D-_z0));
  ut1 = ub1 + _Su;
  vt1 = vb1 + _Sv;
  uc1 = (ub1 + ut1) / 2.0;
  vc1 = (vb1 + vt1) / 2.0;

  ;* wavenumbers
  m1 = _pi / (_zt - _zb);
  m2 = 2 * m1;

  ;* make u, v profiles throughout the model depth
  sumu = 0; 
  sumv = 0; 
  n = 0;
  k = 0; z = 0; while(z <= _ztop)
    if (z <= _zb)
      _u.k = ub1;
      _v.k = vb1;
    else; if (z >= _zt)
      _u.k = ut1;
      _v.k = vt1;
    else
      f1 = (ut1 + ub1 - _Su * math_cos(m1 * (z - _zb))) / 2.0;
      g1 = (vt1 + vb1 - _Sv * math_cos(m1 * (z - _zb))) / 2.0;
      f2 = -(_Hn * _Sv / 4.0) * (1 - math_cos(m2 * (z - _zb)));
      g2 =  (_Hn * _Su / 4.0) * (1 - math_cos(m2 * (z - _zb)));
      _u.k = f1 + f2;
      _v.k = g1 + g2;
    endif; endif;

    ;* add up u and v
    ;* so we can calculate steering-layer mean u and v
    if (z >= _z0 & z <= _D)
      if (z = _z0 | z = _D)
        sumu = sumu + (_u.k / 2);
        sumv = sumv + (_v.k / 2);
        n = n + 0.5;
      else
        sumu = sumu + _u.k;
        sumv = sumv + _v.k;
        n = n + 1;
      endif
    endif

    k = k + 1;
    z = z + _dz;
  endwhile

  ;* calculated steering-layer mean u and v
  meanu = sumu / n;
  meanv = sumv / n;

  ;* calculated steering-relative helicity in the shear layer
  _H0 = 0;
  k = 0; kp = k + 1; z = 0; while(z <= _ztop)
    if (z >= _zb & z <= _zt)
      du = _u.kp - _u.k;
      dv = _v.kp - _v.k;
      hpart = -(dv * (_u.k - _us)) + (du * (_v.k - _vs));
      _H0 = _H0 + hpart;
    endif
    k = k + 1;
    kp = kp + 1;
    z = z + _dz;
  endwhile

  xi = _PLOT_W + _MARG + 0.5;
  yi = _PAGE_H - _MARG - (_MARG / 2.0);
  y = yi; 
  dy = - 0.3;
  'set strsiz 0.16 0.19'
  'set string 1 l 2'
  'set font 12'
  'draw string 'xi' 'y' Inputs'
  'set font 11'
  'set string 4'
  y = y + dy; 'draw string 'xi' 'y' M`bu`n = 'math_format('%5.2f',_us)' m s`a-1`n'
  y = y + dy; 'draw string 'xi' 'y' M`bv`n = 'math_format('%5.2f',_vs)' m s`a-1`n'
  'set string 2'
  y = y + dy; 'draw string 'xi' 'y' S`bu`n = 'math_format('%5.2f',_Su)' m s`a-1`n'
  y = y + dy; 'draw string 'xi' 'y' S`bv`n = 'math_format('%5.2f',_Sv)' m s`a-1`n'
  'set string 9'
  y = y + dy; 'draw string 'xi' 'y' H = 'math_format('%5.2f',_Hn)''
  'set string 1'
  y = y + dy; 'draw string 'xi' 'y' z`b0`n = 'math_format('%5.2f',_z0)' m'
  y = y + dy; 'draw string 'xi' 'y' z`bb`n = 'math_format('%5.2f',_zb)' m'
  y = y + dy; 'draw string 'xi' 'y' z`bt`n = 'math_format('%5.2f',_zt)' m'
  y = y + dy; 'draw string 'xi' 'y' D = 'math_format('%5.2f',_D)' m'

  xi = xi + 2.25; 
  y = yi;
  'set font 12'
  'draw string 'xi' 'y' Outputs'
  'set font 11'
  'set string 4'
  y = y + dy; 'draw string 'xi' 'y' M`bu`n = 'math_format('%5.2f',meanu)' m s`a-1`n'
  y = y + dy; 'draw string 'xi' 'y' M`bv`n = 'math_format('%5.2f',meanv)' m s`a-1`n'
  'set string 2'
  y = y + dy; 'draw string 'xi' 'y' S`bu`n = 'math_format('%5.2f',ut1-ub1)' m s`a-1`n'
  y = y + dy; 'draw string 'xi' 'y' S`bv`n = 'math_format('%5.2f',vt1-vb1)' m s`a-1`n'
  'set string 9'
  y = y + dy; 'draw string 'xi' 'y' H`ba`n = 'math_format('%5.2f',_H0)' m`a2`n s`a-2`n'
  'set string 1'
  y = y + dy; 'draw string 'xi' 'y' u`bb`n = 'math_format('%5.2f',ub1)' m s`a-1`n'
  y = y + dy; 'draw string 'xi' 'y' v`bb`n = 'math_format('%5.2f',vb1)' m s`a-1`n'
  y = y + dy; 'draw string 'xi' 'y' u`bt`n = 'math_format('%5.2f',ut1)' m s`a-1`n'
  y = y + dy; 'draw string 'xi' 'y' v`bt`n = 'math_format('%5.2f',vt1)' m s`a-1`n'
  
  say
  say ' <=============== results ===============>'
  say ' Method 1 ub...............: 'ub1
  say ' Method 1 vb...............: 'vb1
  say ' Method 1 ut...............: 'ut1
  say ' Method 1 vt...............: 'vt1
  say ' Steering-layer mean u.....: 'meanu
  say ' Steering-layer mean v.....: 'meanv
  say ' x shear...................: 'ut1 - ub1
  say ' y shear...................: 'vt1 - vb1
  say ' Steering-relative H.......: '_H0
  say ' <=======================================>'
  say

  if (_extrastats)
    say
    say ' <================ extra ================>'
    say ' Parameter A...............: 'A
    say ' Parameter B...............: 'B
    say ' Method 1 ub...............: 'ub1
    say ' Method 1 vb...............: 'vb1
    say ' Method 1 ut...............: 'ut1
    say ' Method 1 vt...............: 'vt1
    say ' Method 2 ub...............: 'ub2
    say ' Method 2 vb...............: 'vb2
    say ' Method 2 ut...............: 'ut2
    say ' Method 2 vt...............: 'vt2
    say ' <=======================================>'
    say    
  endif
  _ub1=ub1;
  _vb1=vb1;
  _ut1=ut1;
  _vt1=vt1;

return

function plot_hodo(u_steer, v_steer, u_shear, v_shear, name)
  ;* plot framing info
  V_XI = _MARG;
  V_XF = V_XI + _PLOT_W;
  V_YF = _PAGE_H - _MARG;
  V_YI = V_YF - _PLOT_H;
  V_W  = V_XF - V_XI;
  V_H  = V_YF - V_YI;

  ;* draw hodograph frame
  'set line 1 1 6'
  'draw rec 'V_XI' 'V_YI' 'V_XF' 'V_YF
  
  ;* draw grid
  vint = 5; v = _VMIN; while(v <= _VMAX)
    if (v != 0)
      'set line 15 3 3'
    else
      'set line 1 1 3'
    endif
    xpos = V_XI + V_W * ((v - _VMIN) / (_VMAX - _VMIN));
    ypos = V_YI + V_H * ((v - _VMIN) / (_VMAX - _VMIN));
    if (v != _VMIN & v != _VMAX)
      'draw line 'V_XI' 'ypos' 'V_XF' 'ypos
      'draw line 'xpos' 'V_YI' 'xpos' 'V_YF
    endif
    'set strsiz 0.16 0.2'
    'set string 1 tc'
    'draw string 'xpos' 'V_YI - 0.1' 'v
    'set string 1 r'
    if (v != _VMIN)
      'draw string 'V_XI - 0.1' 'ypos' 'v
    endif
    v = v + vint;
  endwhile

  ;* draw labels
  labelx = V_XI -0.45;
  labely = V_YI + (V_H / 2);
  'set string 1 bc 3 90'
  'draw string 'labelx' 'labely' v-component of V`b0`n [m s`a-1`n]'
  labelx = V_XI + (V_W / 2);
  labely = V_YI - 0.45;
  'set string 1 tc 3 0'
  'draw string 'labelx' 'labely' u-component of V`b0`n [m s`a-1`n]'

  ;* draw hodograph/case name
  xt = V_XI + (V_W / 2.0);
  yt = V_YF + 0.1;
  'set string 1 bc'
  'set strsiz 0.16 0.2'
  'draw string 'xt' 'yt' Name: 'name

  k = 0;
  z = 0; while (z <= _D)
    xpos = V_XI + V_W * ((_u.k - _VMIN) / (_VMAX - _VMIN));
    ypos = V_YI + V_H * ((_v.k - _VMIN) / (_VMAX - _VMIN));
    xprof.k = xpos;
    yprof.k = ypos;
    z = z + _dz;
    k = k + 1;
  endwhile
  kmax = k;

  ;* steering vector endpoint
  steerxpos = V_XI + V_W * ((_us-_VMIN) / (_VMAX-_VMIN));
  steerypos = V_YI + V_H * ((_vs-_VMIN) / (_VMAX-_VMIN));
  
  ;* shear-layer boundary vectors' endpoints
  ub1xpos = V_XI + V_W * ((_ub1 - _VMIN) / (_VMAX - _VMIN));
  vb1ypos = V_YI + V_H * ((_vb1 - _VMIN) / (_VMAX - _VMIN));
  ut1xpos = V_XI + V_W * ((_ut1 - _VMIN) / (_VMAX - _VMIN));
  vt1ypos = V_YI + V_H * ((_vt1 - _VMIN) / (_VMAX - _VMIN));

  ;* fill area proportional to steering-relative helicity
  poly = steerxpos' 'steerypos;
  k = 0; while (k < kmax)
    poly = poly' 'xprof.k' 'yprof.k;
    k = k + 1;
  endwhile
  
  if (_H0 < 0)
    'set rgb 99 123 153 255 123'
  else
    'set rgb 99 255 123 167 123'
  endif
  'set rgb 99 185 100 255 123'
  'set line 99'
  'draw polyf 'poly
  'set rgb 100 0 0 0 60'
  'set line 100 1 3'
  'draw line 'steerxpos' 'steerypos' 'ub1xpos' 'vb1ypos
  'draw line 'steerxpos' 'steerypos' 'ut1xpos' 'vt1ypos

  ;* draw hodograph
  k = 0;
  ilev = 0;
  flev = _D / 1000;
  numpts = math_nint(flev - ilev + 1);
  prevx = -9999; prevy = -9999;
  z = 0; while (z <= _D)
    modz = math_mod(z, _dk);
    xpos = xprof.k;
    ypos = yprof.k;
    if (modz = 0)
      'set line 1 1 6'
    endif
    if (prevx != -9999)
      'draw line 'prevx' 'prevy' 'xpos' 'ypos
    endif
    prevx = xpos;
    prevy = ypos;
    z = z + _dz;
    k = k + 1;
  endwhile

  ;* draw steering vector endpoint
  'set line 11 1 3'
  'draw mark 3 'steerxpos' 'steerypos' 0.1'
  'set line 1'
  'draw mark 2 'steerxpos' 'steerypos' 0.1'
  
  arrow(ub1xpos, vb1ypos, ut1xpos, vt1ypos);

return

function get_sounding()
  ;* read Dunion (2011) input sounding 
  ;* to fill temp & moisture data
  filein   = 'input_sounding';
  numlines = 15;
  i = 0; while(i < numlines)
    rc = read(filein); lin = sublin(rc, 2);
    if (i = 0)
      lev.i = 2.0;
      _psfc = subwrd(lin, 1);
    else
      lev.i = subwrd(lin, 1);
    endif
    tk.i = subwrd(lin, 2);
    qv.i = subwrd(lin, 3);
    
    if (i = numlines - 1)
      _z_top = lev.i;
      _t_top = tk.i;
      _q_top = qv.i;
    endif
    
    i = i + 1;
  endwhile
  q = close(filein);

  imax = numlines - 1;
  if (lev.imax < _ztop)
    say 'Error: specified model top must be'
    say '       below highest input_sounding level'
    quit
  endif

  ;* construct soundings of T and q to use with derived u, v
  i = 0; 
  j = i + 1;
  z_0 = lev.i;
  z_1 = lev.j;
  T_0 = tk.i;
  T_1 = tk.j;
  q_0 = qv.i;
  q_1 = qv.j;
  k = 0; z = 0; while(z <= _ztop)
    if (z > z_1)
      if (_extrastats)
        say '-- changing sounding level at z='z'--'
        say 'previous:'
        say "z_0="z_0", z_1="z_1", T_0="T_0", T_1="T_1", q_0="q_0", q_1="q_1
      endif
      i = i + 1; 
      j = j + 1;
      z_0 = lev.i;
      z_1 = lev.j;
      T_0 = tk.i;
      T_1 = tk.j;
      q_0 = qv.i;
      q_1 = qv.j;
      if (_extrastats)
        say 'new:'
        say 'z_0='z_0', z_1='z_1', T_0='T_0', T_1='T_1', q_0='q_0', q_1='q_1
      endif
    endif
    if (k = 0)
      _T.k = tk.0;
      _q.k = qv.0;
    else
      _T.k = T_0 + (T_1 - T_0) * ((z - z_0) / (z_1 - z_0));
      _q.k = q_0 + (q_1 - q_0) * ((z - z_0) / (z_1 - z_0));
    endif
    z = z + _dz; 
    k = k + 1;
  endwhile
return

function save_sounding(name)

  fileout = 'lsnudge_0001.dat.'name
  hdr1 = '*  Header:   lsnudge_time1 (s)   lsnudge_time2 (s)'
  hdr2 = '                 '_NUDGESTART'       '_NUDGEEND
  hdr3 = '*  Profile.   Note: values will be ignored if nudging for that variable is off.'
  hdr4 = '*    z (m)   theta (K)    qv (g/kg)  u (m/s, grnd-reltv)   v (m/s, grnd-reltv)'
  q = write(fileout, hdr1);
  q = write(fileout, hdr2);
  q = write(fileout, hdr3);
  q = write(fileout, hdr4);

  k = 1; z = _dz; while(z <= _ztop)
    rec = z%".0 "%_T.k%" "%_q.k%" "%_u.k%" "%_v.k
    q = write(fileout, rec);
    k = k + 1; 
    z = z + _dz;
  endwhile

  q = close(fileout);

return

function arrow(x0, y0, x1, y1)
  dx = x1 - x0;
  dy = y1 - y0;
  len = math_sqrt((dx * dx) + (dy * dy));
  
  a = math_atan2(dy, dx);

  aa = a - (_pi / 6.0);
  ab = a + (_pi / 6.0);
  
  len = 0.1;
  xadisp = -len * math_cos(aa);
  yadisp = -len * math_sin(aa);
  xbdisp = -len * math_cos(ab);
  ybdisp = -len * math_sin(ab);

  'set line 2 1 9'
  'draw line 'x0' 'y0' 'x1' 'y1
  'draw line 'x1' 'y1' 'x1 + xadisp' 'y1 + yadisp
  'draw line 'x1' 'y1' 'x1 + xbdisp' 'y1 + ybdisp
return

function info()
  say 
  say 'gen_background.gs --'
  say '   a script for generating Cloud Model 1'
  say '   background soundings with flow,'
  say '   adjustable via steering, shear,'
  say '   and helicity parameters.'
  say
  say 'Mandatory arguments:'
  say '  1)  Sounding name for output           (string)'
  say '  2)  Nudging period start               (s, string)'
  say '  3)  Nudging period end                 (s, string)'
  say '  4)  z0 = Bottom of steering layer      (m, real)'
  say '  5)  zb = Bottom of shear layer         (m, real)'
  say '  6)  zt = Top of shear layer            (m, real)'
  say '  7)  D  = Top of steering layer         (m, real)'
  say '  8)  Top of model domain                (m, real)'
  say
  say 'Optional arguments:'
  say '  9)  Mu = u-component of steering       (m/s, real)'
  say '  10) Mv = v-component of steering       (m/s, real)'
  say '  11) Su = u-component of shear          (m/s, real)'
  say '  12) Sv = v-component of shear          (m/s, real)'
  say '  13) Hn = Non-dimensional helicity      (unitless, real)'
  say
return

*._.*
