/*
 Universal Plenum Diffuser Sector — CONCEPT PROTOTYPE
 Units: mm. Validate material, snap fatigue, airflow, flame, UV and structural
 performance before use. Designed for 3D-printable fit checking, not production.
*/
$fn = 72;

// ---------- USER PARAMETERS ----------
outer_radius       = 1450; // cassette outer radius for 2.9 m nominal OD
inner_radius       = 1180; // plenum inner radius
sector_angle       = 20;   // degrees; 18 sectors make full annulus
plenum_height      = 75;   // requested 3 inch nominal chamber
wall               = 3.2;
base_thickness     = 3.6;
slot_height        = 10;   // equivalent perimeter diffuser opening
slot_pitch         = 35;   // downward-inward discharge angle
vane_count         = 5;
vane_thickness     = 2.0;
tab_width          = 20;
tab_length         = 18;
tab_thickness      = 3.2;
clearance          = 0.35;
show_cutaway       = false;

function pt(r,a,z=0) = [r*cos(a), r*sin(a), z];

module annular_sector(ro, ri, a, h) {
  // Disk-sector subtraction creates robust printable annulus wedge.
  intersection() {
    difference() {
      cylinder(r=ro, h=h);
      cylinder(r=ri, h=h+0.2);
    }
    linear_extrude(height=h+0.2)
      polygon(points=[[0,0], pt(ro+10,0), pt(ro+10,a), pt(ri-10,a), pt(ri-10,0)]);
  }
}

module radial_vane(angle_deg) {
  // Guide vane directs flow from plenum toward the outer diffuser lip.
  rotate([0,0,angle_deg])
  translate([inner_radius + 60, -vane_thickness/2, base_thickness])
    cube([outer_radius-inner_radius-90, vane_thickness, plenum_height-base_thickness-wall]);
}

module male_tab(angle_deg) {
  rotate([0,0,angle_deg])
  translate([outer_radius-wall-tab_length, -tab_width/2, plenum_height/2-tab_thickness/2])
    cube([tab_length, tab_width, tab_thickness]);
}

module female_slot(angle_deg) {
  rotate([0,0,angle_deg])
  translate([outer_radius-wall-tab_length-clearance, -(tab_width+2*clearance)/2, plenum_height/2-(tab_thickness+2*clearance)/2])
    cube([tab_length+wall+clearance, tab_width+2*clearance, tab_thickness+2*clearance]);
}

module diffuser_nozzle() {
  // Outer lip. A rotated rectangular void forms a nominal 10 mm outlet slot.
  // Final nozzle profile requires CFD and smoke/velocity testing.
  difference() {
    annular_sector(outer_radius, outer_radius-wall-14, sector_angle, plenum_height);
    rotate([0,slot_pitch,0])
      translate([outer_radius-wall-24, -20, plenum_height-slot_height/2])
        cube([55, 50, slot_height], center=false);
  }
}

module sector_body() {
  difference() {
    union() {
      // Base and inner/outer walls.
      annular_sector(outer_radius, inner_radius, sector_angle, base_thickness);
      annular_sector(inner_radius+wall, inner_radius, sector_angle, plenum_height);
      diffuser_nozzle();
      // Bearing ribs / guide vanes.
      for (i=[1:vane_count]) radial_vane(i*sector_angle/(vane_count+1));
      male_tab(0.7);
    }
    // Cap mating face is left open to attach a removable upper skin.
    female_slot(sector_angle-0.7);
    if (show_cutaway)
      rotate([0,0,sector_angle/2]) translate([0,-500,-1]) cube([outer_radius,1000,plenum_height+2]);
  }
}

// Optional removable upper skin; print separately if needed.
module upper_skin() {
  difference() {
    annular_sector(outer_radius, inner_radius, sector_angle, wall);
    for (i=[1:vane_count]) radial_vane(i*sector_angle/(vane_count+1));
  }
}

sector_body();
// translate([0,0,plenum_height+8]) upper_skin();

// Print notes:
// - Orient base on print bed; supports may be required beneath diffuser overhang.
// - Use UV-stable, temperature-appropriate material for prototypes.
// - Add drain/cleanout and production fasteners after validation.
