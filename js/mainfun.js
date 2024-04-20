// common variables
var gl;
var shaderProgram;

var movie_mode = 0;

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

var sx = [1.0, 1.0, 1.0]; //scale
var sy = [1.0, 1.0, 1.0];
var sz = [1.0, 1.0, 1.0];

var shearX = [0.0, 0.0, 0.0]; //shear
var shearY = [0.0, 0.0, 0.0];
var shearZ = [0.0, 0.0, 0.0];

var shearMode = 0; //0 for x-axis, 1 for y, 2 for z

var clippings = [-20, -20, -20]; //clipping
var clipping_type = 1;

var teapotVertexPositionBuffer;
var teapotVertexNormalBuffer;
var teapotVertexFrontColorBuffer;

var CsieVertexFrontColorBuffer;
var CsieVertexNormalBuffer;
var CsieVertexPositionBuffer;

var PlantVertexFrontColorBuffer;
var PlantVertexNormalBuffer;
var PlantVertexPositionBuffer;

var rotateAngle = 180;
var lastTime = 0;
var shadingMethod = 1;
var ka = 0;

var rotationSpeed = 0.03;

var light_locations = new Float32Array([30., 20., 0.]);
var light_locations2 = new Float32Array([50., 50., 0.]);
var light_locations3 = new Float32Array([0., 0., 0.]);


//*************************************************
// Initialization functions
//*************************************************
function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {}

    if (!gl) {
        alert("Could not initialise WebGL");
    }
    if (!gl.getExtension('OES_standard_derivatives')) {
        throw 'extension not support';
    }
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var shaderSource = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            shaderSource += k.textContent;
        }

        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShaders() {
    var fragmentShader = getShader(gl, "fragmentShader");
    var vertexShader = getShader(gl, "vertexShader");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.vertexFrontColorAttribute = gl.getAttribLocation(shaderProgram, "aFrontColor");
    gl.enableVertexAttribArray(shaderProgram.vertexFrontColorAttribute);
    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "shadingMethod"), shadingMethod);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "shadingMethod_vertex"), shadingMethod);
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "Ka"), ka);
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, "lightLoc"), light_locations);
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, "lightLoc2"), light_locations2);
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, "lightLoc3"), light_locations3);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function handleLoadedTeapot(teapotData) {
    teapotVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexPositions), gl.STATIC_DRAW);
    teapotVertexPositionBuffer.itemSize = 3;
    teapotVertexPositionBuffer.numItems = teapotData.vertexPositions.length / 3;

    teapotVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexNormals), gl.STATIC_DRAW);
    teapotVertexNormalBuffer.itemSize = 3;
    teapotVertexNormalBuffer.numItems = teapotData.vertexNormals.length / 3;

    teapotVertexFrontColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexFrontColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotData.vertexFrontcolors), gl.STATIC_DRAW);
    teapotVertexFrontColorBuffer.itemSize = 3;
    teapotVertexFrontColorBuffer.numItems = teapotData.vertexFrontcolors.length / 3;
}

function handleLoadedCsie(CsieData) {
    CsieVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, CsieVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(CsieData.vertexPositions), gl.STATIC_DRAW);
    CsieVertexPositionBuffer.itemSize = 3;
    CsieVertexPositionBuffer.numItems = CsieData.vertexPositions.length / 3;

    CsieVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, CsieVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(CsieData.vertexNormals), gl.STATIC_DRAW);
    CsieVertexNormalBuffer.itemSize = 3;
    CsieVertexNormalBuffer.numItems = CsieData.vertexNormals.length / 3;

    CsieVertexFrontColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, CsieVertexFrontColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(CsieData.vertexFrontcolors), gl.STATIC_DRAW);
    CsieVertexFrontColorBuffer.itemSize = 3;
    CsieVertexFrontColorBuffer.numItems = CsieData.vertexFrontcolors.length / 3;
}

function handleLoadedPlant(PlantData) {
    PlantVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, PlantVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(PlantData.vertexPositions), gl.STATIC_DRAW);
    PlantVertexPositionBuffer.itemSize = 3;
    PlantVertexPositionBuffer.numItems = PlantData.vertexPositions.length / 3;

    PlantVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, PlantVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(PlantData.vertexNormals), gl.STATIC_DRAW);
    PlantVertexNormalBuffer.itemSize = 3;
    PlantVertexNormalBuffer.numItems = PlantData.vertexNormals.length / 3;

    PlantVertexFrontColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, PlantVertexFrontColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(PlantData.vertexFrontcolors), gl.STATIC_DRAW);
    PlantVertexFrontColorBuffer.itemSize = 3;
    PlantVertexFrontColorBuffer.numItems = PlantData.vertexFrontcolors.length / 3;
}


function loadTeapot() {
    if (clipping_type == 0) {
        var request = new XMLHttpRequest();
        request.open("GET", "./model/Teapot.json");
        request.overrideMimeType("application/json");
        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                let jsonObj = JSON.parse(request.responseText);

                /* Clipping*/
                let vertexPositions = jsonObj.vertexPositions;
                let vertexBackcolors = jsonObj.vertexBackcolors;
                let vertexFrontcolors = jsonObj.vertexFrontcolors;
                let vertexNormals = jsonObj.vertexNormals;

                let cx = clippings[0];
                let cy = clippings[1];
                let cz = clippings[2];

                let clippedVertexPositions = [];
                let clippedVertexBackcolors = [];
                let clippedVertexFrontcolors = [];
                let clippedVertexNormals = [];

                for (let i = 0; i < vertexPositions.length; i += 3) {
                    let isOutside = false;
                    for (let idx = 0; idx < clippings.length; idx++) {
                        if (vertexPositions[i + idx] < clippings[idx]) {
                            isOutside = true;
                            break;
                        }
                    }
                    if (!isOutside) {
                        clippedVertexPositions.push(vertexPositions[i], vertexPositions[i + 1], vertexPositions[i + 2]);
                        clippedVertexBackcolors.push(vertexBackcolors[i], vertexBackcolors[i + 1], vertexBackcolors[i + 2]);
                        clippedVertexFrontcolors.push(vertexFrontcolors[i], vertexFrontcolors[i + 1], vertexFrontcolors[i + 2]);
                        clippedVertexNormals.push(vertexNormals[i], vertexNormals[i + 1], vertexNormals[i + 2]);
                    }
                }

                /*End*/

                jsonObj.vertexPositions = clippedVertexPositions;
                jsonObj.vertexBackcolors = clippedVertexBackcolors;
                jsonObj.vertexFrontcolors = clippedVertexFrontcolors;
                jsonObj.vertexNormals = clippedVertexNormals;

                handleLoadedTeapot(jsonObj);
            }
        };
        request.send();
    } else {
        var request = new XMLHttpRequest();
        request.open("GET", "./model/Teapot.json");
        request.overrideMimeType("application/json");
        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                let jsonObj = JSON.parse(request.responseText);

                /* Clipping logic */
                let vertexPositions = jsonObj.vertexPositions;
                let vertexBackcolors = jsonObj.vertexBackcolors;
                let vertexFrontcolors = jsonObj.vertexFrontcolors;
                let vertexNormals = jsonObj.vertexNormals;

                // Define clipping parameters for Teapot (assuming it's similar to other objects)
                let cx = clippings[0];
                let cy = clippings[1];
                let cz = clippings[2];

                for (let i = 0; i < vertexPositions.length; i += 3) {
                    for (let idx = 0; idx < clippings.length; idx++) {
                        if (vertexPositions[i + idx % 3] < clippings[idx]) {
                            vertexPositions[i + idx % 3] = clippings[idx];

                            // Update back colors
                            vertexBackcolors[i + idx % 3 - 1] = 1;
                            vertexBackcolors[i + idx % 3] = 1;
                            vertexBackcolors[i + idx % 3 + 1] = 1;

                            // Update front colors
                            vertexFrontcolors[i + idx % 3 - 1] = 1;
                            vertexFrontcolors[i + idx % 3] = 1;
                            vertexFrontcolors[i + idx % 3 + 1] = 1;

                            // Update normals
                            vertexNormals[i + idx % 3] = 0;
                        }
                    }
                }

                /* End of clipping logic */

                jsonObj.vertexPositions = vertexPositions;
                jsonObj.vertexBackcolors = vertexBackcolors;
                jsonObj.vertexFrontcolors = vertexFrontcolors;
                jsonObj.vertexNormals = vertexNormals;

                handleLoadedTeapot(jsonObj);
            }
        };
        request.send();
    }
}

function loadCsie() {
    var request = new XMLHttpRequest();
    request.open("GET", "./model/Csie.json");
    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            handleLoadedCsie(JSON.parse(request.responseText));
        }
    }
    request.send();
}

function loadPlant() {
    var request = new XMLHttpRequest();
    request.open("GET", "./model/Plant.json");
    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            handleLoadedPlant(JSON.parse(request.responseText));
        }
    }
    request.send();
}

function toggleMovieMode() {
    // Toggle movie mode state based on the checkbox checked property
    if (movie_mode == 0) {
        movie_mode = 1;
        sx = [1.0, 1.0, 1.0]; //scale
        sy = [1.0, 1.0, 1.0];
        sz = [1.0, 1.0, 1.0];

        shearX = [0.0, 0.0, 0.0]; //shear
        shearY = [0.0, 0.0, 0.0];
        shearZ = [0.0, 0.0, 0.0];

        shearMode = 0; //0 for x-axis, 1 for y, 2 for z
    } else {
        movie_mode = 0;
        sx = [1.0, 1.0, 1.0]; //scale
        sy = [1.0, 1.0, 1.0];
        sz = [1.0, 1.0, 1.0];

        shearX = [0.0, 0.0, 0.0]; //shear
        shearY = [0.0, 0.0, 0.0];
        shearZ = [0.0, 0.0, 0.0];

        shearMode = 0; //0 for x-axis, 1 for y, 2 for z
        document.getElementById('transX').value = 0;
        document.getElementById('transY').value = 0;
        document.getElementById('transZ').value = -50;
    }
    //You can use movieModeEnabled flag in your logic to control movie mode
}




//*************************************************
// Rendering functions
//*************************************************
/*
    TODO HERE:
    add two or more objects showing on the canvas
    (it needs at least three objects showing at the same time)
*/
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(ka, ka, ka, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw Teapot
    drawModel("teapot", teapotVertexPositionBuffer, teapotVertexNormalBuffer, teapotVertexFrontColorBuffer);

    // Draw Csie
    drawModel("Csie", CsieVertexPositionBuffer, CsieVertexNormalBuffer, CsieVertexFrontColorBuffer);

    // Draw Plant
    drawModel("Plant", PlantVertexPositionBuffer, PlantVertexNormalBuffer, PlantVertexFrontColorBuffer);
}

function drawModel(name, positionBuffer, normalBuffer, colorBuffer) {
    if (positionBuffer == null || normalBuffer == null || colorBuffer == null) {
        return;
    }
    // Setup Projection Matrix
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    // Setup Model-View Matrix
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0, 0, 0]);
    mat4.translate(mvMatrix, update_trans(name));

    var rotateVec_init = [0, 0, 0];
    mat4.rotate(mvMatrix, degToRad(rotateVec_init[0]), [1, 0, 0]);
    mat4.rotate(mvMatrix, degToRad(rotateVec_init[1]), [0, 1, 0]);
    mat4.rotate(mvMatrix, degToRad(rotateVec_init[2]), [0, 0, 1]);

    var rotateVec = update_rotate(name);
    mat4.rotate(mvMatrix, degToRad(rotateVec[0]), [1, 0, 0]);
    mat4.rotate(mvMatrix, degToRad(rotateVec[1] + rotateAngle), [0, 1, 0]);
    mat4.rotate(mvMatrix, degToRad(rotateVec[2]), [0, 0, 1]);
    if (name == 'teapot') {
        mat4.scale(mvMatrix, [sx[0], sy[0], sz[0]]);
    } else if (name == 'Plant') {
        mat4.scale(mvMatrix, [sx[1], sy[1], sz[1]]);
    } else {
        mat4.scale(mvMatrix, [sx[2], sy[2], sz[2]]);
    }
    if (name == 'teapot') {
        mat4.multiply(mvMatrix, [
            1.0, shearY[0], shearZ[0], 0,
            shearX[0], 1.0, shearZ[0], 0,
            shearX[0], shearY[0], 1.0, 0,
            0, 0, 0, 1
        ]);
    } else if (name == 'Plant') {
        mat4.multiply(mvMatrix, [
            1.0, shearY[1], shearZ[1], 0,
            shearX[1], 1.0, shearZ[1], 0,
            shearX[1], shearY[1], 1.0, 0,
            0, 0, 0, 1
        ]);
    } else {
        mat4.multiply(mvMatrix, [
            1.0, shearY[2], shearZ[2], 0,
            shearX[2], 1.0, shearZ[2], 0,
            shearX[2], shearY[2], 1.0, 0,
            0, 0, 0, 1
        ]);
    }

    setMatrixUniforms();

    // Setup position data
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        positionBuffer.itemSize,
        gl.FLOAT,
        false,
        0,
        0);

    // Setup front color data
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexFrontColorAttribute,
        colorBuffer.itemSize,
        gl.FLOAT,
        false,
        0,
        0);

    // Setup normal data
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
        normalBuffer.itemSize,
        gl.FLOAT,
        false,
        0,
        0);

    gl.uniform1f(gl.getUniformLocation(shaderProgram, "Ka"), ka);
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, "lightLoc"), light_locations);
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, "lightLoc2"), light_locations2);
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, "lightLoc3"), light_locations3);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "shadingMethod"), shadingMethod);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "shadingMethod_vertex"), shadingMethod);
    gl.drawArrays(gl.TRIANGLES, 0, positionBuffer.numItems);
}


var animationDuration = 0; // Duration of each animation cycle in milliseconds
var transitionDuration = 1; // Duration of transition between states in milliseconds
var lastTransitionTime = Date.now(); // Last time a transition occurred
var targetValues = {}; // Target values for the transition
var isTransitioning = false; // Flag to indicate if a transition is ongoing

function generateRandomTargetValues() {
    targetValues.sx = Math.random() * 20; // Random scale factor between 0 and 2
    targetValues.sy = Math.random() * 20;
    targetValues.sz = Math.random() * 20;
    targetValues.shearX = (Math.random() - 0.5) * 2; // Random shear between -1 and 1
    targetValues.shearY = (Math.random() - 0.5) * 2;
    targetValues.shearZ = (Math.random() - 0.5) * 2;
    targetValues.rx = (Math.random()) * 2 * Math.PI; // Random rotation between -pi/2 and pi/2
    targetValues.ry = (Math.random()) * 2 * Math.PI;
    targetValues.rz = (Math.random()) * 2 * Math.PI;

    // Generate new random values for rx, ry, rz after each non-gradual transition
    if (!isTransitioning) {
        rx = targetValues.rx;
        ry = targetValues.ry;
        rz = targetValues.rz;
    }
}

function startTransition() {
    generateRandomTargetValues();
    document.getElementById('transX').value = Math.random() * 50 - 25;
    document.getElementById('transY').value = Math.random() * 50 - 25;
    document.getElementById('transZ').value = Math.random() * (-50) - 25;
    isTransitioning = true;
}

function animate() {
    var checked = document.getElementById('movieMode').checked;
    if (checked == 1) {
        var currentTime = Date.now();
        var elapsedTimeSinceTransition = currentTime - lastTransitionTime;

        // Update transformation values
        if (isTransitioning) {
            // If transitioning, apply target values directly
            sx.fill(targetValues.sx);
            sy.fill(targetValues.sy);
            sz.fill(targetValues.sz);
            shearX.fill(targetValues.shearX);
            shearY.fill(targetValues.shearY);
            shearZ.fill(targetValues.shearZ);
            rx = targetValues.rx;
            ry = targetValues.ry;
            rz = targetValues.rz;

            // End the transition after the transition duration
            animationDuration = 16400;
            var progress = (currentTime - lastTransitionTime) / animationDuration;

            // Update transformation values based on progress
            // Example: sx = initialSx + (targetSx - initialSx) * progress
            sx.fill((targetValues.sx - 1) * progress);
            sy.fill(1 + (targetValues.sy - 1) * progress);
            sz.fill(1 + (targetValues.sz - 1) * progress);
            shearX.fill(targetValues.shearX * progress);
            shearY.fill(targetValues.shearY * progress);
            shearZ.fill(targetValues.shearZ * progress);
            rx = targetValues.rx * progress;
            ry = targetValues.ry * progress;
            rz = targetValues.rz * progress;

            // Check if it's time to start a new transition
            if (progress >= 1) {
                startTransition();
                lastTransitionTime = currentTime; // Update last transition time
            }
        } else {
            // If not transitioning, smoothly animate
            var progress = (currentTime - lastTransitionTime) / animationDuration;

            // Update transformation values based on progress
            // Example: sx = initialSx + (targetSx - initialSx) * progress
            sx.fill(1 + (targetValues.sx - 1) * progress);
            sy.fill(1 + (targetValues.sy - 1) * progress);
            sz.fill(1 + (targetValues.sz - 1) * progress);
            shearX.fill(targetValues.shearX * progress);
            shearY.fill(targetValues.shearY * progress);
            shearZ.fill(targetValues.shearZ * progress);
            rx = targetValues.rx * progress;
            ry = targetValues.ry * progress;
            rz = targetValues.rz * progress;

            // Check if it's time to start a new transition
            if (progress >= 1) {
                startTransition();
                lastTransitionTime = currentTime; // Update last transition time
            }
        }

        // Call rendering function here with updated transformation values

        // Request the next frame
        requestAnimationFrame(animate);
    } else {
        var timeNow = new Date().getTime();
        if (lastTime != 0) {
            var elapsed = timeNow - lastTime;
            rotateAngle += rotationSpeed * elapsed;
        }

        lastTime = timeNow;
    }
}

function tick() {
    animate();
    requestAnimFrame(tick);
    drawScene();
    animate();
}

function webGLStart() {
    var canvas = document.getElementById("ICG-canvas");
    initGL(canvas);
    initShaders();
    loadCsie();
    loadTeapot();
    loadPlant();
    document.getElementById('movieMode').checked = false;

    gl.clearColor(ka, ka, ka, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();
}


//*************************************************
// Parsing parameters
//*************************************************
function update_ambient_light() {
    ka = document.getElementById("am_ka").value;
}

function updateShadingMethod() {
    shadingMethod = parseInt(document.getElementById("shadingMethod").value);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "shadingMethod"), shadingMethod);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "shadingMethod_vertex"), shadingMethod);
    updateShadingMethodLabel();
}

function update_light_location() {
    light_locations[0] = document.getElementById("llocX").value;
    light_locations[1] = document.getElementById("llocY").value;
    light_locations[2] = document.getElementById("llocZ").value;
}

function update_light_location2() {
    light_locations2[0] = document.getElementById("llocX2").value;
    light_locations2[1] = document.getElementById("llocY2").value;
    light_locations2[2] = document.getElementById("llocZ2").value;
}

function update_light_location3() {
    light_locations3[0] = document.getElementById("llocX3").value;
    light_locations3[1] = document.getElementById("llocY3").value;
    light_locations3[2] = document.getElementById("llocZ3").value;
}

function update_trans(name) {
    var tx, ty, tz;
    if (name == 'teapot') {
        tx = document.getElementById("transX").value;
        ty = document.getElementById("transY").value;
        tz = document.getElementById("transZ").value;
    } else if (name == 'Csie') {
        tx = document.getElementById("transX3").value;
        ty = document.getElementById("transY3").value;
        tz = document.getElementById("transZ3").value;
    } else {
        tx = document.getElementById("transX2").value;
        ty = document.getElementById("transY2").value;
        tz = document.getElementById("transZ2").value;
    }
    return vec3.create([tx, ty, tz]);
}

function update_rotate(name) {
    var rx, ry, rz;
    if (name == 'teapot') {
        rx = document.getElementById("rotateX").value;
        ry = document.getElementById("rotateY").value;
        rz = document.getElementById("rotateZ").value;
    } else if (name == 'Csie') {
        rx = document.getElementById("rotateX3").value;
        ry = document.getElementById("rotateY3").value;
        rz = document.getElementById("rotateZ3").value;
    } else {
        rx = document.getElementById("rotateX2").value;
        ry = document.getElementById("rotateY2").value;
        rz = document.getElementById("rotateZ2").value;
    }
    return vec3.create([rx, ry, rz]);
}

function update_scale(name) {
    var names = ['teapot', 'Plant', 'Csie'];
    var indices = [0, 1, 2];
    var index = names.indexOf(name);
    sx[indices[index]] = parseFloat(document.getElementById("scaleX_" + name).value);
    sy[indices[index]] = parseFloat(document.getElementById("scaleY_" + name).value);
    sz[indices[index]] = parseFloat(document.getElementById("scaleZ_" + name).value);
}

function update_shear(name) {
    shearMode = document.getElementById("shearMode").value;
    if (name == 'teapot') {
        if (shearMode != 0)
            shearX[0] = parseFloat(document.getElementById("shearX").value);
        if (shearMode != 1)
            shearY[0] = parseFloat(document.getElementById("shearY").value);
        if (shearMode != 2)
            shearZ[0] = parseFloat(document.getElementById("shearZ").value);
    } else if (name == 'Plant') {
        if (shearMode != 0)
            shearX[1] = parseFloat(document.getElementById("shearX1").value);
        if (shearMode != 1)
            shearY[1] = parseFloat(document.getElementById("shearY1").value);
        if (shearMode != 2)
            shearZ[1] = parseFloat(document.getElementById("shearZ1").value);
    } else {
        if (shearMode != 0)
            shearX[2] = parseFloat(document.getElementById("shearX2").value);
        if (shearMode != 1)
            shearY[2] = parseFloat(document.getElementById("shearY2").value);
        if (shearMode != 2)
            shearZ[2] = parseFloat(document.getElementById("shearZ2").value);
    }
}

function updateShadingMethodLabel() {
    var shadingMethodLabel = document.getElementById("shadingMethodLabel");
    var shadingMethod = parseInt(document.getElementById("shadingMethod").value);

    if (shadingMethod === 1) {
        shadingMethodLabel.textContent = "Flat Shading";
    } else if (shadingMethod === 2) {
        shadingMethodLabel.textContent = "Gouraud Shading";
    } else {
        shadingMethodLabel.textContent = "Phong Shading";
    }
}


//*************************************************
// FUnction update_clipping() 
// in dev ....
//*************************************************

function updateRotationSpeed() {
    var rotationSpeedFactorInput = document.getElementById("rotationSpeedFactor");
    var rotationSpeedFactor = parseFloat(rotationSpeedFactorInput.value);
    // Update rotation speed factor
    rotationSpeed = rotationSpeedFactor;
}