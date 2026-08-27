#!/usr/bin/env python3
"""Generate a screening OpenFOAM simpleFoam RANS case for a 75 mm plenum sector.
Concept-only generator: validate exact OpenFOAM release syntax, mesh quality, fan curve,
wall treatment, turbulence sensitivity and measured data before relying on results.
"""
from pathlib import Path
import math
CASE=Path('plenumCase'); Q=0.16; H=0.075; RI=1.12; RO=1.42; ANG=20.0
rho=1.204; nu=1.51e-5; I=0.05; L=0.03
area=math.radians(ANG)*(RO-RI)*H; U=Q/area
k=1.5*(I*U)**2; eps=(0.09**0.75)*(k**1.5)/L; omega=math.sqrt(k)/(0.09**0.25*L)
for d in ['0','constant','system']: (CASE/d).mkdir(parents=True,exist_ok=True)
def put(p,s): (CASE/p).write_text(s)
put('system/controlDict',f'''FoamFile{{version 2.0; format ascii; class dictionary; object controlDict;}}
application simpleFoam; startFrom startTime; startTime 0; stopAt endTime; endTime 1500;
deltaT 1; writeControl timeStep; writeInterval 250; purgeWrite 0;
writeFormat ascii; writePrecision 8; runTimeModifiable true;
functions{{ yPlus{{ type yPlus; libs ("libfieldFunctionObjects.so"); writeControl writeTime; }} }}
''')
put('constant/transportProperties',f'''FoamFile{{version 2.0; format ascii; class dictionary; object transportProperties;}}
transportModel Newtonian; nu [0 2 -1 0 0 0 0] {nu};
''')
put('constant/momentumTransport',f'''FoamFile{{version 2.0; format ascii; class dictionary; object momentumTransport;}}
simulationType RAS;
RAS{{ model kOmegaSST; turbulence on; printCoeffs on; }}
''')
put('0/U',f'''FoamFile{{version 2.0; format ascii; class volVectorField; object U;}}
dimensions [0 1 -1 0 0 0 0]; internalField uniform (0 0 0);
boundaryField{{ inlet{{type fixedValue; value uniform ({U:.6f} 0 0);}} outlet{{type pressureInletOutletVelocity; value uniform (0 0 0);}} walls{{type noSlip;}} frontAndBack{{type empty;}} }}
''')
put('0/p','''FoamFile{version 2.0; format ascii; class volScalarField; object p;}
dimensions [0 2 -2 0 0 0 0]; internalField uniform 0;
boundaryField{ inlet{type zeroGradient;} outlet{type fixedValue; value uniform 0;} walls{type zeroGradient;} frontAndBack{type empty;} }
''')
put('0/k',f'''FoamFile{{version 2.0; format ascii; class volScalarField; object k;}}
dimensions [0 2 -2 0 0 0 0]; internalField uniform {k:.8g};
boundaryField{{ inlet{{type fixedValue; value uniform {k:.8g};}} outlet{{type inletOutlet; inletValue uniform {k:.8g}; value uniform {k:.8g};}} walls{{type kqRWallFunction; value uniform 1e-10;}} frontAndBack{{type empty;}} }}
''')
put('0/omega',f'''FoamFile{{version 2.0; format ascii; class volScalarField; object omega;}}
dimensions [0 0 -1 0 0 0 0]; internalField uniform {omega:.8g};
boundaryField{{ inlet{{type fixedValue; value uniform {omega:.8g};}} outlet{{type inletOutlet; inletValue uniform {omega:.8g}; value uniform {omega:.8g};}} walls{{type omegaWallFunction; value uniform 1e-10;}} frontAndBack{{type empty;}} }}
''')
put('0/nut','''FoamFile{version 2.0; format ascii; class volScalarField; object nut;}
dimensions [0 2 -1 0 0 0 0]; internalField uniform 0;
boundaryField{ inlet{type calculated; value uniform 0;} outlet{type calculated; value uniform 0;} walls{type nutkWallFunction; value uniform 0;} frontAndBack{type empty;} }
''')
# Simplified 2D planar surrogate of local radial plenum section; replace with curved mesh/snappyHexMesh for final analysis.
put('system/blockMeshDict',f'''FoamFile{{version 2.0; format ascii; class dictionary; object blockMeshDict;}}
convertToMeters 1;
vertices ((0 0 0) ({RO-RI} 0 0) ({RO-RI} {H} 0) (0 {H} 0) (0 0 0.02) ({RO-RI} 0 0.02) ({RO-RI} {H} 0.02) (0 {H} 0.02));
blocks (hex (0 1 2 3 4 5 6 7) (50 18 1) simpleGrading (1 1 1));
edges (); boundary (
 inlet {{type patch; faces ((0 3 7 4));}} outlet {{type patch; faces ((1 5 6 2));}}
 walls {{type wall; faces ((0 4 5 1) (3 2 6 7));}} frontAndBack {{type empty; faces ((0 1 2 3) (4 7 6 5));}} );
mergePatchPairs ();
''')
put('system/fvSchemes','''FoamFile{version 2.0; format ascii; class dictionary; object fvSchemes;}
ddtSchemes{default steadyState;} gradSchemes{default cellLimited Gauss linear 1;} divSchemes{default none; div(phi,U) bounded Gauss linearUpwind grad(U); div(phi,k) bounded Gauss upwind; div(phi,omega) bounded Gauss upwind; div((nuEff*dev2(T(grad(U))))) Gauss linear;} laplacianSchemes{default Gauss linear limited 0.5;} interpolationSchemes{default linear;} snGradSchemes{default limited 0.5;} wallDist{method meshWave;}
''')
put('system/fvSolution','''FoamFile{version 2.0; format ascii; class dictionary; object fvSolution;}
solvers{ p{solver GAMG; tolerance 1e-7; relTol 0.05;} "(U|k|omega)"{solver smoothSolver; smoother symGaussSeidel; tolerance 1e-7; relTol 0.1;} } SIMPLE{nNonOrthogonalCorrectors 1; residualControl{p 1e-5; U 1e-5; k 1e-5; omega 1e-5;}} relaxationFactors{fields{p 0.3;} equations{U 0.7; k 0.7; omega 0.7;}}
''')
print(f'Wrote {CASE}. Sector screening: Q={Q} m3/s, area={area:.5f} m2, U={U:.3f} m/s, k={k:.4g}, omega={omega:.4g}')
