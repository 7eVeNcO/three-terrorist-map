(function () {
    $("#infobox").hide();

	var dataset;
	var webglEl = document.getElementById('webgl');
    var webglDetail = document.getElementById('detail');
	var selectedObject;
    var selectedColor;
    var display = "fatalities";

	if (!Detector.webgl) {
		Detector.addGetWebGLMessage(webglEl);
		return;
	}

	var width  = window.innerWidth,
		height = window.innerHeight,
		coefx = (width)/360,
		coefy = (height)/180
		;

	var scene = new THREE.Scene();

	var camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 2000);
	camera.position.z = 1000;

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);

    scene.add(new THREE.AmbientLight(0xffffff));

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.6 );
    directionalLight.position.y = -50;
    directionalLight.position.z = 50;
    scene.add( directionalLight );

	var map = createMap(width, height, 64);
	scene.add(map);

    var group = new THREE.Object3D();
    var groupDetail = new THREE.Object3D();

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
        this.display = "Fatalities"
    };

    var text = new FizzyText();
    var gui = new dat.GUI();
    var yearController = gui.add(text, 'year', 1970, 2015).name('Year');
    var visualMapping = gui.addFolder("Visual mapping");
    var filters = gui.addFolder("Filter");

    var meshHeight = visualMapping.add( text, 'display', [ "Fatalities", "Injured", "Fatalities + Injured" ] ).name('Height reprezentation');

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

    setControllers();

    /**
     * Load data from Csv
     */
    loadCsv(Math.round(text.year));

    var controls = initControls();

    document.addEventListener( 'dblclick', onDocumentMouseDown, false );
    window.addEventListener( 'resize', onWindowResize, false );


    /**
     * Detail
     */
    webglEl.appendChild(renderer.domElement);

    var sceneDetail = new THREE.Scene();
    var detailWidth = 300;
    var detailHeight = 200;

    var cameraDetail = new THREE.PerspectiveCamera(45, detailWidth / detailHeight, 0.01, 500);
    cameraDetail.position.z = 265;

    var rendererDetail = new THREE.WebGLRenderer();
    rendererDetail.setSize(detailWidth, detailHeight);

    webglDetail.appendChild(rendererDetail.domElement);

	render();
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * Functions:
     */

	function render() {
        controls.update();

        //TODO otestuj poziciu kamery
		requestAnimationFrame(render);
        renderer.clear();
		renderer.render(scene, camera);

        rendererDetail.clear();
        rendererDetail.render(sceneDetail, cameraDetail);
	}

    /**
     * Detail
     */
	function showDetail(selectedObject) {

        showDetailHeader();

        sceneDetail.remove(groupDetail);
        groupDetail = new THREE.Object3D();

	    var shift = 25;
	    var detailLimits = calculateDetailYears();

	    console.log(detailLimits);

        metrics = calculateDetailMetrics( selectedObject.userData.country, detailLimits);


        for(i=detailLimits.start; i<=detailLimits.end; i++) {
            var heightDetail = 150 * (metrics[i] / metrics.max);

            var geometry = new THREE.BoxGeometry( 10, heightDetail, 1 );
            var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
            var cube = new THREE.Mesh( geometry, material );
            cube.position.x = (0 - detailWidth/2) + shift;
            cube.position.y = (0 - detailHeight/2) + 20 + heightDetail/2;
            shift+=25;
            groupDetail.add( cube );

            var spritey = makeTextSprite(i);
            spritey.position.set(cube.position.x+35,cube.position.y-heightDetail/2-30,0);
            groupDetail.add(spritey);

        }

        sceneDetail.add(groupDetail);
        $("#infobox").show();
    }

    function showDetailHeader(){
	    var header = "";

        if(selectedObject.userData.city != undefined)
            header = ("City: "+selectedObject.userData.city+"<br>" +
                "Country: "+selectedObject.userData.country+"<br>" +
                text.display+": "+Math.round(selectedObject.userData[display])+"<br>" +
                "Total "+text.display+": "+Math.round(selectedObject.userData.total_fatalities)+"<br>" +
                "Attack Type: "+selectedObject.userData.attack_type +"<br>" +
                "Number of attacks: "+selectedObject.userData.grouped);
        else
            header = ("Country: "+selectedObject.userData.country+"<br>"+"Total "+text.display+": "+Math.round(selectedObject.userData.total_fatalities)+"<br>" + text.display+": "+Math.round(selectedObject.userData[display])+"<br>Attack Type: "+selectedObject.userData.attack_type +"<br>Number of attacks: "+selectedObject.userData.grouped);


        document.getElementById("detail-top").innerHTML = header;
    }

    function calculateDetailMetrics(country, detailLimits) {
	    var metrics = {};
	    metrics.max = 0;

	    //Init array
	    for(i=detailLimits.start; i<=detailLimits.end; i++){
            metrics[i] = 0;
        }

        //Calculate values for each year
        for (i = 0; i < dataset.length; i++) {
            if(dataset[i].country==country && (dataset[i].year>=detailLimits.start && dataset[i].year<=detailLimits.end)) {
                metrics[dataset[i].year]+=parseInt(dataset[i].fatalities);

            }
        }

        //Calculate maximum value
        for(i=detailLimits.start; i<=detailLimits.end; i++){
            if(metrics[i] > metrics.max){
                metrics.max = metrics[i];
            }
        }
	    return metrics;
    }

    function calculateDetailYears() {
	    var Object = {};

        var year = Math.round(text.year);
        Object.start = year - 5;
        if(Object.start<1970)
            Object.start = 1970;
        if(Object.start>2005)
            Object.start = 2005;

        Object.end = Object.start + 10;
        return Object;
    }

    function makeTextSprite( message, parameters )
    {
        if ( parameters === undefined ) parameters = {};

        var fontface = parameters.hasOwnProperty("fontface") ?
            parameters["fontface"] : "Arial";

        var fontsize = parameters.hasOwnProperty("fontsize") ?
            parameters["fontsize"] : 30;

        var borderThickness = parameters.hasOwnProperty("borderThickness") ?
            parameters["borderThickness"] : 4;

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        context.font = "Bold " + fontsize + "px " + fontface;

        // get size data (height depends only on font size)
        var metrics = context.measureText( message );
        var textWidth = metrics.width;

        // text color
        context.fillStyle = "rgba(255, 255, 255, 1.0)";

        context.fillText( message, borderThickness, fontsize + borderThickness);

        // canvas contents will be used for a texture
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial(
            { map: texture } );
        var sprite = new THREE.Sprite( spriteMaterial );
        sprite.scale.set(100,50,1.0);
        return sprite;
    }

    /**
     *  Vytvorenie Meshu na zobrazenie
     * @param posX
     * @param posY
     * @param posZ
     * @param attackType
     * @param height
     * @param grouped
     * @returns {THREE.Mesh}
     */
	function createMesh(posX, posY, posZ, attackType, height, grouped){
        var width = 2;

        if(grouped>1)
            width = 3;
        if(grouped>10)
            width = 4;
        if(grouped>20){
            width = 5;
        }

        var mesh = new THREE.Mesh( new THREE.CylinderGeometry(width, width, height, 100),
        new THREE.MeshStandardMaterial( {}));
        mesh.position.y = posY;
        mesh.position.x = posX;
        mesh.position.z = posZ;
        mesh.rotation.x = Math.PI / 4;
        mesh.visible = getVisibility(attackType);
        mesh.material.color.setHex(getColor(attackType));
        return mesh;
	}

	function calculateMeshHeight(value) {
        var height = 10;

        if(value>1)
            height+=value/10;
        if(value>999)
            height=100;

        return height;
    }

    function displayData(){
        displayDataByCountryGrouped(Math.round(text.year));
        // displayDataByCity(year);
        // displayAllData(year);
    }

    function displayDataByCity(year){

        scene.remove(group);
        group = null;
        group = new THREE.Group();

        group = new THREE.Object3D();
        var displayable = {};

        for (i = 0; i < dataset.length; i++) {
            if(dataset[i].year==year){

                if( displayable[dataset[i].city+"-"+dataset[i].attack_type] === undefined ) {
                    var Object = {};
                    Object["city"] = dataset[i].city;
                    Object["latitude"] = dataset[i].latitude;
                    Object["longitude"] = dataset[i].longitude;
                    Object["attack_type"] = dataset[i].attack_type;
                    Object["fatalities"] = dataset[i].fatalities;
                    Object["country"] = dataset[i].country;
                    Object["grouped"] = 1;
                    displayable[dataset[i].city+"-"+dataset[i].attack_type] = Object;
                }
                else{
                    displayable[dataset[i].city+"-"+dataset[i].attack_type].fatalities = parseInt(displayable[dataset[i].city+"-"+dataset[i].attack_type].fatalities) + parseInt(dataset[i].fatalities);
                    displayable[dataset[i].city+"-"+dataset[i].attack_type].grouped = parseInt(displayable[dataset[i].city+"-"+dataset[i].attack_type].grouped) + 1;
                }
            }
        }

        console.log(displayable);

        for (var key in displayable){
            var height = calculateMeshHeight(displayable[key].fatalities);

            mesh = createMesh(coefx*displayable[key].longitude, coefy*displayable[key].latitude, 20, displayable[key].attack_type, height,  displayable[key].grouped);
            var info = {};
            info.city = displayable[key].city;
            info.country = displayable[key].country;
            info.fatalities = displayable[key].fatalities;
            info.attack_type = displayable[key].attack_type;
            mesh.userData = info;
            group.add(mesh);
        }

        scene.add(group);
    }

    function displayDataByCountryGrouped(year) {

        scene.remove(group);
        group = null;
        group = new THREE.Object3D();


        /**
         * Vyvor objekty na zobrazenie
         */
        var displayable = {};

        for (i = 0; i < dataset.length; i++) {
            if((dataset[i].year == year) && (getVisibility(dataset[i].attack_type))){

                var record = dataset[i];

                if( displayable[dataset[i].country] === undefined ) {

                    var Object = {};
                    var ObjectIn = {};
                    Object["latitude"] = dataset[i].latitude;
                    Object["longitude"] = dataset[i].longitude;
                    Object["country"] = dataset[i].country;
                    Object["grouped"] = 1;
                    Object["attack_types"] = 1;

                    Object[display] = getDisplayValue(record);

                    Object["attacks"] = {};
                    Object.attacks[dataset[i].attack_type] = {};

                    ObjectIn[display] = getDisplayValue(record);

                    ObjectIn.grouped = 1;
                    Object.attacks[dataset[i].attack_type] = ObjectIn;

                    displayable[dataset[i].country] = Object;
                }
                else {
                    displayable[record.country].grouped+= 1;
                    displayable[record.country][display]+= getDisplayValue(record);

                    if(displayable[dataset[i].country].attacks[dataset[i].attack_type] == undefined) {
                        displayable[dataset[i].country].attack_types+= 1;
                        displayable[dataset[i].country].attacks[dataset[i].attack_type] = {};
                        displayable[dataset[i].country].attacks[dataset[i].attack_type][display] = getDisplayValue(record);
                        displayable[dataset[i].country].attacks[dataset[i].attack_type].grouped = 1;

                    }
                    else {
                        displayable[dataset[i].country].attacks[dataset[i].attack_type][display] += getDisplayValue(record);
                        displayable[dataset[i].country].attacks[dataset[i].attack_type].grouped +=  1;
                    }

                }
            }
        }

        console.log(displayable);

        /**
         * Zobraz objekty
         */

        for (var country in displayable) {
            var length = 0;
            for (var attackType in displayable[country].attacks) {
                // var height = calculateMeshHeight(displayable[country].attacks[attackType].fatalities);

                var height = calculateMeshHeight( displayable[country][display]);
                height = (displayable[country].attacks[attackType][display] / displayable[country][display]) * height;

                mesh = createMesh(coefx*displayable[country].longitude, coefy*displayable[country].latitude + (length+height/2)*Math.sin(Math.PI / 4), (length+height/2)*Math.sin(Math.PI / 4), attackType, height, displayable[country].grouped);

                length+=height;
                var info = {};
                info.country = country;
                info[display] = displayable[country].attacks[attackType][display];
                info.attack_type = attackType;
                info.grouped = displayable[country].grouped;
                info.total_fatalities = displayable[country][display];
                mesh.userData = info;
                group.add(mesh);
            }
        }

        scene.add(group);
    }

    function getDisplayValue(record) {
        if(display != "affected"){
            console.log(record);
            return parseInt(record[display]);
        } else {
            return (parseInt(record.fatalities) +  parseInt(record.injuries));
        }
    }

    function displayAllData(year){

        scene.remove(group);
        group = null;
        group = new THREE.Group();


        for (i = 0; i < dataset.length; i++) {
            if(dataset[i].year==year){
                mesh = createMesh(coefx*dataset[i].longitude, coefy*dataset[i].latitude, dataset[i].attack_type, dataset[i].fatalities, 1);
                group.add(mesh);
            }
        }

        console.log(displayable);
        scene.add(group);
    }

    function initControls(){
        var controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.panningMode = THREE.ScreenSpacePanning; // default is THREE.ScreenSpacePanning
        controls.minDistance = 100;
        controls.maxDistance = 1000;
        // controls.enableRotate = false;

        controls.minPolarAngle = Math.PI/4; // radians
        controls.maxPolarAngle = Math.PI*3/4; // radians

        controls.minAzimuthAngle = -Math.PI/4; // radians
        controls.maxAzimuthAngle = Math.PI/4; // radians

        controls.enableKeys = true;
        return controls;
    }

	function loadCsv(year){
        $.ajax({
            type: "GET",
            url: "dataset_known.csv",
            dataType: "text",
            success: function(data) {
                dataset = $.csv.toObjects(data);
                console.log(dataset);
                displayData();
            }
        });
    }

    function reColor() {
        for(i=0; i<group.children.length; i++) {

           var attackType = group.children[i].userData.attack_type;
           group.children[i].material.color.setHex(getColor(attackType));
        }
    }

    function getColor(attackType){

        if(attackType=="Bombing/Explosion")
            return (text.Bombing.replace("#", "0x"));
        else if(attackType=="Armed Assault")
            return(text.Armed_Assault.replace("#", "0x") );
        else if(attackType=="Assassination")
            return(text.Assasination.replace("#", "0x") );
        else if(attackType=="Hostage Taking (Kidnapping)")
            return(text.Hostage_Taking.replace("#", "0x") );
        else if(attackType=="Facility/Infrastructure Attack")
            return(text.Infrastructure_Attack.replace("#", "0x") );
        else
            return(text.Other.replace("#", "0x") );
    }

    function getVisibility(attackType){
        if(attackType=="Bombing/Explosion"){
            return text.fBombing;
        }
        else if(attackType=="Armed Assault"){
            return text.fArmedAssault;
        }
        else if(attackType=="Assassination"){
            return text.fAssasination;
        }

        else if(attackType=="Hostage Taking (Kidnapping)"){
            return text.fHostageTaking;
        }
        else if(attackType=="Facility/Infrastructure Attack"){
            return text.fInfrastructureAttack;
        }
        else
        {
            return text.fOther;
        }
    }

    function reFilter() {
        displayDataByCountryGrouped(Math.round(text.year));
    }


    /**
     * Visual elements functions
     */

    function createMap(width, height, segments) {
        return new THREE.Mesh(
            new THREE.PlaneGeometry(width, height, segments),
            new THREE.MeshBasicMaterial({
                map:  new THREE.TextureLoader().load("images/map4k.jpg" ),
                side: THREE.FrontSide
            })
        );
    }


    /**
     * Listeners functions
     */

    function onDocumentMouseDown( e )
    {
        var mouseVector = new THREE.Vector3();
        var raycaster = new THREE.Raycaster();

        e.preventDefault();
        mouseVector.x = 2 * (e.clientX / width) - 1;
        mouseVector.y = 1 - 2 * ( e.clientY / height );
        raycaster.setFromCamera(mouseVector, camera);

        var intersects = raycaster.intersectObjects( group.children );

        if(intersects.length > 0) {

            var intersection = intersects[0];
            selectedObject = intersection.object;

            selectedColor = selectedObject.material.emissive.getHex();
            selectedObject.material.emissive.setHex( 0x444444 );

            showDetail(selectedObject);

         }
    }

    $("#close").click( function()
        {
            $("#infobox").hide();
            selectedObject.material.emissive.setHex(selectedColor);
        }
    );

    function onWindowResize(){

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );
    }

    function setControllers(){
        colorBomb.onFinishChange(function(value) {
            reColor();
        });
        colorAA.onFinishChange(function(value) {
            reColor();
        });
        colorAss.onFinishChange(function(value) {
            reColor();
        });
        colorHT.onFinishChange(function(value) {
            reColor();
        });
        colorIA.onFinishChange(function(value) {
            reColor();
        });
        colorOther.onFinishChange(function(value) {
            reColor();
        });
        fBombing.onFinishChange(function(value) {
            reFilter();
        });
        fArmedAssault.onFinishChange(function(value) {
            reFilter();
        });
        fAssasination.onFinishChange(function(value) {
            reFilter();
        });
        fHostageTaking.onFinishChange(function(value) {
            reFilter();
        });
        fInfrastructureAttack.onFinishChange(function(value) {
            reFilter();
        });
        fOther.onFinishChange(function(value) {
            reFilter();
        });

        yearController.onFinishChange(function(value) {
            displayData();
        });

        meshHeight.onFinishChange(function(value) {
            if(text.display == "Fatalities"){
                display = "fatalities";
            }
            else if (text.display == "Injured"){
                display = "injuries";
            }
            else if (text.display == "Fatalities + Injured"){
                display = "affected";
            }

            console.log(display);

            displayData();
        });
    }

    //Unused:
    function displayDataByCountry(year){

        scene.remove(group);
        group = null;
        group = new THREE.Object3D();

        /**
         * Vyvor objekty na zobrazenie
         */
        var displayable = {};

        for (i = 0; i < dataset.length; i++) {
            if(dataset[i].year==year){

                if( displayable[dataset[i].country+"-"+dataset[i].attack_type] === undefined ) {
                    var Object = {};
                    // Object["city"] = dataset[i].city;
                    Object["latitude"] = dataset[i].latitude;
                    Object["longitude"] = dataset[i].longitude;
                    Object["attack_type"] = dataset[i].attack_type;
                    Object["fatalities"] = parseInt(dataset[i].fatalities);
                    Object["country"] = dataset[i].country;
                    Object["grouped"] = 1;
                    displayable[dataset[i].country+"-"+dataset[i].attack_type] = Object;
                }
                else{
                    displayable[dataset[i].country+"-"+dataset[i].attack_type].fatalities += parseInt(dataset[i].fatalities);
                    displayable[dataset[i].country+"-"+dataset[i].attack_type].grouped +=  1;
                }
            }
        }

        console.log(displayable);

        /**
         * Zobraz objekty
         */

        for (var key in displayable) {
            var height = calculateMeshHeight(displayable[key].fatalities);

            mesh = createMesh(coefx*displayable[key].longitude, coefy*displayable[key].latitude, 20, displayable[key].attack_type, height,  displayable[key].grouped);
            var info = {};
            info.country = displayable[key].country;
            info.fatalities = displayable[key].fatalities;
            info.attack_type = displayable[key].attack_type;
            info.grouped = displayable[key].grouped;
            mesh.userData = info;
            group.add(mesh);
        }

        scene.add(group);
    }

}());