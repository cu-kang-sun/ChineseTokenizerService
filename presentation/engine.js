THREE.Object3D.prototype.lookAtWorld = function (vector) {

    this.parent.worldToLocal(vector);
    this.lookAt(vector);

};

var FONT_SIZE = 5;
var FONT_SIZE_NBR = 3;
var LINK_HEIGHT = 200;

var camera, scene, renderer;

function charPosition(index) {
    return {
        x: index * 10 * FONT_SIZE,
        y: LINK_HEIGHT,
        z: 0
    }
}

function init() {
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / (window.innerHeight - 100), 1, 10000);
    camera.position.set(-50, 200, 50);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
//    scene.background = new THREE.Color( 0x000000 );

    setLines();


    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("space").appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize, false);


//    var controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls = new THREE.OrbitControls(camera, renderer.domElement);
//    controls.noRotate = true;
    controls.target.set(0, 200, 0);
    controls.update();
} // end init

var allChars = [];
var allLinks = [];
var inNbrs = {chars:[], links:[], show:false};
var outNbrs = {chars:[], links:[], show:false};

function loadTextGraph(textJson) {
    var texts = textJson;
    var loader = new THREE.FontLoader();
    loader.load('./FZLanTingHeiS-UL-GB_Regular.json', function (font) {
        console.log("font loaded");
        var color = 0x010101;
        var matDark = new THREE.LineBasicMaterial({
            color: color,
            side: THREE.DoubleSide
        });

        var matLite = new THREE.MeshBasicMaterial({
            color: color,
//            transparent: true,
//            opacity: 0.4,
            side: THREE.DoubleSide
        });

        var makeChar = function (char, material, size, x, y, z) {
            var text;
            var textShape = new THREE.BufferGeometry();

            var shapes = font.generateShapes(char, size, 4);

            var geometry = new THREE.ShapeGeometry(shapes);
            geometry.computeBoundingBox();

            textShape.fromGeometry(geometry);

            text = new THREE.Mesh(textShape, material);
            text.position.y = y || 0;
            text.position.x = x || 0; //i*4*FONT_SIZE;
            text.position.z = z || 0;
            text.name = char;
            // text.parent = scene;
            return text;
        };

        var makeLink = function (x1, y1, z1, x2, y2, z2, color) {
            var geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3(x1, y1, z1));
            geometry.vertices.push(new THREE.Vector3(x2, y2, z2));
            var color = color || 0x006699;
            var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: color}));
            // line.parent = scene;
            return line;
        };
        var i = 0;
        var current = {};
        var previous = null;
        while (current = texts[i]) {
            var currentChar = current['char'];
//            console.log(currentChar)

            //var charX = i*6*FONT_SIZE;
            var position = charPosition(i);
//            var charObj = makeChar(currentChar, matDark, FONT_SIZE, charX, LINK_HEIGHT)
            var charObj = makeChar(currentChar, matDark, FONT_SIZE, position.x, position.y, position.z);
            scene.add(charObj);
            allChars.push(charObj);

            if (previous) {
                var charLinkObj = makeLink(previous.x, previous.y, previous.z, position.x, position.y, position.z);
                var charWeightObj = makeChar(previous.weight, matDark, FONT_SIZE / 3.0, (previous.x + position.x) / 2.0, position.y, position.z);
                scene.add(charLinkObj);
                allLinks.push(charLinkObj);
                scene.add(charWeightObj);
                allChars.push(charWeightObj);
            }
            previous = {x: position.x, y: position.y, z: position.z, weight: current['outWeight']};

            var makeNbrs = function (nbrs, isOut) {
                var r = 4 * FONT_SIZE;
                var cache = inNbrs;
                var offset = -0.5*r;
                if(isOut){
                    cache = outNbrs;
                    offset *= -1;
                }
                var interval = Math.PI * 2 / nbrs.length;
                for (var j = 0; j < nbrs.length; j++) {
                    var z = r * Math.cos(j * interval);
                    var y = r * Math.sin(j * interval) + LINK_HEIGHT;
                    var nbrObj = makeChar(nbrs[j][0], matLite, FONT_SIZE_NBR, charObj.position.x+offset, y, z);
                    cache.chars.push(nbrObj);
                    scene.add(nbrObj);

                    var linkNbrObj = makeLink(charObj.position.x, charObj.position.y, charObj.position.z, nbrObj.position.x, nbrObj.position.y, nbrObj.position.z);
                    // allLinks.push(linkNbrObj);
                    cache.links.push(linkNbrObj);
                    scene.add(linkNbrObj);

                    var weightNbrObj = makeChar(nbrs[j][1], matLite, FONT_SIZE_NBR / 3.0, (charObj.position.x + nbrObj.position.x)/2.0, (charObj.position.y + nbrObj.position.y) / 2.0, (charObj.position.z + nbrObj.position.z) / 2.0);
                    cache.chars.push(weightNbrObj);
                    scene.add(weightNbrObj);
                }
            };
            makeNbrs(current['neighbour_out'], true);
            makeNbrs(current['neighbour_in'], false);

            i++;
        }
        // displayNbr(outNbrs.show, inNbrs.show);
        updateNbrDisplay();

    }); //end load function
}

function setLines() {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(0, 0, 0));//在x轴上定义两个点p1(-500,0,0)
    geometry.vertices.push(new THREE.Vector3(1000, 0, 0));//p2(500,0,0)

    for (var i = 0; i <= 50; i++) {//这两个点决定了x轴上的一条线段，将这条线段复制20次，分别平行移动到z轴的不同位置，就能够形成一组平行的线段。

        var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: 0xaaaaaa, opacity: 0.1}));
        line.position.z = (i * 20) - 500;
        line.matrixAutoUpdate = false;
        line.updateMatrix();
        scene.add(line);

        var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: 0xaaaaaa, opacity: 0.1}));
        line.position.z += 500;
        line.position.x = (i * 20);
        line.rotation.y = 90 * Math.PI / 180; //  旋转90度
        scene.add(line);
//将p1p2这条线先围绕y轴旋转90度，然后再复制20份，平行于z轴移动到不同的位置，也能形成一组平行线。
    }
}

function clearGraph() {
    var buffer = allChars;
    allChars = [];
    buffer.forEach(function (obj) {
        scene.remove(obj);
    });

    buffer = allLinks;
    allLinks = [];
    buffer.forEach(function (obj) {
        scene.remove(obj);
    });

    displayNbr(false, false, true);
    inNbrs.chars = [];
    inNbrs.links = [];
    outNbrs.chars = [];
    outNbrs.links = [];
}

function updateNbrDisplay() {
    var removeFromCache = function (cache) {
        // cache.show = false;
        cache.chars.forEach(function (obj) {
            scene.remove(obj);
        });
        cache.links.forEach(function (obj) {
            scene.remove(obj);
        });
    };

    var addFromCache = function (cache) {
        // cache.show = true;
        cache.chars.forEach(function (obj) {
            scene.add(obj);
        });
        cache.links.forEach(function (obj) {
            scene.add(obj);
        });
    };

    if(outNbrs.show === true){
        addFromCache(outNbrs);
    }else{
        removeFromCache(outNbrs);
    }

    if(inNbrs.show === true){
        addFromCache(inNbrs);
    }else{
        removeFromCache(inNbrs);
    }
}

function displayNbr(showOut, showIn, force) {
    var removeFromCache = function (cache) {
        if(!force)
            cache.show = false;
        cache.chars.forEach(function (obj) {
            scene.remove(obj);
        });
        cache.links.forEach(function (obj) {
            scene.remove(obj);
        });
    };

    var addFromCache = function (cache) {
        if(!force)
            cache.show = true;
        cache.chars.forEach(function (obj) {
            scene.add(obj);
        });
        cache.links.forEach(function (obj) {
            scene.add(obj);
        });
    };

    if(showOut === true && outNbrs.show === false){
        addFromCache(outNbrs);
    }else if(showOut === false && outNbrs.show === true){
        removeFromCache(outNbrs);
    }

    if(showIn === true && inNbrs.show === false){
        addFromCache(inNbrs);
    }else if(showIn === false && inNbrs.show === true){
        removeFromCache(inNbrs);
    }
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    var billboard = function (geometrys) {
        if(geometrys){
            geometrys.forEach(function (geometry) {
                geometry.lookAtWorld(camera.getWorldPosition());
            })
        }
    };

    billboard(allChars);
    if(inNbrs.show === true){
        billboard(inNbrs.chars);
    }
    if(outNbrs.show === true){
        billboard(outNbrs.chars);
    }
//     if (allChars) {
//         allChars.forEach(function (geometry) {
//             geometry.lookAtWorld(camera.getWorldPosition());
//         });
//     } else {
// //        console.log("none");
//     }
    controls.update();
    renderer.render(scene, camera);
}

init();
animate();