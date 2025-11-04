import * as THREE from 'three';

let scene, camera, renderer;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotation = { x: 0, y: 0 };
let originalVertices = [];
let currentVertices = [];
let currentFigure = '';

// URLs de las imágenes de referencia
const referenceImages = {
  'cube': '/src/img/CUBO.png',
  'pyramid_square': '/src/img/PiramideCuadrangular.png',
  'pyramid_triangle': '/src/img/PiramideTriangular.png',
  'rhombus': '/src/img/Rombo.png'
};

const vertexColors = [
  "#ff0000", // rojo
  "#00ff00", // verde
  "#0000ff", // azul
  "#ffff00", // amarillo
  "#ff00ff", // magenta
  "#00ffff", // cyan
  "#ff8000", // naranja
  "#ffffff"  // blanco
];


// ====== Funcion para agregar etiquetas a los ejes ======
function addAxisLabels() {
  // Etiqueta para eje X (rojo)
  const labelX = makeTextSprite('X', { 
    fontsize: 50, 
    borderColor: 0xff0000 
  });
  labelX.position.set(5.5, 0, 0);
  scene.add(labelX);

  // Etiqueta para eje Y (verde)
  const labelY = makeTextSprite('Y', { 
    fontsize: 50, 
    borderColor: 0x00ff00 
  });
  labelY.position.set(0, 5.5, 0);
  scene.add(labelY);

  // Etiqueta para eje Z (azul)
  const labelZ = makeTextSprite('Z', { 
    fontsize: 50, 
    borderColor: 0x0000ff 
  });
  labelZ.position.set(0, 0, 5.5);
  scene.add(labelZ);
}

// ======= Inicializar Escena =======
function initScene() {
  const container = document.getElementById('scene-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  camera = new THREE.PerspectiveCamera(
    45, 
    container.clientWidth / container.clientHeight, 
    0.1, 
    1000
  );
  camera.position.set(10, 10, 10);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Agregar ejes de coordenadas
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  // Agregar etiquetas a los ejes
  addAxisLabels();

  // Agregar grid
  const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x222222);
  scene.add(gridHelper);

  // Luces
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(10, 10, 10);
  scene.add(pointLight);

  // Controles manuales con mouse
  const canvas = renderer.domElement;
  
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      
      rotation.y += deltaX * 0.01;
      rotation.x += deltaY * 0.01;
      
      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
  });

  canvas.addEventListener('mouseleave', () => {
    isDragging = false;
  });

  // Zoom con rueda del mouse
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    camera.position.multiplyScalar(1 + (e.deltaY > 0 ? zoomSpeed : -zoomSpeed));
  });

  // Responsive
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  
  // Aplicar rotación a la cámara
  const radius = Math.sqrt(
    camera.position.x ** 2 + 
    camera.position.y ** 2 + 
    camera.position.z ** 2
  );
  
  camera.position.x = radius * Math.sin(rotation.y) * Math.cos(rotation.x);
  camera.position.y = radius * Math.sin(rotation.x);
  camera.position.z = radius * Math.cos(rotation.y) * Math.cos(rotation.x);
  camera.lookAt(0, 0, 0);
  
  renderer.render(scene, camera);
}

// ======= Limpiar escena (mantener helpers y luces) =======
function clearScene() {
  const objectsToRemove = [];
  scene.children.forEach(child => {
    if (child.type === 'Line' || child.type === 'Mesh') {
      objectsToRemove.push(child);
    }
  });
  objectsToRemove.forEach(obj => scene.remove(obj));
}

// ======= Formulario inicial ==========
const figureSelect = document.getElementById('figure');
const inputDiv = document.getElementById('inputs');

// Función auxiliar para generar inputs de vértices
function generateVertexInputs(startIndex, count, labelPrefix) {
  let html = '';
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const color = vertexColors[idx % vertexColors.length];
    const vertexNum = idx + 1;
    
    html += `
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:6px;">
        <div style="width:16px; height:16px; background:${color}; border:1px solid #000;"></div>
        <label style="width:100px;">${labelPrefix} ${vertexNum}</label>
        <input type="number" step="any" placeholder="x${idx}" name="x${idx}" required style="width:65px">
        <input type="number" step="any" placeholder="y${idx}" name="y${idx}" required style="width:65px">
        <input type="number" step="any" placeholder="z${idx}" name="z${idx}" required style="width:65px">
      </div>
    `;
  }
  return html;
}

figureSelect.onchange = function () {
  inputDiv.innerHTML = '';
  const figure = this.value;

  // Mostrar imagen de referencia
  const imageContainer = document.getElementById('reference-image-container');
  const referenceImage = document.getElementById('reference-image');
  
  if (figure && referenceImages[figure]) {
    referenceImage.src = referenceImages[figure];
    imageContainer.style.display = 'block';
  } else {
    imageContainer.style.display = 'none';
  }

  if (figure === 'cube') {
    // Base inferior (4 vértices) + Tapa superior (4 vértices)
    inputDiv.innerHTML = `
      <div style="margin-bottom:15px;">
        <h3 style="margin:10px 0 8px 0; color:#00ff88;">Base Inferior</h3>
        ${generateVertexInputs(0, 4, 'Vértice')}
      </div>
      <div>
        <h3 style="margin:10px 0 8px 0; color:#00ff88;">Tapa Superior</h3>
        ${generateVertexInputs(4, 4, 'Vértice')}
      </div>
    `;
  } else if (figure === 'pyramid_triangle') {
    // Base triangular (3 vértices) + Pico (1 vértice)
    inputDiv.innerHTML = `
      <div style="margin-bottom:15px;">
        <h3 style="margin:10px 0 8px 0; color:#00ff88;">Base Triangular</h3>
        ${generateVertexInputs(0, 3, 'Vértice')}
      </div>
      <div>
        <h3 style="margin:10px 0 8px 0; color:#00ff88;">Pico</h3>
        ${generateVertexInputs(3, 1, 'Pico')}
      </div>
    `;
  } else if (figure === 'pyramid_square') {
    // Base cuadrada (4 vértices) + Pico (1 vértice)
    inputDiv.innerHTML = `
      <div style="margin-bottom:15px;">
        <h3 style="margin:10px 0 8px 0; color:#00ff88;">Base Cuadrada</h3>
        ${generateVertexInputs(0, 4, 'Vértice')}
      </div>
      <div>
        <h3 style="margin:10px 0 8px 0; color:#00ff88;">Pico</h3>
        ${generateVertexInputs(4, 1, 'Pico')}
      </div>
    `;
  } else if (figure === 'rhombus') {
    // Base cuadrada (4 vértices) + Pico superior (1) + Pico inferior (1)
    inputDiv.innerHTML = `
      <div style="margin-bottom:15px;">
        <h3 style="margin:10px 0 8px 0; color:#00ff88;">Base Cuadrada</h3>
        ${generateVertexInputs(0, 4, 'Vértice')}
      </div>
      <div style="margin-bottom:15px;">
        <h3 style="margin:10px 0 8px 0; color:#00ff88;">Pico Superior</h3>
        ${generateVertexInputs(4, 1, 'Pico Superior')}
      </div>
      <div>
        <h3 style="margin:10px 0 8px 0; color:#00ff88;">Pico Inferior</h3>
        ${generateVertexInputs(5, 1, 'Pico Inferior')}
      </div>
    `;
  }
};

document.getElementById('coords-form').onsubmit = function (e) {
  e.preventDefault();
  const vertices = [];
  const figure = figureSelect.value;

  if (!figure) return;

  const inputs = this.elements;
  let numVertices;
  switch (figure) {
    case 'cube': numVertices = 8; break;
    case 'pyramid_triangle': numVertices = 4; break;
    case 'pyramid_square': numVertices = 5; break;
    case 'rhombus': numVertices = 6; break; // 4 base + 1 superior + 1 inferior
    default: return;
  }

  for (let i = 0; i < numVertices; i++) {
    const x = parseFloat(inputs[`x${i}`].value);
    const y = parseFloat(inputs[`y${i}`].value);
    const z = parseFloat(inputs[`z${i}`].value);
    
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      alert('Por favor ingresa valores numéricos válidos');
      return;
    }
    
    vertices.push(new THREE.Vector3(x, y, z));
  }

  originalVertices = vertices.map(v => v.clone());
  currentVertices = vertices.map(v => v.clone());
  currentFigure = figure;

  clearScene();
  graphFigure(figure, currentVertices);

  // Mostrar sección de transformaciones
  document.getElementById('transform-section').style.display = 'block';
};

// ======= Formulario de transformaciones ==========
const operationSelect = document.getElementById('operation');
const transformInputsDiv = document.getElementById('transform-inputs');
const applyTransformBtn = document.getElementById('apply-transform');

operationSelect.onchange = function () {
  transformInputsDiv.innerHTML = '';
  const operation = this.value;
  applyTransformBtn.disabled = !operation;

  if (operation === 'translation') {
    transformInputsDiv.innerHTML = `
      <label>Coordenadas de traslación:</label>
      <div class="input-group">
        <input type="number" step="any" id="tx" placeholder="Tx" required>
        <input type="number" step="any" id="ty" placeholder="Ty" required>
        <input type="number" step="any" id="tz" placeholder="Tz" required>
      </div>
    `;
  } else if (operation === 'scaling') {
    transformInputsDiv.innerHTML = `
      <label>Factores de escala:</label>
      <div class="input-group">
        <input type="number" step="any" id="sx" placeholder="Sx" required>
        <input type="number" step="any" id="sy" placeholder="Sy" required>
        <input type="number" step="any" id="sz" placeholder="Sz" required>
      </div>
    `;
  } else if (operation === 'rotation') {
    transformInputsDiv.innerHTML = `
      <label>Ángulo de rotación (grados):</label>
      <input type="number" step="any" id="angle" placeholder="Ángulo" required>
      
      <label>Eje de rotación:</label>
      <select id="axis" required>
        <option value="">--Seleccione--</option>
        <option value="x">Eje X</option>
        <option value="y">Eje Y</option>
        <option value="z">Eje Z</option>
      </select>
    `;
  }
};

applyTransformBtn.onclick = function () {
  const operation = operationSelect.value;
  
  if (operation === 'translation') {
    const tx = parseFloat(document.getElementById('tx').value);
    const ty = parseFloat(document.getElementById('ty').value);
    const tz = parseFloat(document.getElementById('tz').value);
    
    if (isNaN(tx) || isNaN(ty) || isNaN(tz)) {
      alert('Por favor ingresa valores válidos');
      return;
    }
    
    applyTranslation(tx, ty, tz);
  } else if (operation === 'scaling') {
    const sx = parseFloat(document.getElementById('sx').value);
    const sy = parseFloat(document.getElementById('sy').value);
    const sz = parseFloat(document.getElementById('sz').value);
    
    if (isNaN(sx) || isNaN(sy) || isNaN(sz)) {
      alert('Por favor ingresa valores válidos');
      return;
    }
    
    applyScaling(sx, sy, sz);
  } else if (operation === 'rotation') {
    const angle = parseFloat(document.getElementById('angle').value);
    const axis = document.getElementById('axis').value;
    
    if (isNaN(angle) || !axis) {
      alert('Por favor ingresa valores válidos');
      return;
    }
    
    applyRotation(angle, axis);
  }
};

document.getElementById('reset-figure').onclick = function () {
  currentVertices = originalVertices.map(v => v.clone());
  clearScene();
  graphFigure(currentFigure, currentVertices);
};

// ======= Transformaciones =======
function applyTranslation(tx, ty, tz) {
  currentVertices = currentVertices.map(v => {
    return new THREE.Vector3(v.x + tx, v.y + ty, v.z + tz);
  });
  
  clearScene();
  graphFigure(currentFigure, currentVertices);
}

function applyScaling(sx, sy, sz) {
  currentVertices = currentVertices.map(v => {
    return new THREE.Vector3(v.x * sx, v.y * sy, v.z * sz);
  });
  
  clearScene();
  graphFigure(currentFigure, currentVertices);
}

function applyRotation(angleDegrees, axis) {
  const angleRadians = angleDegrees * (Math.PI / 180);
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  
  currentVertices = currentVertices.map(v => {
    let x = v.x, y = v.y, z = v.z;
    
    if (axis === 'x') {
      return new THREE.Vector3(
        x,
        y * cos - z * sin,
        y * sin + z * cos
      );
    } else if (axis === 'y') {
      return new THREE.Vector3(
        x * cos + z * sin,
        y,
        -x * sin + z * cos
      );
    } else if (axis === 'z') {
      return new THREE.Vector3(
        x * cos - y * sin,
        x * sin + y * cos,
        z
      );
    }
    return v;
  });
  
  clearScene();
  graphFigure(currentFigure, currentVertices);
}

// ======= Graficar figuras =======
function graphFigure(figure, vertices) {
  let edges = [];
  
  if (figure === 'cube') {
    edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];
  } else if (figure === 'pyramid_triangle') {
    edges = [
      [0, 1], [1, 2], [2, 0],
      [0, 3], [1, 3], [2, 3]
    ];
  } else if (figure === 'pyramid_square') {
    edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [0, 4], [1, 4], [2, 4], [3, 4]
    ];
  } else if (figure === 'rhombus') {
    edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // base cuadrada
      [0, 4], [1, 4], [2, 4], [3, 4], // conexiones al pico superior
      [0, 5], [1, 5], [2, 5], [3, 5]  // conexiones al pico inferior
    ];
  }
  
  graphEdges(vertices, edges);
  graphVertices(vertices);
}

function graphEdges(vertices, indices) {
  indices.forEach(edge => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      vertices[edge[0]], vertices[edge[1]]
    ]);
    const material = new THREE.LineBasicMaterial({ 
      color: 0x00ff88,
      linewidth: 2
    });
    const line = new THREE.Line(geometry, material);
    scene.add(line);
  });
}

let labels = []; // almacenar textos para poder limpiarlos

function graphVertices(vertices) {
  // Colores para cada vértice
  const colors = [
    0xff0000, 0x00ff00, 0x0000ff, 0xffff00,
    0xff00ff, 0x00ffff, 0xff8000, 0xffffff
  ];

  // Eliminar etiquetas anteriores
  labels.forEach(l => scene.remove(l));
  labels = [];

  vertices.forEach((vertex, index) => {
    // ===== Esfera =====
    const geometry = new THREE.SphereGeometry(0.15, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: colors[index % colors.length]
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(vertex);
    scene.add(sphere);

    // ===== Etiqueta =====
    const label = makeTextSprite(
      `V${index + 1} (${vertex.x.toFixed(2)}, ${vertex.y.toFixed(2)}, ${vertex.z.toFixed(2)})`,
      { fontsize: 15, borderColor: colors[index % colors.length] }
    );
    label.position.copy(vertex);
    label.position.y += 0.25; // subir un poco el texto
    scene.add(label);
    labels.push(label);
  });
}

// ====== Función para crear texto ======
function makeTextSprite(message, parameters = {}) {
  const fontface = parameters.fontface || "Arial";
  const fontsize = parameters.fontsize || 40;
  const borderThickness = 4;
  const borderColor = parameters.borderColor || "#ffffff";
  const backgroundColor = "rgba(0,0,0,0.6)";

  // crear canvas y contexto
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = `${fontsize}px ${fontface}`;

  // medir texto y ajustar canvas automáticamente
  const textWidth = ctx.measureText(message).width;
  canvas.width = textWidth + 40;   // margen lateral extra
  canvas.height = fontsize + 30;   // margen vertical

  // volver a setear el contexto después de cambiar tamaño
  ctx.font = `${fontsize}px ${fontface}`;
  ctx.fillStyle = backgroundColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = borderThickness;

  // pintar fondo
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // texto
  ctx.fillStyle = "white";
  ctx.fillText(message, 20, fontsize + 5);

  // crear textura y sprite
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthWrite: false });
  const sprite = new THREE.Sprite(spriteMaterial);
  
  // escala del sprite para que no salga enorme
  sprite.scale.set(2, 1, 1);

  return sprite;
}

// ======= Iniciar app =======
initScene();