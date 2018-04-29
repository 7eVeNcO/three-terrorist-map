var FizzyText = function() {
    this.year = 1970;
    this.Bombing = "#2A478A";
    this.Armed_Assault = "#792188";
    this.Assasination = "#3DAC26";
    this.Hostage_Taking = "#CFC02E";
    this.Infrastructure_Attack = "#CF2E2E";
    this.Other = "#CF682E";
    this.fBombing = true;
    this.fArmedAssault = true;
    this.fAssasination = true;
    this.fHostageTaking = true;
    this.fInfrastructureAttack = true;
    this.fOther = true;
    this.display = "Fatalities";
    this.width = "Number of attacks"
};

var text = new FizzyText();
var gui = new dat.GUI();
var yearController = gui.add(text, 'year', 1970, 2015).name('Year');
var visualMapping = gui.addFolder("Visual mapping");
var filters = gui.addFolder("Filter");

var meshHeight = visualMapping.add( text, 'display', [ "Fatalities", "Injured", "Fatalities + Injured" ] ).name('Height representation');
var meshWidth = visualMapping.add( text, 'width').name('Width').domElement.style.pointerEvents = "none";

var colorBomb = visualMapping.addColor(text, 'Bombing').name('Bombing');
var colorAA = visualMapping.addColor(text, 'Armed_Assault').name('Armed Assault');
var colorAss = visualMapping.addColor(text, 'Assasination');
var colorHT = visualMapping.addColor(text, 'Hostage_Taking').name('Hostage Taking');
var colorIA = visualMapping.addColor(text, 'Infrastructure_Attack').name('Infrastructure');
var colorOther = visualMapping.addColor(text, 'Other');

var fBombing= filters.add( text, 'fBombing' ).name('Bombing');
var fArmedAssault= filters.add( text, 'fArmedAssault' ).name('Armed Assault');
var fAssasination= filters.add( text, 'fAssasination' ).name('Assasination');
var fHostageTaking= filters.add( text, 'fHostageTaking' ).name('Hostage Taking');
var fInfrastructureAttack= filters.add( text, 'fInfrastructureAttack' ).name('Infrastructure Attack');
var fOther= filters.add( text, 'fOther' ).name('Other');