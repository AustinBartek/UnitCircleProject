import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const rotations = [0, Math.PI / 6, Math.PI / 4, Math.PI / 3, Math.PI / 2, Math.PI * 2 / 3, Math.PI * 3 / 4, Math.PI * 5 / 6, Math.PI, Math.PI * 7 / 6, Math.PI * 5 / 4, Math.PI * 4 / 3, Math.PI * 3 / 2, Math.PI * 5 / 3, Math.PI * 7 / 4, Math.PI * 11 / 6];
const testRots = [...rotations, Math.PI * 2];
const colors = new Array(16);
const degreeMeasures = ["0°/360°", "30°", "45°", "60°", "90°", "120°", "135°", "150°", "180°", "210°", "225°", "240°", "270°", "300°", "315°", "330°"];
const radianMeasures = ["0π/2π", "π/6", "π/4", "π/3", "π/2", "2π/3", "3π/4", "5π/6", "π", "7π/6", "5π/4", "4π/3", "3π/2", "5π/3", "7π/4", "11π/6"];
const sinMeasures = ["0", "1/2", "√2/2", "√3/2", "1", "√3/2", "√2/2", "1/2", "0", "-1/2", "-√2/2", "-√3/2", "-1", "-√3/2", "-√2/2", "-1/2"];
const cosMeasures = ["1", "√3/2", "√2/2", "1/2", "0", "-1/2", "-√2/2", "-√3/2", "-1", "-√3/2", "-√2/2", "-1/2", "0", "1/2", "√2/2", "√3/2"];
const tanMeasures = ["0", "√3/3", "1", "√3", "N/A", "-√3", "-1", "-√3/3", "0", "√3/3", "1", "√3", "N/A", "-√3", "-1", "-√3/3"];
const measureNames = ["DEGREES", "RADIANS", "(COS, SIN)", "TAN"];

async function main() {
    const canvas = document.getElementById("canvas");
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    for (let i = 0; i < colors.length; i++) {
        colors[i] = new Array(3);
        colors[i][0] = i / colors.length;
        colors[i][1] = 1;
        colors[i][2] = 0.5;
    }

    let mouseX, mouseY;
    let rotIndex = 0, rotVal = 0;
    let ringNum = 0, ringDir = 0;
    let coordsRotation = 0, coordsRotDir = 0;

    canvas.addEventListener("mousemove", (evt) => {
        mouseX = evt.clientX;
        mouseY = evt.clientY;
        rotVal = getMouseAngle();
        let minDiff = Math.abs(testRots[0] - rotVal), index = 0;
        for (let i = 1; i < testRots.length; i++) {
            let newDiff = Math.abs(testRots[i] - rotVal);
            if (newDiff < minDiff) {
                minDiff = newDiff;
                index = i % rotations.length;
            }
        }
        rotIndex = index;
    })

    function getMouseAngle() {
        let diffVec = new THREE.Vector2(width / 2, height / 2);
        diffVec.sub(new THREE.Vector2(mouseX, mouseY));
        let rads = Math.atan(diffVec.y / -diffVec.x);
        if (Math.sign(-diffVec.x) != 1) {
            rads += Math.PI;
        }
        if (Math.sign(rads) == -1) {
            rads += Math.PI * 2;
        }
        return rads;
    }

    function ringOut() {
        if (ringNum < 2) {
            ringDir = 0.01;
        }
    }
    function ringIn() {
        if (ringNum > 0.01) {
            ringDir = -0.01;
        }
    }
    function toggleCoordRotation() {
        if (coordsRotation < 0.02) {
            coordsRotDir = 0.02;
        } else if (coordsRotation >= 0.98) {
            coordsRotDir = -0.02;
        }
    }
    window.ringOut = ringOut;
    window.ringIn = ringIn;
    window.toggleCoordRotation = toggleCoordRotation;

    document.addEventListener("keypress", (evt) => {
        switch (evt.key) {
            case "s":
                ringOut();
                break;
            case "w":
                ringIn();
                break;
            case "a":
                toggleCoordRotation();
                break;
        }
    })

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const fov = 75;
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000);
    camera.position.z = 100;

    //SETTING UP SCENE HERE
    const loader = new FontLoader();
    const font = await new Promise((resolve, reject) => {
        loader.load("helvetiker_regular.typeface.json", function (loaded) {
            resolve(loaded);
        }, undefined, reject);
    });

    const texLoader = new THREE.TextureLoader();
    const spaceTex = texLoader.load("Spacey.jpeg");

    //shader for middle text
    const spaceVertShader = `
        varying vec4 clipSpacePos;

        void main() {
            gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0);
            clipSpacePos = gl_Position;
        }
    `;
    const spaceFragShader = `
        uniform sampler2D image;
        uniform float time;
        varying vec4 clipSpacePos;

        void main() {
            vec2 ndc = clipSpacePos.xy/clipSpacePos.w * 0.5 + 0.5;
            ndc *= 5.0;
            ndc += vec2(time/10.0, time/20.0);
            ndc = fract(ndc);

            vec3 col = texture2D(image, ndc).xyz;
            col = (col + vec3(1.0, 0.753, 0.796)*1.0)/2.0;
            gl_FragColor = vec4(col, 1.0);
        }
    `;
    const spaceMaterial = new THREE.ShaderMaterial({
        uniforms: {
            image: { value: spaceTex },
            time: { value: 0 }
        },
        vertexShader: spaceVertShader,
        fragmentShader: spaceFragShader
    });

    //adding the final background that runs a shader
    const vertShader = `
        void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
    const fragShader = `
        uniform float time;
        uniform vec2 resolution;
        uniform vec2 mouseUv;
        uniform vec3 waveColor;

        void main() {
            float aspectRatio = resolution.x/resolution.y;
            vec2 uv = gl_FragCoord.xy/resolution * 2.0 - 1.0;
            uv.y /= aspectRatio;
            vec2 mUv = mouseUv * 2.0 - 1.0;
            mUv.y /= aspectRatio;

            float[] dists = float[] (length(uv - vec2(1.0))*50.0, length(uv - vec2(1.0, -1.0))*50.0, length(uv - vec2(-1.0))*50.0, length(uv - vec2(-1.0, 1.0))*50.0, length(uv - mUv)*80.0);
            float dist = dists[0];
            for (int i = 1; i < 5; i++) {
                dist = min(dist, dists[i]);
            }
            float multFactor = (sin(dist - time*2.0) + 1.0)/2.0;
            multFactor *= 0.3;
            vec3 col = waveColor * multFactor;

            gl_FragColor = vec4(col, 1.0);
        }
    `;
    const uniforms = {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(width, height).multiplyScalar(window.devicePixelRatio) },
        mouseUv: { value: new THREE.Vector2(0, 0) },
        waveColor: { value: new THREE.Vector3(0, 0, 0) }
    };
    const planeHeight = Math.tan(fov * Math.PI / 180) * 2 * 200;
    const planeGeom = new THREE.PlaneGeometry(planeHeight * camera.aspect, planeHeight);
    const planeMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertShader,
        fragmentShader: fragShader
    });
    const plane = new THREE.Mesh(planeGeom, planeMat);
    plane.position.z = -200;
    scene.add(plane);

    function makeText(text, color) {
        const geometry = new TextGeometry(text, {
            font: font,
            size: 5,
            depth: 2,
            curveSegments: 20,
            bevelEnabled: false,
            bevelThickness: 2,
            bevelSize: 5,
            bevelOffset: 0,
            bevelSegments: 5
        });
        const colObj = new THREE.Color().setHSL(...color);
        const material = new THREE.MeshPhysicalMaterial({ color: colObj });
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }
    function centerOnPoint(mesh, x, y, z) {
        mesh.position.set(x, y, z);
        mesh.updateMatrixWorld();
        const box = new THREE.Box3().setFromObject(mesh);
        const centerOffset = box.max.sub(box.min).divideScalar(-2);
        mesh.position.add(centerOffset);
    }

    const minRadius = 40;
    const orbitScale = 22;
    const scaleMax = 2, scaleMin = 0.5;
    const zAxis = new THREE.Vector3(0, 0, 1);
    const degreeMeshes = new Array(degreeMeasures.length), radianMeshes = new Array(radianMeasures.length), coordinateMeshes = new Array(sinMeasures.length), tanMeshes = new Array(tanMeasures.length);
    const groups = [degreeMeshes, radianMeshes, coordinateMeshes];

    //setting up the text names for each orbit
    const nameMeshes = new Array(4);
    for (let i = 0; i < nameMeshes.length; i++) {
        const nm = makeText(measureNames[i], [1.0, 1.0, 1.0]);
        nm.material = spaceMaterial;
        nm.visible = false;
        nm.scale.set(1.3, 1.3, 1.3);
        nameMeshes[i] = nm;
        scene.add(nm);
    }

    //adding angle lines
    const lines = new Array(radianMeasures.length);
    for (let i = 0; i < radianMeasures.length; i++) {
        const rot = rotations[i];
        const position = new THREE.Vector3(200, 0, 0).applyAxisAngle(zAxis, rot);
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 400, 4);
        const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const mesh = new THREE.Mesh(geometry, material);
        lines[i] = mesh;
        mesh.position.set(...position);
        mesh.position.z = -10;
        mesh.rotation.z = rot + Math.PI / 2;
        scene.add(mesh);
    }

    //generating the text meshes for use
    for (let i = 0; i < degreeMeasures.length; i++) {
        const color = colors[i];
        const dm = makeText(degreeMeasures[i], color);
        const rm = makeText(radianMeasures[i], color);
        const cm = makeText(`(${cosMeasures[i]}, ${sinMeasures[i]})`, color);
        const tm = makeText(tanMeasures[i], color);
        degreeMeshes[i] = dm;
        radianMeshes[i] = rm;
        coordinateMeshes[i] = cm;
        tanMeshes[i] = tm;
        scene.add(dm);
        scene.add(rm);
        scene.add(cm);
        scene.add(tm);
    }

    function getRotationDistance(angle) {
        let dist = Math.abs(rotVal - angle);
        dist = Math.min(dist, Math.PI * 2 - dist) / Math.PI;
        dist = 1 - dist;
        return dist;
    }
    function getScaleFactor(angle) {
        let scaleFactor = getRotationDistance(angle);
        scaleFactor **= 4;
        scaleFactor = (scaleFactor * (scaleMax - scaleMin)) + scaleMin;
        return scaleFactor;
    }
    function getEmissiveColor(mesh, angle) {
        let brightness = getRotationDistance(angle);
        brightness **= 3;
        const newCol = mesh.material.color.clone().multiplyScalar(brightness);
        return newCol;
    }
    function positionText(time = 0) {
        for (let i = 0; i < degreeMeasures.length; i++) {
            const angle = rotations[i];
            const sideRotation = Math.sin(time) / 4;
            const coordSwitchRotation = coordsRotation * Math.PI * 2;
            const newCol = getEmissiveColor(groups[0][i], angle);

            for (let orbit = 0; orbit < groups.length; orbit++) {
                const position = new THREE.Vector3(minRadius * (orbitScale ** (orbit - ringNum)), 0, 0).applyAxisAngle(zAxis, angle);
                const scaleFactor = getScaleFactor(angle) / (orbitScale ** (ringNum - orbit));

                //Positioning the measure meshes
                let mesh = groups[orbit][i];
                //Checking to see if it should use tan rather than (cos, sin) meshes
                if (orbit == 2) {
                    if (coordsRotation >= 0.5) {
                        mesh = tanMeshes[i];
                    }
                }

                mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
                mesh.material.emissive = newCol;
                mesh.rotation.y = 0;
                centerOnPoint(mesh, ...position);
                mesh.rotation.y = sideRotation + coordSwitchRotation;

                //Positioning the name meshes (only on first iter)
                if (i == 0) {
                    let name = nameMeshes[orbit];
                    if (orbit == 2) {
                        if (coordsRotation >= 0.5) {
                            name = nameMeshes[3];
                        }
                    }
                    name.visible = true;
                    const zPos = ((ringNum - orbit) * 5) ** 5;
                    centerOnPoint(name, 0, 0, zPos);
                }
            }
        }
    }
    //function that makes the smooth transitions between orbits of numbers
    function updateRingsAndCoordRots() {
        ringNum += ringDir;
        if (ringNum % 1 < 0.01) {
            ringDir = 0;
        }
        coordsRotation += coordsRotDir;
        if (coordsRotation % 1 < 0.02) {
            coordsRotDir = 0;
        }
        for (const mesh of coordinateMeshes) {
            mesh.visible = false;
        }
        for (const mesh of tanMeshes) {
            mesh.visible = false;
        }
        const useGroup = (coordsRotation >= 0.5) ? tanMeshes : coordinateMeshes;
        for (const mesh of useGroup) {
            mesh.visible = true;
        }
        for (const mesh of nameMeshes) {
            mesh.visible = false;
        }
    }

    //adding a light so that the text is still barely visible
    const light = new THREE.PointLight(0x111111, 3, 0, 0);
    light.position.z = 80;
    scene.add(light);

    //adding the wireframe triangles in the background
    const icoGeom = new THREE.IcosahedronGeometry(200, 5);
    const icoMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide, wireframe: true });
    const ico = new THREE.Mesh(icoGeom, icoMat);
    scene.add(ico);

    positionText();

    //DONE SETTING UP HERE

    function animate(time) {
        const rotColor = new THREE.Color().setHSL(...colors[rotIndex]);

        time *= 0.001;

        uniforms.time.value = time;
        uniforms.waveColor.value.set(...rotColor);
        uniforms.mouseUv.value.set(mouseX / width, (height - mouseY) / height);
        spaceMaterial.uniforms.time.value = time;

        updateRingsAndCoordRots();
        positionText(time);

        ico.rotation.x += 0.001;
        ico.rotation.y += 0.001;
        ico.material.color = rotColor;

        for (const line of lines) {
            line.material.color = new THREE.Color(0, 0, 0);
        }
        lines[rotIndex].material.color = rotColor;
        renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(animate);
}

main();