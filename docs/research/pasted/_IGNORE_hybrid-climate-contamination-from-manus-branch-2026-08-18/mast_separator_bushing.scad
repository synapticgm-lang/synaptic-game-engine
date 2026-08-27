/*
 Internal Mast Cable/Hose Separator Bushing — CONCEPT PROTOTYPE
 Units: mm. For 50 mm OD / 44 mm ID mast. Verify fit, materials, fire,
 ingress, creepage, vibration, cable bend radius, hose crush and drain paths.
*/
$fn = 96;

mast_id          = 44.0;
radial_clearance = 0.40;
bushing_od       = mast_id - 2*radial_clearance;
bushing_length   = 32;
wall              = 2.2;
// Fluid hoses: 10 mm ID requires OD supplied by actual hose. Model assumes 14 mm OD.
hose_od          = 14.0;
power_bundle_d   = 8.0;  // maximum jacketed high-draw DC bundle OD
sensor_bundle_d  = 6.0;  // shielded sensor/control bundle OD
channel_clearance= 0.75;
flange_od        = 43.6;
flange_thickness = 2.0;
slot_width       = 2.2;  // compliance slot for insertion

module bore(d, x, y) {
  translate([x,y,-1]) cylinder(d=d+2*channel_clearance, h=bushing_length+2);
}

module separator_bushing() {
  difference() {
    union() {
      cylinder(d=bushing_od, h=bushing_length);
      cylinder(d=flange_od, h=flange_thickness);
      translate([0,0,bushing_length-flange_thickness]) cylinder(d=flange_od, h=flange_thickness);
      // Radial anti-snag baffles; retained between channel clearances.
      for (a=[0,90,180,270]) rotate([0,0,a]) translate([4,-wall/2,0]) cube([bushing_od/2-4,wall,bushing_length]);
    }
    // Two diametrically balanced glycol-hose channels.
    bore(hose_od, -9.8, 0);
    bore(hose_od,  9.8, 0);
    // Electrical and sensor channels segregated at 90 degrees.
    bore(power_bundle_d, 0, 10.3);
    bore(sensor_bundle_d,0,-10.3);
    // Axial compliance slit avoids pinching at assembly; locate away from power path.
    translate([-bushing_od/2-1,-slot_width/2,0]) cube([bushing_od/2+3,slot_width,bushing_length]);
  }
}

separator_bushing();

// Assembly notes:
// 1. Choose actual bore diameters from hose/cable OD, bend radius and thermal expansion.
// 2. Do not rely on polymer partition as the electrical protective-separation barrier.
// 3. Add grommets/strain relief and verify no sharp edge contacts insulation.
// 4. Use keyed insertion orientation and inspection mark in production.
