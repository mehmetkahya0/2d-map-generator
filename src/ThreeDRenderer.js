class ThreeDRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        
        // Gelişmiş renderer ayarları
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false,
            stencil: false
        });
        
        this.renderer.setSize(canvas.width, canvas.height);
        this.renderer.setClearColor(0x87CEEB); // Gökyüzü rengi
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Gelişmiş kamera ayarları
        this.camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 1000);
        this.camera.position.set(30, 40, 30);
        this.camera.lookAt(0, 0, 0);
        
        // Gelişmiş ışıklandırma
        this.setupLights();
        
        // Kontroller
        this.setupControls();

        // Texture loader
        this.textureLoader = new THREE.TextureLoader();
        
        // Materyal cache
        this.materials = {};
        this.setupMaterials();
    }

    setupLights() {
        // Ana ambient ışık
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        // Ana directional ışık (güneş)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        this.scene.add(sunLight);

        // Hemisphere ışık (gökyüzü ve zemin renk geçişi)
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
        hemiLight.position.set(0, 100, 0);
        this.scene.add(hemiLight);
    }

    setupMaterials() {
        // Su materyali
        this.materials.water = new THREE.MeshPhysicalMaterial({
            color: 0x0066FF,
            metalness: 0.1,
            roughness: 0.2,
            transmission: 0.9,
            thickness: 1.0,
            envMapIntensity: 1.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });

        // Kum materyali
        this.materials.sand = new THREE.MeshStandardMaterial({
            color: 0xFFE4B5,
            roughness: 0.9,
            metalness: 0.1
        });

        // Çimen materyali
        this.materials.grass = new THREE.MeshStandardMaterial({
            color: 0x33CC33,
            roughness: 0.8,
            metalness: 0.1
        });

        // Dağ materyali
        this.materials.mountain = new THREE.MeshStandardMaterial({
            color: 0x996633,
            roughness: 0.9,
            metalness: 0.2
        });

        // Kar materyali
        this.materials.snow = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.3,
            metalness: 0.1
        });

        // Lav materyali
        this.materials.lava = new THREE.MeshStandardMaterial({
            color: 0xFF3300,
            roughness: 0.5,
            metalness: 0.3,
            emissive: 0xFF4400,
            emissiveIntensity: 0.5
        });
    }

    createDetailedTile(x, z, tileType) {
        const heightMap = {
            'water_deep': -1.0,
            'water': -0.5,
            'sand': 0.2,
            'grass': 0.5,
            'forest': 2.0,
            'mountain': 6.0,
            'mountain_snow': 8.0,
            'desert': 0.3,
            'snow': 1.0,
            'lava': 3.0,
            'wasteland': 0.4,
            'swamp': -0.2,
            'jungle': 3.0
        };

        const height = heightMap[tileType] || 0.5;
        let geometry, material;

        switch(tileType) {
            case 'mountain':
            case 'mountain_snow':
                // Dağ geometrisi
                geometry = new THREE.ConeBufferGeometry(0.8, height * 2, 8);
                material = tileType === 'mountain_snow' ? this.materials.snow : this.materials.mountain;
                break;

            case 'water':
            case 'water_deep':
                // Su geometrisi
                geometry = new THREE.BoxBufferGeometry(1, Math.abs(height) * 2, 1);
                material = this.materials.water;
                break;

            case 'forest':
            case 'jungle':
                // Ağaç geometrisi
                geometry = this.createTreeGeometry(height);
                material = this.materials.grass;
                break;

            case 'lava':
                // Lav geometrisi
                geometry = new THREE.BoxBufferGeometry(1, height * 2, 1);
                material = this.materials.lava;
                break;

            default:
                // Standart geometri
                geometry = new THREE.BoxBufferGeometry(1, Math.abs(height) * 2, 1);
                material = this.materials[tileType] || this.materials.grass;
        }

        const tile = new THREE.Mesh(geometry, material);
        tile.position.set(x, height, z);
        tile.castShadow = true;
        tile.receiveShadow = true;

        if (tileType === 'mountain' || tileType === 'mountain_snow') {
            tile.rotation.y = Math.random() * Math.PI;
        }

        return tile;
    }

    createTreeGeometry(height) {
        // Ağaç gövdesi
        const trunkGeometry = new THREE.CylinderBufferGeometry(0.1, 0.15, height, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x4D3300,
            roughness: 0.9,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = height / 2;

        // Ağaç yaprakları
        const leavesGeometry = new THREE.ConeBufferGeometry(0.5, height * 1.5, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({
            color: 0x006600,
            roughness: 0.8,
            metalness: 0.1
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = height * 1.2;

        // Ağaç grubu
        const treeGroup = new THREE.Group();
        treeGroup.add(trunk);
        treeGroup.add(leaves);

        return treeGroup;
    }

    createTerrain(map) {
        if (!map || !map.tiles) {
            console.error('Geçersiz harita verisi');
            return;
        }

        // Zemin oluştur
        const groundGeometry = new THREE.PlaneBufferGeometry(map.width + 10, map.height + 10, 32, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Tile'ları oluştur
        const terrainGroup = new THREE.Group();
        for (let i = 0; i < map.height; i++) {
            for (let j = 0; j < map.width; j++) {
                const tileType = map.tiles[i][j];
                const tile = this.createDetailedTile(
                    j - map.width/2,
                    i - map.height/2,
                    tileType
                );
                if (tile instanceof THREE.Group) {
                    tile.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                }
                terrainGroup.add(tile);
            }
        }
        this.scene.add(terrainGroup);
    }

    render(map) {
        if (!this.renderer) return;
        
        if (map && (!this.currentMap || map !== this.currentMap)) {
            // Sahneyi temizle
            while(this.scene.children.length > 0) {
                const obj = this.scene.children[0];
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
                this.scene.remove(obj);
            }
            
            // Yeni haritayı oluştur
            this.createTerrain(map);
            this.currentMap = map;
        }
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    updateSize(width, height) {
        if (width === 0 || height === 0) return;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    setupControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        const onMouseDown = (e) => {
            isDragging = true;
            previousMousePosition = {
                x: e.clientX,
                y: e.clientY
            };
        };
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaMove = {
                x: (e.clientX - previousMousePosition.x) * 0.5,
                y: (e.clientY - previousMousePosition.y) * 0.5
            };
            
            const rotation = new THREE.Euler(
                THREE.MathUtils.degToRad(deltaMove.y),
                THREE.MathUtils.degToRad(deltaMove.x),
                0,
                'XYZ'
            );
            
            const quaternion = new THREE.Quaternion().setFromEuler(rotation);
            this.camera.position.applyQuaternion(quaternion);
            this.camera.lookAt(0, 0, 0);
            
            previousMousePosition = {
                x: e.clientX,
                y: e.clientY
            };
            
            this.render(this.currentMap);
        };
        
        const onMouseUp = () => {
            isDragging = false;
        };
        
        const onWheel = (e) => {
            e.preventDefault();
            
            const zoomSpeed = 0.1;
            const direction = e.deltaY > 0 ? 1 : -1;
            const factor = 1 + direction * zoomSpeed;
            
            const cameraPosition = this.camera.position.clone();
            cameraPosition.multiplyScalar(factor);
            
            if (cameraPosition.length() > 10 && cameraPosition.length() < 100) {
                this.camera.position.copy(cameraPosition);
                this.render(this.currentMap);
            }
        };
        
        this.canvas.addEventListener('mousedown', onMouseDown);
        this.canvas.addEventListener('mousemove', onMouseMove);
        this.canvas.addEventListener('mouseup', onMouseUp);
        this.canvas.addEventListener('wheel', onWheel);
        
        this.cleanupListeners = () => {
            this.canvas.removeEventListener('mousedown', onMouseDown);
            this.canvas.removeEventListener('mousemove', onMouseMove);
            this.canvas.removeEventListener('mouseup', onMouseUp);
            this.canvas.removeEventListener('wheel', onWheel);
        };
    }
    
    dispose() {
        if (this.cleanupListeners) {
            this.cleanupListeners();
        }
        
        this.scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        this.renderer.dispose();
        this.scene.clear();
    }
} 