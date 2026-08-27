/* Hybrid cassette base reservoir & ballast chassis — CONCEPT PROTOTYPE, mm.
   Validate structural loads, pressure containment, battery fire isolation, drainage,
   ingress, material, anchorage, thermal and electrical safety before manufacture. */
$fn=80;
base_d=900; base_h=260; shell=5; reservoir_d=460; reservoir_h=180;
pcm_count=6; cartridge_d=65; pump_bay=[180,150,120]; battery_bay=[310,190,150];
boss_d=32; boss_h=18; bolt_d=8; mast_socket_d=54; mast_socket_h=120;

module vibration_boss(x,y,z=0){ difference(){translate([x,y,z]) cylinder(d=boss_d,h=boss_h); translate([x,y,z-1]) cylinder(d=bolt_d,h=boss_h+2);} }
module rounded_box(sz,r=18){ hull() for(x=[-sz[0]/2+r,sz[0]/2-r]) for(y=[-sz[1]/2+r,sz[1]/2-r]) translate([x,y,0]) cylinder(r=r,h=sz[2]); }
module chassis(){
 difference(){
  union(){ cylinder(d=base_d,h=base_h); translate([0,0,base_h]) cylinder(d=base_d-80,h=20); translate([0,0,base_h]) cylinder(d=mast_socket_d+20,h=mast_socket_h); }
  translate([0,0,shell]) cylinder(d=base_d-2*shell,h=base_h+30); // internal ballast cavity
  translate([0,0,base_h-reservoir_h-20]) cylinder(d=reservoir_d,h=reservoir_h+30); // 40 kg reservoir envelope
  translate([220,0,base_h-pump_bay[2]-20]) rounded_box(pump_bay); // pump compartment
  translate([-210,0,base_h-battery_bay[2]-20]) rounded_box(battery_bay); // battery compartment
  translate([0,0,base_h-12]) cylinder(d=mast_socket_d,h=mast_socket_h+20); // mast bore
  translate([0,-reservoir_d/2+30,base_h-30]) rotate([90,0,0]) cylinder(d=32,h=70); // immersion-heater service port
  for(a=[0:90:270]) rotate([0,0,a]) translate([base_d/2-60,0,base_h-30]) cylinder(d=24,h=45); // drain/anchor bosses
 }
 // isolation bosses: 4 pump and 4 battery mounts
 for(x=[145,295]) for(y=[-50,50]) vibration_boss(x,y,base_h-pump_bay[2]-20);
 for(x=[-305,-115]) for(y=[-65,65]) vibration_boss(x,y,base_h-battery_bay[2]-20);
 // PCM cartridge sleeves around reservoir
 for(a=[0:360/pcm_count:359]) rotate([0,0,a]) translate([(reservoir_d/2)+45,0,base_h-reservoir_h]) cylinder(d=cartridge_d+8,h=reservoir_h);
}
chassis();
// Print as sectional prototype; production requires separate pressure-rated reservoir and certified battery enclosure.
