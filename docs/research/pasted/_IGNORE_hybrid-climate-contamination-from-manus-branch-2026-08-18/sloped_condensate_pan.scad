/* Sloped annular condensate pan — CONCEPT PROTOTYPE, mm.
   3 degree nominal drainage. Validate cleanability, fluid compatibility, sag,
   overflow, float function and leakage before use. */
$fn=96;
ro=1420; ri=1120; pan_t=3.5; trough_w=28; trough_d=20; slope_deg=3;
nipple_od=14; nipple_id=9; float_boss_d=26; baffle_count=12;

module annulus(ro_,ri_,h_){ difference(){cylinder(r=ro_,h=h_); cylinder(r=ri_,h=h_+1);} }
module pan(){
 difference(){
  union(){
   // Conical catchment surface, low point at +Y after tilt.
   rotate([slope_deg,0,0]) annulus(ro,ri,pan_t);
   // Peripheral trough at outer radius.
   difference(){ cylinder(r=ro+trough_w,h=trough_d+pan_t); cylinder(r=ro-trough_w,h=trough_d+pan_t+1); }
   // Low-point nipple along +Y side, aligned with trough low position.
   translate([0,ro,pan_t+8]) rotate([90,0,0]) cylinder(d=nipple_od,h=45);
   // Float switch bosses.
   for(x=[-90,90]) translate([x,ro-55,pan_t]) cylinder(d=float_boss_d,h=12);
   // Radial anti-slosh baffles, with gaps to preserve drainage.
   for(a=[0:360/baffle_count:359]) rotate([0,0,a]) translate([ri+35,-2,pan_t]) cube([ro-ri-95,4,12]);
  }
  // Drain bore and float mounting bores.
  translate([0,ro+1,pan_t+8]) rotate([90,0,0]) cylinder(d=nipple_id,h=60);
  for(x=[-90,90]) translate([x,ro-55,-1]) cylinder(d=4.5,h=25);
 }
}
pan();
// Add service cleanout, overflow and gasket interface only after controlled drainage testing.
