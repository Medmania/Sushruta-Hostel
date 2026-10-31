import React, { useEffect, useRef } from 'react';
import { Search, Home } from 'lucide-react';

// --- THREE.JS 3D HOSTEL MAP COMPONENT ---
export default function Hostel3DMap({ approvedStudents }) {
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !window.THREE) return;

    const THREE = window.THREE;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f19);
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.011);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 48, 72);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(35, 55, 25);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 110),
      new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    scene.add(new THREE.GridHelper(140, 70, 0x333344, 0x222233));

    const interactiveMeshes = [];
    const roomSize = { w: 1.55, h: 1.25, d: 1.55 };

    function createRoomLabel(text) {
      const canvas = document.createElement('canvas');
      canvas.width = 128; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(15,23,42,0.85)';
      ctx.roundRect(4, 8, 120, 48, 10);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 34);

      const texture = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
      sprite.scale.set(1.8, 0.9, 1);
      return sprite;
    }

    function createBlockLabel(text, bg) {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = bg || 'rgba(30,58,138,0.9)';
      ctx.roundRect(20, 20, 472, 88, 16);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 42px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 256, 68);

      const texture = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
      sprite.scale.set(7, 1.8, 1);
      return sprite;
    }

    function addRoom(x, y, z, roomNo, block, color) {
      const geo = new THREE.BoxGeometry(roomSize.w, roomSize.h, roomSize.d);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.08 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { roomNo: String(roomNo), block };

      const label = createRoomLabel(String(roomNo));
      label.position.set(0, roomSize.h / 2 + 0.55, 0);
      mesh.add(label);

      scene.add(mesh);
      interactiveMeshes.push(mesh);
      return mesh;
    }

    const blueTiers = [0x3b82f6, 0x2563eb, 0x1d4ed8, 0x1e40af];
    const orangeTiers = [0xf97316, 0xea580c, 0xc2410c, 0x9a3412];
    const yellowTiers = [0xeab308, 0xca8a04, 0xa16207, 0x854d0e];

    // --- MATHURA BLOCK ---
    for (let i = 0; i < 18; i++) {
      const base = 18 + i;
      [base, base + 87, base + 174].forEach((num, floor) => {
        const z = 14 - i * (roomSize.d + 0.12);
        const y = floor * (roomSize.h + 0.12) + roomSize.h / 2;
        addRoom(-32, y, z, num, "Mathura (North)", blueTiers[floor % 4]);
      });
    }
    const northLabel = createBlockLabel("MATHURA (NORTH)", "rgba(30,58,138,0.92)");
    northLabel.position.set(-32, 7.8, 4);
    northLabel.scale.set(6.5, 1.7, 1);
    scene.add(northLabel);

    for (let i = 0; i < 17; i++) {
      const base = 36 + i;
      [base, base + 87, base + 174].forEach((num, floor) => {
        const z = -17.5 - i * (roomSize.d + 0.12);
        const y = floor * (roomSize.h + 0.12) + roomSize.h / 2;
        addRoom(-32, y, z, num, "Mathura (South)", blueTiers[floor % 4]);
      });
    }
    const southLabel = createBlockLabel("MATHURA (SOUTH)", "rgba(30,58,138,0.92)");
    southLabel.position.set(-32, 7.8, -27);
    southLabel.scale.set(6.5, 1.7, 1);
    scene.add(southLabel);

    // --- TENNIS BLOCK ---
    const tLeft = [[53,140,227,279], [54,141,228,280], [55,142,229,281], [56,143,230,282], [57,144,231,283], [58,145,232,284], [59,146,233,285], [60,147,234,286]];
    tLeft.forEach((col, idx) => {
      col.forEach((num, floor) => {
        const x = -20 + idx * (roomSize.w + 0.12);
        const y = floor * (roomSize.h + 0.12) + roomSize.h / 2;
        addRoom(x, y, -26, num, "Tennis Block", orangeTiers[floor % 4]);
      });
    });

    const tRight = [[61,148,235,287], [62,149,236,288], [63,150,237,289], [64,151,238,290], [65,152,239,291], [66,153,240,292], [67,154,241,293], [68,155,242,294], [69,156,243,295]];
    tRight.forEach((col, idx) => {
      col.forEach((num, floor) => {
        const x = -20 + (8 * (roomSize.w + 0.12)) + 1.8 + idx * (roomSize.w + 0.12);
        const y = floor * (roomSize.h + 0.12) + roomSize.h / 2;
        addRoom(x, y, -26, num, "Tennis Block", orangeTiers[floor % 4]);
      });
    });

    const tLabel = createBlockLabel("TENNIS BLOCK", "rgba(194,65,12,0.92)");
    tLabel.position.set(-10, 8.2, -26);
    scene.add(tLabel);

    // --- PG BLOCK ---
    const pgLeft = [
      [70,157,244,296], [71,158,245,297], [72,159,246,298], [73,160,247,299],
      [74,161,248,300], [75,162,249,301], [76,163,250,302], [77,164,251,303], [78,165,252,304]
    ];
    pgLeft.forEach((col, idx) => {
      col.forEach((num, floor) => {
        const x = 14 + idx * (roomSize.w + 0.12);
        const y = floor * (roomSize.h + 0.12) + roomSize.h / 2;
        addRoom(x, y, -26, num, "PG Block", orangeTiers[floor % 4]);
      });
    });

    const pgRight = [
      [79,166,253,305], [80,167,254,306], [81,168,255,307], [82,169,256,308],
      [83,170,257,309], [84,171,258,310], [85,172,259,311], [86,173,260,312], [87,174,261,313]
    ];
    pgRight.forEach((col, idx) => {
      col.forEach((num, floor) => {
        const x = 30 + idx * (roomSize.w + 0.12);
        const y = floor * (roomSize.h + 0.12) + roomSize.h / 2;
        addRoom(x, y, -26, num, "PG Block", orangeTiers[floor % 4]);
      });
    });

    const pgLabel = createBlockLabel("PG BLOCK", "rgba(194,65,12,0.92)");
    pgLabel.position.set(24, 8.2, -26);
    scene.add(pgLabel);

    // --- OFFICE BLOCK ---
    const officeCols = [
      [17,104,191,278], [16,103,190,277], [15,102,189,276], [14,101,188,275],
      [13,100,187,274], [12,99,186,273], [11,98,185,272], [10,97,184,271]
    ];
    officeCols.forEach((col, idx) => {
      col.forEach((num, floor) => {
        const x = -20 + idx * (roomSize.w + 0.12);
        const y = floor * (roomSize.h + 0.12) + roomSize.h / 2;
        addRoom(x, y, 26, num, "Office Block", yellowTiers[floor % 4]);
      });
    });
    const officeLabel = createBlockLabel("OFFICE BLOCK", "rgba(202,138,4,0.92)");
    officeLabel.position.set(-13, 8.2, 26);
    scene.add(officeLabel);

    // --- NCC BLOCK ---
    const nccLeft = [
      [9,96,183,270], [8,95,182,269], [7,94,181,268], [6,93,180,267]
    ];
    nccLeft.forEach((col, idx) => {
      col.forEach((num, floor) => {
        const x = 6 + idx * (roomSize.w + 0.12);
        const y = floor * (roomSize.h + 0.12) + roomSize.h / 2;
        addRoom(x, y, 26, num, "NCC Block", yellowTiers[floor % 4]);
      });
    });

    const nccRight = [
      [5,92,179,266], [4,91,178,265], [3,90,177,264], [2,89,176,263], [1,88,175,262]
    ];
    nccRight.forEach((col, idx) => {
      col.forEach((num, floor) => {
        const x = 14 + idx * (roomSize.w + 0.12);
        const y = floor * (roomSize.h + 0.12) + roomSize.h / 2;
        addRoom(x, y, 26, num, "NCC Block", yellowTiers[floor % 4]);
      });
    });

    const nccLabel = createBlockLabel("NCC BLOCK", "rgba(202,138,4,0.92)");
    nccLabel.position.set(12, 8.2, 26);
    scene.add(nccLabel);

    // --- FACILITIES ---
    function facility(name, x, z, w, d, h, color) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
      );
      mesh.position.set(x, h / 2, z);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      scene.add(mesh);

      const label = createBlockLabel(name, "rgba(15,23,42,0.88)");
      label.position.set(x, h + 1.1, z);
      label.scale.set(5.5, 1.5, 1);
      scene.add(label);
    }

    facility("Tennis Court", -12, -38, 22, 12, 0.15, 0x2563eb);
    facility("NGH Park", 24, -38, 16, 12, 0.12, 0x15803d);
    facility("Volleyball Court", -14, -8, 16, 8, 0.12, 0x0284c7);
    facility("Basketball Court", -14, 6, 16, 9, 0.12, 0x0369a1);
    facility("Mess / Canteen", 22, 4, 14, 9, 3.0, 0x16a34a);
    facility("Storage", 22, 14, 8, 5, 2.2, 0xc2410c);
    facility("Guard Room", 8, 15, 3.2, 3.2, 2.0, 0xca8a04);
    facility("Laundry", 16, -38, 4, 4, 2.0, 0x475569);

    // --- BADMINTON BUILDING COMPLEX ---
    const badmintonX = 2;
    const badmintonZ = 2;

    const badmintonMesh = new THREE.Mesh(
      new THREE.BoxGeometry(5, 1.3, 10),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55 })
    );
    badmintonMesh.position.set(badmintonX, 0.65, badmintonZ);
    badmintonMesh.castShadow = true;
    badmintonMesh.receiveShadow = true;
    scene.add(badmintonMesh);

    const badmintonLabel = createBlockLabel("Badminton Court", "rgba(15,23,42,0.9)");
    badmintonLabel.position.set(badmintonX, 2.4, badmintonZ + 6.2);
    badmintonLabel.scale.set(5.2, 1.4, 1);
    scene.add(badmintonLabel);

    const firstFloorY = 2.4;

    const readingMesh = new THREE.Mesh(
      new THREE.BoxGeometry(5, 1.25, 4.6),
      new THREE.MeshStandardMaterial({ color: 0ca8a04, roughness: 0.55 })
    );
    readingMesh.position.set(badmintonX, firstFloorY, badmintonZ + 2.5);
    readingMesh.castShadow = true;
    readingMesh.receiveShadow = true;
    scene.add(readingMesh);

    const readingLabel = createBlockLabel("Reading Room", "rgba(15,23,42,0.88)");
    readingLabel.position.set(badmintonX, firstFloorY + 1.4, badmintonZ + 2.5);
    readingLabel.scale.set(4.0, 1.25, 1);
    scene.add(readingLabel);

    const ttMesh = new THREE.Mesh(
      new THREE.BoxGeometry(5, 1.25, 4.6),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.55 })
    );
    ttMesh.position.set(badmintonX, firstFloorY, badmintonZ - 2.5);
    ttMesh.castShadow = true;
    ttMesh.receiveShadow = true;
    scene.add(ttMesh);

    const ttLabel = createBlockLabel("TT Room", "rgba(15,23,42,0.88)");
    ttLabel.position.set(badmintonX, firstFloorY + 1.4, badmintonZ - 2.5);
    ttLabel.scale.set(3.6, 1.25, 1);
    scene.add(ttLabel);

    // Search handler & Reset button
    const searchInput = searchInputRef.current;
    const handleSearchKey = (e) => {
      if (e.key !== 'Enter') return;
      const q = e.target.value.trim().toLowerCase();
      if (!q) return;
      const found = interactiveMeshes.find(m => m.userData.roomNo.toLowerCase() === q);
      if (found) {
        camera.position.set(found.position.x, found.position.y + 14, found.position.z + 16);
        controls.target.copy(found.position);
      } else {
        alert('Room not found');
      }
    };
    searchInput?.addEventListener('keydown', handleSearchKey);

    const resetBtn = document.getElementById('reset-cam-btn');
    const handleResetCam = () => {
      camera.position.set(0, 48, 72);
      controls.target.set(0, 0, 0);
    };
    resetBtn?.addEventListener('click', handleResetCam);

    let animationFrameId;
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      searchInput?.removeEventListener('keydown', handleSearchKey);
      resetBtn?.removeEventListener('click', handleResetCam);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[650px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner select-none">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Header Title */}
      <div className="absolute top-4 left-4 z-10 glass-panel px-5 py-4 rounded-2xl max-w-xs pointer-events-auto">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-building-columns text-slate-950"></i>
          </div>
          <div>
            <h1 class="font-bold text-sm text-white leading-tight">Sushruta Hostel</h1>
            <p class="text-[10px] text-emerald-400 font-medium">OBH 3D Interactive Map</p>
          </div>
        </div>
      </div>

      {/* Search Bar & Reset Overlay */}
      <div className="absolute top-4 right-4 z-10 glass-panel px-4 py-3 rounded-2xl flex items-center space-x-3 pointer-events-auto">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            ref={searchInputRef}
            placeholder="Search room no..." 
            className="bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-44"
          />
        </div>
        <button 
          id="reset-cam-btn" 
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
        >
          <Home className="w-3.5 h-3.5 text-emerald-400" />
          <span>Reset</span>
        </button>
      </div>

      {/* Navigation Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 glass-panel px-5 py-2.5 rounded-full text-xs text-slate-300 flex items-center space-x-5 pointer-events-none">
        <span>Rotate: Click + Drag</span>
        <span>Pan: Right Click + Drag</span>
        <span>Zoom: Scroll</span>
      </div>
    </div>
  );
}
