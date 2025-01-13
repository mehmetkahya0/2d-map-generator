class ThreeDRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.clock = new THREE.Clock();
        this.weather = 'sunny';
        this.isNight = false;
        
        // Renderer optimizasyonları
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(canvas.width, canvas.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Kamera ayarları
        this.camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 1, 1000);
        this.camera.position.set(30, 30, 30);
        this.camera.lookAt(0, 0, 0);
        
        // Işıklandırma
        this.setupLights();
        
        // Materyal ve geometri cache'leri
        this.materials = {};
        this.geometries = {};
        this.setupMaterials();
        this.setupGeometries();
        
        // Bulut sistemi
        this.setupClouds();
        
        // Optimize edilmiş kontroller
        this.controls = new THREE.OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        this.controls.zoomSpeed = 0.7;
        this.controls.panSpeed = 0.5;
        
        // Animasyon frame'i
        this.animationFrameId = null;
        this.isAnimating = false;

        this.character = null;
        this.isFirstPerson = false;
        this.normalCameraPosition = new THREE.Vector3(30, 30, 30);
        this.characterHeight = 0.5;
        this.moveSpeed = 0.1;
        this.moveDirection = new THREE.Vector3();
        this.keyStates = {};
        
        // Klavye olaylarını dinle
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    setupLights() {
        // Ana ambient ışık - güçlendirildi
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambientLight);

        // Ana directional ışık - pozisyon ve güç ayarlandı
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(20, 40, 20);
        this.scene.add(mainLight);

        // İkinci directional ışık - dolgu ışığı
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
        fillLight.position.set(-30, 40, -30);
        this.scene.add(fillLight);
    }

    setupGeometries() {
        this.geometries = {
            box: new THREE.BoxGeometry(1, 1, 1),
            cloud: new THREE.SphereGeometry(1, 8, 8),
            water: new THREE.PlaneGeometry(1, 1, 32, 32),
            bridge: new THREE.BoxGeometry(2, 0.3, 1),
            bridgePillar: new THREE.CylinderGeometry(0.1, 0.1, 1, 8),
            castle: new THREE.BoxGeometry(0.8, 1.5, 0.8),
            castleTower: new THREE.CylinderGeometry(0.2, 0.2, 2, 8),
            temple: new THREE.BoxGeometry(0.9, 1.2, 0.9),
            templeRoof: new THREE.ConeGeometry(0.7, 0.5, 4),
            ruins: new THREE.BoxGeometry(0.7, 0.4, 0.7),
            tower: new THREE.CylinderGeometry(0.25, 0.3, 2, 8),
            towerRoof: new THREE.ConeGeometry(0.4, 0.4, 8),
            treeTrunk: new THREE.CylinderGeometry(0.1, 0.15, 1.0, 8),
            treeLeaves: new THREE.ConeGeometry(0.5, 1.2, 8),
            rock: new THREE.DodecahedronGeometry(0.3),
            grass: new THREE.ConeGeometry(0.1, 0.3, 4),
            flower: new THREE.SphereGeometry(0.08, 8, 8),
            palmTrunk: new THREE.CylinderGeometry(0.1, 0.15, 1.2, 6),
            palmLeaves: new THREE.ConeGeometry(0.6, 0.4, 5),
            sakuraTree: new THREE.CylinderGeometry(0.12, 0.18, 1.4, 8),
            sakuraLeaves: new THREE.SphereGeometry(0.6, 12, 12),
            sakuraPetal: new THREE.PlaneGeometry(0.1, 0.1),
            cactus: new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8),
            cactusArm: new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8),
            desertRock: new THREE.DodecahedronGeometry(0.4),
            bamboo: new THREE.CylinderGeometry(0.05, 0.07, 1.5, 6),
            bambooLeaves: new THREE.ConeGeometry(0.2, 0.4, 4),
            sun: new THREE.SphereGeometry(2, 32, 32),
            moon: new THREE.SphereGeometry(1.5, 32, 32),
            rainDrop: new THREE.ConeGeometry(0.02, 0.1, 4)
        };
    }

    setupMaterials() {
        this.materials = {
            water: new THREE.MeshBasicMaterial({ 
                color: 0x3399FF, 
                transparent: true, 
                opacity: 0.8
            }),
            sand: new THREE.MeshBasicMaterial({ color: 0xFFE4B5 }),
            grass: new THREE.MeshBasicMaterial({ color: 0x33CC33 }),
            mountain: new THREE.MeshBasicMaterial({ color: 0x996633 }),
            snow: new THREE.MeshBasicMaterial({ color: 0xFFFFFF }),
            forest: new THREE.MeshBasicMaterial({ color: 0x228B22 }),
            desert: new THREE.MeshBasicMaterial({ color: 0xF4A460 }),
            lava: new THREE.MeshBasicMaterial({ 
                color: 0xFF4500,
                emissive: 0xFF0000,
                emissiveIntensity: 0.8 
            }),
            swamp: new THREE.MeshBasicMaterial({ color: 0x2F4F4F }),
            jungle: new THREE.MeshBasicMaterial({ color: 0x006400 }),
            treeTrunk: new THREE.MeshBasicMaterial({ color: 0x3E2723 }),
            treeLeaves: new THREE.MeshBasicMaterial({ color: 0x2E7D32 }),
            palmTrunk: new THREE.MeshBasicMaterial({ color: 0x795548 }),
            palmLeaves: new THREE.MeshBasicMaterial({ color: 0x388E3C }),
            rock: new THREE.MeshBasicMaterial({ color: 0x808080 }),
            smallGrass: new THREE.MeshBasicMaterial({ color: 0x90EE90 }),
            flower: new THREE.MeshBasicMaterial({ color: 0xFF69B4 }),
            cloud: new THREE.MeshBasicMaterial({ 
                color: 0xFFFFFF, 
                transparent: true, 
                opacity: 0.6
            }),
            bridge: new THREE.MeshBasicMaterial({ color: 0x8B4513 }),
            bridgePillar: new THREE.MeshBasicMaterial({ color: 0x6B4423 }),
            castle: new THREE.MeshBasicMaterial({ color: 0x808080 }),
            castleTower: new THREE.MeshBasicMaterial({ color: 0x707070 }),
            temple: new THREE.MeshBasicMaterial({ color: 0xDEB887 }),
            templeRoof: new THREE.MeshBasicMaterial({ color: 0x8B0000 }),
            ruins: new THREE.MeshBasicMaterial({ color: 0x696969 }),
            tower: new THREE.MeshBasicMaterial({ color: 0xA0522D }),
            towerRoof: new THREE.MeshBasicMaterial({ color: 0x800000 }),
            sakuraTrunk: new THREE.MeshBasicMaterial({ color: 0x4A332F }),
            sakuraLeaves: new THREE.MeshBasicMaterial({ 
                color: 0xFFB7C5,
                transparent: true,
                opacity: 0.9
            }),
            sakuraPetal: new THREE.MeshBasicMaterial({ 
                color: 0xFFC0CB,
                transparent: true,
                opacity: 0.7
            }),
            cactus: new THREE.MeshBasicMaterial({ color: 0x2E8B57 }),
            desertRock: new THREE.MeshBasicMaterial({ color: 0xDEB887 }),
            bamboo: new THREE.MeshBasicMaterial({ color: 0x90EE90 }),
            bambooLeaves: new THREE.MeshBasicMaterial({ color: 0x355E3B }),
            sun: new THREE.MeshBasicMaterial({ 
                color: 0xFFD700,
                emissive: 0xFFD700,
                emissiveIntensity: 1
            }),
            moon: new THREE.MeshBasicMaterial({ 
                color: 0xF4F4F4,
                emissive: 0xF4F4F4,
                emissiveIntensity: 0.5
            }),
            rainDrop: new THREE.MeshBasicMaterial({ 
                color: 0x4FC3F7,
                transparent: true,
                opacity: 0.6
            }),
            darkCloud: new THREE.MeshBasicMaterial({ 
                color: 0x424242,
                transparent: true,
                opacity: 0.8
            })
        };
    }

    setupClouds() {
        this.clouds = new THREE.Group();
        const cloudCount = 15;
        
        for (let i = 0; i < cloudCount; i++) {
            const cloudGroup = new THREE.Group();
            const sphereCount = 3 + Math.floor(Math.random() * 3);
            
            for (let j = 0; j < sphereCount; j++) {
                const cloudPart = new THREE.Mesh(
                    this.geometries.cloud,
                    this.weather === 'rainy' ? this.materials.darkCloud : this.materials.cloud
                );
                
                cloudPart.position.set(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 2
                );
                
                cloudPart.scale.set(
                    1.5 + Math.random(),
                    1 + Math.random() * 0.5,
                    1.5 + Math.random()
                );
                
                cloudGroup.add(cloudPart);
            }
            
            cloudGroup.position.set(
                (Math.random() - 0.5) * 40,
                8 + Math.random() * 3,
                (Math.random() - 0.5) * 40
            );
            
            this.clouds.add(cloudGroup);
        }
        
        this.scene.add(this.clouds);
    }

    createSpecialFeature(type, x, z, height) {
        const group = new THREE.Group();
        
        switch(type) {
            case 'bridge':
                const bridge = new THREE.Mesh(this.geometries.bridge, this.materials.bridge);
                bridge.position.y = height + 0.5;
                
                const pillar1 = new THREE.Mesh(this.geometries.bridgePillar, this.materials.bridgePillar);
                pillar1.position.set(-0.6, height, 0);
                
                const pillar2 = new THREE.Mesh(this.geometries.bridgePillar, this.materials.bridgePillar);
                pillar2.position.set(0.6, height, 0);
                
                group.add(bridge, pillar1, pillar2);
                break;

            case 'castle':
                const base = new THREE.Mesh(this.geometries.castle, this.materials.castle);
                base.position.y = height + 0.75;
                
                const tower1 = new THREE.Mesh(this.geometries.castleTower, this.materials.castleTower);
                tower1.position.set(0.3, height + 1, 0.3);
                
                const tower2 = new THREE.Mesh(this.geometries.castleTower, this.materials.castleTower);
                tower2.position.set(-0.3, height + 1, -0.3);
                
                group.add(base, tower1, tower2);
                break;

            case 'temple':
                const templeBase = new THREE.Mesh(this.geometries.temple, this.materials.temple);
                templeBase.position.y = height + 0.6;
                
                const roof = new THREE.Mesh(this.geometries.templeRoof, this.materials.templeRoof);
                roof.position.y = height + 1.45;
                
                group.add(templeBase, roof);
                break;

            case 'ruins':
                const ruins = new THREE.Mesh(this.geometries.ruins, this.materials.ruins);
                ruins.position.y = height + 0.2;
                
                const brokenPillar = new THREE.Mesh(
                    this.geometries.bridgePillar,
                    this.materials.ruins
                );
                brokenPillar.rotation.x = Math.PI * 0.15;
                brokenPillar.position.set(0.3, height + 0.3, 0.3);
                
                group.add(ruins, brokenPillar);
                break;

            case 'tower':
                const towerBase = new THREE.Mesh(this.geometries.tower, this.materials.tower);
                towerBase.position.y = height + 1;
                
                const towerRoof = new THREE.Mesh(this.geometries.towerRoof, this.materials.towerRoof);
                towerRoof.position.y = height + 2.2;
                
                group.add(towerBase, towerRoof);
                break;
        }
        
        group.position.set(x, 0, z);
        return group;
    }

    createTile(x, z, tileType) {
        const heightMap = {
            'water_deep': -0.2,
            'water': -0.1,
            'sand': 0.1,
            'grass': 0.3,
            'forest': 0.6,
            'mountain': 1.5,
            'mountain_snow': 2.0,
            'desert': 0.2,
            'snow': 0.4,
            'lava': 0.5,
            'swamp': 0.1,
            'jungle': 0.7
        };

        const height = heightMap[tileType] || 0.3;
        const tileGroup = new THREE.Group();
        
        // Temel tile oluştur
        if (tileType.includes('water')) {
            const tile = new THREE.Mesh(this.geometries.water, this.materials.water);
            tile.rotation.x = -Math.PI / 2;
            tile.position.set(0, 0, 0);
            tile.scale.set(1.1, 1.1, 1);
            tileGroup.add(tile);
        } else {
            const tile = new THREE.Mesh(this.geometries.box, this.materials[tileType] || this.materials.grass);
            tile.scale.set(1, Math.max(0.1, Math.abs(height)), 1);
            tile.position.set(0, height / 2, 0);
            tileGroup.add(tile);
            
            // Detayları ekle
            this.addDetails(tileGroup, tileType, height);
        }

        // Özel yapıları ekle
        if (tileType.includes('bridge')) {
            const bridge = this.createSpecialFeature('bridge', 0, 0, height);
            tileGroup.add(bridge);
        }
        if (tileType.includes('castle')) {
            const castle = this.createSpecialFeature('castle', 0, 0, height);
            tileGroup.add(castle);
        }
        if (tileType.includes('temple')) {
            const temple = this.createSpecialFeature('temple', 0, 0, height);
            tileGroup.add(temple);
        }
        if (tileType.includes('ruins')) {
            const ruins = this.createSpecialFeature('ruins', 0, 0, height);
            tileGroup.add(ruins);
        }
        if (tileType.includes('tower')) {
            const tower = this.createSpecialFeature('tower', 0, 0, height);
            tileGroup.add(tower);
        }

        tileGroup.position.set(x, 0, z);
        return tileGroup;
    }

    createTerrain(map) {
        if (!map || !map.tiles) {
            console.error('Geçersiz harita verisi');
            return;
        }

        const terrainGroup = new THREE.Group();
        
        // Zemin - renk açıldı
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(map.width + 2, map.height + 2),
            new THREE.MeshBasicMaterial({ color: 0x888888 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.3;
        terrainGroup.add(ground);

        // Harita tile'ları
        for (let i = 0; i < map.height; i++) {
            for (let j = 0; j < map.width; j++) {
                const tileType = map.tiles[i][j];
                const tile = this.createTile(
                    j - map.width/2,
                    i - map.height/2,
                    tileType
                );
                terrainGroup.add(tile);
            }
        }
        
        this.scene.add(terrainGroup);
    }

    animate() {
        if (!this.isAnimating) return;
        
        const delta = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();

        // Karakter hareketini güncelle
        this.updateCharacterMovement();

        // Bulut animasyonu
        if (this.clouds) {
            this.clouds.children.forEach((cloudGroup, index) => {
                cloudGroup.position.x += delta * 0.5;
                if (cloudGroup.position.x > 30) {
                    cloudGroup.position.x = -30;
                }
                // Hafif yukarı aşağı hareket
                cloudGroup.position.y += Math.sin(elapsedTime + index) * delta * 0.1;
            });
        }

        // Yağmur animasyonu
        if (this.raindrops && this.raindrops.visible) {
            this.raindrops.children.forEach(raindrop => {
                raindrop.position.y -= raindrop.velocity * delta;
                raindrop.position.x -= delta * 5; // Rüzgar etkisi
                
                if (raindrop.position.y < 0) {
                    raindrop.position.set(
                        (Math.random() - 0.5) * 60,
                        20 + Math.random() * 10,
                        (Math.random() - 0.5) * 60
                    );
                }
                if (raindrop.position.x < -30) {
                    raindrop.position.x = 30;
                }
            });
        }

        // Kar animasyonu - geliştirilmiş versiyon
        if (this.snowflakes && this.snowflakes.visible) {
            this.snowflakes.children.forEach(snowflake => {
                // Dikey hareket
                snowflake.position.y -= snowflake.velocity * delta;
                
                // Yatay sallanma hareketi
                snowflake.position.x += Math.sin(elapsedTime * snowflake.swaySpeed) 
                    * snowflake.swayAmount * delta;
                
                // Z ekseni hareketi
                snowflake.position.z += Math.cos(elapsedTime * snowflake.swaySpeed) 
                    * snowflake.swayAmount * delta;
                
                // Kendi ekseni etrafında dönme
                snowflake.rotation.z += snowflake.rotationSpeed;
                snowflake.rotation.x += snowflake.rotationSpeed * 0.5;
                
                // Ekran dışına çıkan kar tanelerini yukarı taşı
                if (snowflake.position.y < 0) {
                    snowflake.position.set(
                        (Math.random() - 0.5) * 80,
                        30 + Math.random() * 20,
                        (Math.random() - 0.5) * 80
                    );
                }
                
                // Yatayda ekran dışına çıkanları karşı tarafa taşı
                if (Math.abs(snowflake.position.x) > 40) {
                    snowflake.position.x *= -0.9;
                }
                if (Math.abs(snowflake.position.z) > 40) {
                    snowflake.position.z *= -0.9;
                }
            });
        }

        // Güneş/ay animasyonu
        if (this.sun && this.sun.visible) {
            this.sun.rotation.y += delta * 0.2;
        }
        if (this.moon && this.moon.visible) {
            this.moon.rotation.y += delta * 0.1;
        }

        // Kontrolleri güncelle
        if (this.controls) {
            this.controls.update();
        }

        // Render
        this.renderer.render(this.scene, this.camera);
        
        // Sonraki frame
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    render(map) {
        if (!this.renderer) return;
        
        // Önceki animasyonu durdur
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Sahneyi temizle
        while(this.scene.children.length > 0) {
            const obj = this.scene.children[0];
            this.scene.remove(obj);
        }
        
        // Hava durumu sistemini kur
        this.setupWeather();
        
        // Yeni haritayı oluştur
        this.createTerrain(map);
        
        // Bulutları yeniden oluştur
        this.setupClouds();
        
        // Animasyonu başlat
        this.isAnimating = true;
        this.animate();

        // Karakteri oluştur
        this.createCharacter();
    }
    
    updateSize(width, height) {
        if (width === 0 || height === 0) return;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    dispose() {
        this.isAnimating = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Geometrileri temizle
        Object.values(this.geometries).forEach(geometry => {
            geometry.dispose();
        });
        
        // Materyalleri temizle
        Object.values(this.materials).forEach(material => {
            material.dispose();
        });
        
        // Renderer'ı temizle
        this.renderer.dispose();
        
        // Kontrolleri temizle
        if (this.controls) {
            this.controls.dispose();
        }
    }

    createTree(height, isForest = true) {
        const group = new THREE.Group();
        
        if (isForest) {
            // Normal ağaç
            const trunk = new THREE.Mesh(this.geometries.treeTrunk, this.materials.treeTrunk);
            trunk.position.y = height + 0.4;
            
            const leaves = new THREE.Mesh(this.geometries.treeLeaves, this.materials.treeLeaves);
            leaves.position.y = height + 1;
            
            group.add(trunk, leaves);
        } else {
            // Palmiye
            const trunk = new THREE.Mesh(this.geometries.palmTrunk, this.materials.palmTrunk);
            trunk.position.y = height + 0.6;
            
            for (let i = 0; i < 5; i++) {
                const leaf = new THREE.Mesh(this.geometries.palmLeaves, this.materials.palmLeaves);
                leaf.position.y = height + 1.2;
                leaf.rotation.y = (i * Math.PI * 2) / 5;
                leaf.rotation.x = -Math.PI / 6;
                group.add(leaf);
            }
            
            group.add(trunk);
        }
        
        return group;
    }

    addDetails(tileGroup, tileType, height) {
        const addRandomElement = (geometry, material, count, heightOffset, scaleRange = [1, 1]) => {
            for (let i = 0; i < count; i++) {
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(
                    (Math.random() - 0.5) * 0.8,
                    height + heightOffset,
                    (Math.random() - 0.5) * 0.8
                );
                const scale = scaleRange[0] + Math.random() * (scaleRange[1] - scaleRange[0]);
                mesh.scale.set(scale, scale, scale);
                mesh.rotation.y = Math.random() * Math.PI * 2;
                tileGroup.add(mesh);
            }
        };

        switch(true) {
            case tileType.includes('forest'):
                if (tileType.includes('fantasy')) {
                    // Sakura ormanı
                    for (let i = 0; i < 2; i++) {
                        const sakura = this.createSakuraTree(height);
                        sakura.position.set(
                            (Math.random() - 0.5) * 0.6,
                            0,
                            (Math.random() - 0.5) * 0.6
                        );
                        tileGroup.add(sakura);
                    }
                    addRandomElement(this.geometries.sakuraPetal, this.materials.sakuraPetal, 8, 0.1);
                } else {
                    // Normal orman
                    for (let i = 0; i < 3; i++) {
                        const tree = this.createTree(height);
                        tree.position.set(
                            (Math.random() - 0.5) * 0.6,
                            0,
                            (Math.random() - 0.5) * 0.6
                        );
                        tree.scale.set(0.8, 0.8, 0.8);
                        tileGroup.add(tree);
                    }
                }
                addRandomElement(this.geometries.grass, this.materials.smallGrass, 4, 0.15);
                break;

            case tileType.includes('desert'):
                // Kaktüsler
                if (Math.random() > 0.5) {
                    const cactus = this.createCactus(height);
                    cactus.position.set(
                        (Math.random() - 0.5) * 0.6,
                        0,
                        (Math.random() - 0.5) * 0.6
                    );
                    tileGroup.add(cactus);
                }
                // Çöl kayaları
                addRandomElement(this.geometries.desertRock, this.materials.desertRock, 2, 0.2, [0.4, 0.8]);
                break;

            case tileType.includes('jungle'):
                if (tileType.includes('fantasy')) {
                    // Bambu ormanı
                    for (let i = 0; i < 4; i++) {
                        const bamboo = this.createBamboo(height);
                        bamboo.position.set(
                            (Math.random() - 0.5) * 0.7,
                            0,
                            (Math.random() - 0.5) * 0.7
                        );
                        tileGroup.add(bamboo);
                    }
                } else {
                    // Normal orman
                    for (let i = 0; i < 4; i++) {
                        const tree = this.createTree(height, false);
                        tree.position.set(
                            (Math.random() - 0.5) * 0.7,
                            0,
                            (Math.random() - 0.5) * 0.7
                        );
                        tileGroup.add(tree);
                    }
                }
                addRandomElement(this.geometries.grass, this.materials.smallGrass, 6, 0.15);
                break;

            case tileType.includes('mountain'):
                addRandomElement(this.geometries.rock, this.materials.rock, 4, 0.3, [0.6, 1.2]);
                break;

            case tileType.includes('sand'):
                if (Math.random() > 0.7) {
                    const palm = this.createTree(height, false);
                    palm.position.set((Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.6);
                    palm.scale.set(0.7, 0.7, 0.7);
                    tileGroup.add(palm);
                }
                break;
        }
    }

    createSakuraTree(height) {
        const group = new THREE.Group();
        
        // Gövde - daha kalın ve uzun
        const trunk = new THREE.Mesh(this.geometries.sakuraTree, this.materials.sakuraTrunk);
        trunk.position.y = height + 0.7;
        
        // Çiçekli dallar - daha büyük ve yoğun
        for (let i = 0; i < 4; i++) {
            const leaves = new THREE.Mesh(this.geometries.sakuraLeaves, this.materials.sakuraLeaves);
            leaves.position.y = height + 1.4 + (i * 0.2);
            leaves.position.x = (Math.random() - 0.5) * 0.6;
            leaves.position.z = (Math.random() - 0.5) * 0.6;
            leaves.scale.set(0.9, 0.7, 0.9);
            
            // Daha fazla düşen yaprak
            for (let j = 0; j < 8; j++) {
                const petal = new THREE.Mesh(this.geometries.sakuraPetal, this.materials.sakuraPetal);
                petal.position.set(
                    (Math.random() - 0.5) * 1.2,
                    height + 1 + Math.random() * 1,
                    (Math.random() - 0.5) * 1.2
                );
                petal.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                group.add(petal);
            }
            
            group.add(leaves);
        }
        
        group.add(trunk);
        return group;
    }

    createCactus(height) {
        const group = new THREE.Group();
        
        // Ana gövde
        const main = new THREE.Mesh(this.geometries.cactus, this.materials.cactus);
        main.position.y = height + 0.4;
        
        // Kollar
        for (let i = 0; i < 2; i++) {
            const arm = new THREE.Mesh(this.geometries.cactusArm, this.materials.cactus);
            arm.position.y = height + 0.4 + Math.random() * 0.3;
            arm.position.x = (i === 0 ? 0.2 : -0.2);
            arm.rotation.z = (i === 0 ? -Math.PI/4 : Math.PI/4);
            group.add(arm);
        }
        
        group.add(main);
        return group;
    }

    createBamboo(height) {
        const group = new THREE.Group();
        
        // Ana bambu gövdesi
        const main = new THREE.Mesh(this.geometries.bamboo, this.materials.bamboo);
        main.position.y = height + 0.75;
        
        // Yapraklar
        for (let i = 0; i < 3; i++) {
            const leaves = new THREE.Mesh(this.geometries.bambooLeaves, this.materials.bambooLeaves);
            leaves.position.y = height + 0.8 + (i * 0.4);
            leaves.position.x = (Math.random() - 0.5) * 0.3;
            leaves.rotation.y = Math.random() * Math.PI;
            group.add(leaves);
        }
        
        group.add(main);
        return group;
    }

    setupWeather() {
        // Güneş ve ay oluştur
        this.sun = new THREE.Mesh(this.geometries.sun, this.materials.sun);
        this.sun.position.set(20, 30, -20);
        this.scene.add(this.sun);

        this.moon = new THREE.Mesh(this.geometries.moon, this.materials.moon);
        this.moon.position.set(-20, 30, 20);
        this.moon.visible = false;
        this.scene.add(this.moon);

        // Yağmur damlalarını hazırla
        this.raindrops = new THREE.Group();
        for (let i = 0; i < 1000; i++) {
            const raindrop = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, 0.3),
                new THREE.MeshBasicMaterial({
                    color: 0x99ccff,
                    transparent: true,
                    opacity: 0.6
                })
            );
            raindrop.velocity = 15 + Math.random() * 5;
            raindrop.position.set(
                (Math.random() - 0.5) * 60,
                20 + Math.random() * 10,
                (Math.random() - 0.5) * 60
            );
            raindrop.rotation.x = Math.PI / 8;
            this.raindrops.add(raindrop);
        }
        this.scene.add(this.raindrops);
        this.raindrops.visible = false;

        // Kar tanelerini hazırla
        this.snowflakes = new THREE.Group();
        for (let i = 0; i < 1000; i++) {
            const snowflake = new THREE.Mesh(
                new THREE.PlaneGeometry(0.2, 0.2),
                new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.9
                })
            );
            snowflake.velocity = 1.5 + Math.random() * 1.5;
            snowflake.rotationSpeed = (Math.random() - 0.5) * 0.05;
            snowflake.swaySpeed = 0.5 + Math.random() * 0.5;
            snowflake.swayAmount = 0.3 + Math.random() * 0.3;
            snowflake.position.set(
                (Math.random() - 0.5) * 80,
                30 + Math.random() * 20,
                (Math.random() - 0.5) * 80
            );
            this.snowflakes.add(snowflake);
        }
        this.scene.add(this.snowflakes);
        this.snowflakes.visible = false;

        // Işıkları ayarla
        this.dayLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.dayLight.position.set(20, 40, 20);
        this.scene.add(this.dayLight);

        this.nightLight = new THREE.DirectionalLight(0x4444ff, 0.3);
        this.nightLight.position.set(-20, 40, 20);
        this.scene.add(this.nightLight);
        this.nightLight.visible = false;

        this.ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(this.ambientLight);
    }

    setDayNight(isNight) {
        this.isNight = isNight;
        
        // Güneş ve ay görünürlüğü
        if (this.sun) this.sun.visible = !isNight;
        if (this.moon) this.moon.visible = isNight;
        
        // Işıkları ayarla
        if (this.dayLight) this.dayLight.visible = !isNight;
        if (this.nightLight) this.nightLight.visible = isNight;
        
        // Ambient ışık yoğunluğunu ayarla
        if (this.ambientLight) {
            this.ambientLight.intensity = isNight ? 0.3 : 1.0;
        }
        
        // Gökyüzü rengini ayarla
        const skyColor = isNight ? 
            (this.weather === 'rainy' ? 0x222222 : 0x001133) : 
            (this.weather === 'rainy' ? 0x666666 : 0x87CEEB);
        
        this.scene.background = new THREE.Color(skyColor);
        
        // Materyal renklerini ayarla
        this.adjustMaterialsForDayNight(isNight);
    }

    adjustMaterialsForDayNight(isNight) {
        const intensityMultiplier = isNight ? 0.5 : 1.0;
        
        // Temel materyallerin renklerini ayarla
        Object.entries(this.materials).forEach(([key, material]) => {
            if (material.color && !['sun', 'moon', 'lava'].includes(key)) {
                const originalColor = new THREE.Color(material.color.getHex());
                material.color.setRGB(
                    originalColor.r * intensityMultiplier,
                    originalColor.g * intensityMultiplier,
                    originalColor.b * intensityMultiplier
                );
            }
        });
    }

    setWeather(weatherType) {
        console.log('Hava durumu değiştiriliyor:', weatherType);
        this.weather = weatherType;

        // Gökyüzü rengini ayarla
        let skyColor;
        switch(weatherType) {
            case 'sunny':
                skyColor = this.isNight ? 0x001133 : 0x87CEEB;
                break;
            case 'rainy':
                skyColor = this.isNight ? 0x222222 : 0x666666;
                break;
            case 'cloudy':
                skyColor = this.isNight ? 0x333333 : 0xA5C5D5;
                break;
            case 'snowy':
                skyColor = this.isNight ? 0x223344 : 0xCCDDEE;
                break;
            default:
                skyColor = this.isNight ? 0x001133 : 0x87CEEB;
        }
        this.scene.background = new THREE.Color(skyColor);

        // Işık ayarları
        if (this.ambientLight) {
            switch(weatherType) {
                case 'sunny':
                    this.ambientLight.intensity = this.isNight ? 0.3 : 1.0;
                    break;
                case 'rainy':
                    this.ambientLight.intensity = this.isNight ? 0.2 : 0.6;
                    break;
                case 'cloudy':
                    this.ambientLight.intensity = this.isNight ? 0.2 : 0.7;
                    break;
                case 'snowy':
                    this.ambientLight.intensity = this.isNight ? 0.4 : 0.8;
                    break;
                default:
                    this.ambientLight.intensity = this.isNight ? 0.3 : 1.0;
            }
        }

        // Bulutları güncelle
        if (this.clouds) {
            this.clouds.children.forEach(cloudGroup => {
                cloudGroup.children.forEach(cloudPart => {
                    switch(weatherType) {
                        case 'rainy':
                            cloudPart.material = this.materials.darkCloud;
                            cloudGroup.position.y = 5;
                            break;
                        case 'snowy':
                            cloudPart.material = this.materials.cloud;
                            cloudPart.material.opacity = 0.9;
                            cloudGroup.position.y = 6;
                            break;
                        case 'cloudy':
                            cloudPart.material = this.materials.cloud;
                            cloudPart.material.opacity = 0.8;
                            cloudGroup.position.y = 7;
                            break;
                        default:
                            cloudPart.material = this.materials.cloud;
                            cloudPart.material.opacity = 0.6;
                            cloudGroup.position.y = 8;
                    }
                });
            });
        }

        // Yağmur ve kar sistemini güncelle
        if (this.raindrops) {
            this.raindrops.visible = (weatherType === 'rainy');
        }
        if (this.snowflakes) {
            this.snowflakes.visible = (weatherType === 'snowy');
        }

        console.log('Hava durumu güncellendi:', weatherType);
    }

    createCharacter() {
        const characterGroup = new THREE.Group();
        
        // Vücut - daha küçük
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8),
            new THREE.MeshBasicMaterial({ color: 0x2196F3 })
        );
        body.position.y = 0.25;
        
        // Kafa - daha küçük
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x1976D2 })
        );
        head.position.y = 0.55;
        
        characterGroup.add(body, head);
        characterGroup.position.set(0, 0, 0);
        
        this.character = characterGroup;
        this.scene.add(this.character);
    }

    toggleFirstPerson() {
        this.isFirstPerson = !this.isFirstPerson;
        
        if (this.isFirstPerson) {
            // FPV kamera pozisyonunu yükselt
            const headPosition = new THREE.Vector3();
            this.character.children[1].getWorldPosition(headPosition);
            headPosition.y += 0.3;
            this.camera.position.copy(headPosition);
            
            // Kamerayı karakterin önüne bak
            const lookAtPos = new THREE.Vector3(
                headPosition.x + Math.sin(this.character.rotation.y),
                headPosition.y,
                headPosition.z + Math.cos(this.character.rotation.y)
            );
            this.camera.lookAt(lookAtPos);
            
            // FPV kontrol ayarları
            this.controls.target.copy(lookAtPos);
            this.controls.enableZoom = false; // Zoom'u devre dışı bırak
            this.controls.enablePan = false; // Pan'i devre dışı bırak
            this.controls.enableDamping = true; // Yumuşak hareket
            this.controls.dampingFactor = 0.05; // Hareket yumuşaklığı
            this.controls.rotateSpeed = 2; // Mouse hassasiyeti
            this.controls.maxPolarAngle = Math.PI * 0.85; // Aşağı bakış sınırı
            this.controls.minPolarAngle = Math.PI * 0.15; // Yukarı bakış sınırı
        } else {
            // Normal kamera pozisyonuna dön
            this.camera.position.copy(this.normalCameraPosition);
            this.camera.lookAt(0, 0, 0);
            
            // Normal kontrol ayarları
            this.controls.target.set(0, 0, 0);
            this.controls.enableZoom = true;
            this.controls.enablePan = true;
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.rotateSpeed = 0.5;
            this.controls.maxPolarAngle = Math.PI / 2;
            this.controls.minPolarAngle = 0;
        }
        
        this.controls.update();
    }

    handleKeyDown(event) {
        this.keyStates[event.key.toLowerCase()] = true;
    }

    handleKeyUp(event) {
        this.keyStates[event.key.toLowerCase()] = false;
    }

    updateCharacterMovement() {
        if (!this.isFirstPerson || !this.character) return;

        // Hareket yönünü sıfırla
        this.moveDirection.set(0, 0, 0);

        // Kamera yönünü al
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();

        // Sağ vektörü hesapla
        const rightVector = new THREE.Vector3();
        rightVector.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));

        // WASD tuşlarına göre hareket yönünü güncelle
        if (this.keyStates['w']) {
            this.moveDirection.add(cameraDirection);
        }
        if (this.keyStates['s']) {
            this.moveDirection.sub(cameraDirection);
        }
        if (this.keyStates['a']) {
            this.moveDirection.sub(rightVector);
        }
        if (this.keyStates['d']) {
            this.moveDirection.add(rightVector);
        }

        // Hareket yönünü normalize et ve hızı uygula
        if (this.moveDirection.lengthSq() > 0) {
            this.moveDirection.normalize();
            this.moveDirection.multiplyScalar(this.moveSpeed);

            // Karakteri ve kamerayı hareket ettir
            this.character.position.add(this.moveDirection);
            this.camera.position.add(this.moveDirection);
            this.controls.target.add(this.moveDirection);
            
            // Karakteri hareket yönüne döndür
            this.character.rotation.y = Math.atan2(-this.moveDirection.x, -this.moveDirection.z);
        }
    }
} 