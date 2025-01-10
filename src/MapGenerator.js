class MapGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = Array(height).fill().map(() => Array(width).fill(null));
        this.tileTypes = {
            WATER_DEEP: 'water_deep',
            WATER: 'water',
            SAND: 'sand',
            GRASS: 'grass',
            FOREST: 'forest',
            MOUNTAIN: 'mountain',
            MOUNTAIN_SNOW: 'mountain_snow',
            DESERT: 'desert',
            SNOW: 'snow',
            LAVA: 'lava',
            WASTELAND: 'wasteland',
            SWAMP: 'swamp',
            JUNGLE: 'jungle',
            CASTLE: 'castle',
            VILLAGE: 'village',
            TOWER: 'tower',
            RUINS: 'ruins',
            TEMPLE: 'temple',
            PORT: 'port',
            BRIDGE: 'bridge',
            CAVE: 'cave',
            MINE: 'mine',
            FARM: 'farm',
            OASIS: 'oasis',
            VOLCANO_ACTIVE: 'volcano_active',
            ICE_CASTLE: 'ice_castle',
            CRYSTAL_TOWER: 'crystal_tower',
            PYRAMID: 'pyramid'
        };
        
        this.biomeRules = {
            'water_deep': ['water'],
            'water': ['water_deep', 'sand', 'water'],
            'sand': ['water', 'grass', 'desert'],
            'grass': ['sand', 'forest', 'desert', 'mountain'],
            'forest': ['grass', 'mountain', 'jungle'],
            'mountain': ['grass', 'forest', 'mountain_snow'],
            'desert': ['sand', 'wasteland', 'mountain'],
            'jungle': ['forest', 'swamp'],
            'swamp': ['water', 'jungle', 'grass']
        };
    }

    generateTerrain(seed, smoothness, theme) {
        const heightMap = this.generateHeightMap(smoothness, seed);
        const moistureMap = this.generateMoistureMap(smoothness, seed + 1000);
        const temperatureMap = this.generateTemperatureMap(smoothness, seed + 2000);
        
        // İlk geçiş: Temel biyomları yerleştir
        for(let y = 0; y < this.height; y++) {
            for(let x = 0; x < this.width; x++) {
                const height = heightMap[y][x];
                const moisture = moistureMap[y][x];
                const temperature = temperatureMap[y][x];
                this.assignBiome(x, y, height, moisture, temperature, theme);
            }
        }

        // Biyomları düzelt
        this.smoothTerrain(3);

        // Yapı yoğunluğunu al
        const structureDensity = document.getElementById('structures').value;
        const multiplier = structureDensity === 'high' ? 2 : (structureDensity === 'low' ? 0.5 : 1);

        // Seçili özellikleri al (checkbox'lardan)
        const selectedFeatures = Array.from(document.querySelectorAll('input[name="features"]:checked'))
            .map(checkbox => checkbox.value);

        // Önce özel özellikleri ekle
        if(selectedFeatures.includes('caves')) {
            this.addStructure(this.tileTypes.CAVE, Math.floor(3 * multiplier));
        }
        if(selectedFeatures.includes('ruins')) {
            this.addStructure(this.tileTypes.RUINS, Math.floor(2 * multiplier));
        }
        if(selectedFeatures.includes('temples')) {
            this.addStructure(this.tileTypes.TEMPLE, Math.floor(2 * multiplier));
        }
        if(selectedFeatures.includes('towers')) {
            this.addStructure(this.tileTypes.TOWER, Math.floor(3 * multiplier));
        }
        if(selectedFeatures.includes('villages')) {
            this.addStructure(this.tileTypes.VILLAGE, Math.floor(4 * multiplier));
        }

        // Tema özel özellikleri ekle
        switch(theme) {
            case 'medieval':
                this.generateRivers(heightMap, Math.floor(3 * multiplier));
                if(selectedFeatures.includes('bridges')) this.addBridges();
                if(!selectedFeatures.includes('towers')) {
                    this.addStructure(this.tileTypes.TOWER, Math.floor(3 * multiplier));
                }
                if(!selectedFeatures.includes('villages')) {
                    this.addStructure(this.tileTypes.VILLAGE, Math.floor(4 * multiplier));
                }
                this.addStructure(this.tileTypes.CASTLE, Math.floor(2 * multiplier));
                break;

            case 'fantasy':
                this.generateRivers(heightMap, Math.floor(2 * multiplier));
                this.createMagicLakes(Math.floor(3 * multiplier));
                this.addStructure(this.tileTypes.CRYSTAL_TOWER, Math.floor(3 * multiplier));
                break;

            case 'farm':
                this.generateRivers(heightMap, Math.floor(2 * multiplier));
                this.addStructure(this.tileTypes.FARM, Math.floor(6 * multiplier));
                if(!selectedFeatures.includes('villages')) {
                    this.addStructure(this.tileTypes.VILLAGE, Math.floor(3 * multiplier));
                }
                if(selectedFeatures.includes('bridges')) this.addBridges();
                break;

            case 'winter':
                this.addStructure(this.tileTypes.ICE_CASTLE, Math.floor(2 * multiplier));
                break;

            case 'volcanic':
                this.generateLavaRivers(Math.floor(4 * multiplier));
                this.addStructure(this.tileTypes.VOLCANO_ACTIVE, Math.floor(3 * multiplier));
                break;

            case 'desert':
                this.addStructure(this.tileTypes.PYRAMID, Math.floor(3 * multiplier));
                this.addStructure(this.tileTypes.OASIS, Math.floor(3 * multiplier));
                break;

            case 'swamp':
                this.generateRivers(heightMap, Math.floor(5 * multiplier));
                if(!selectedFeatures.includes('villages')) {
                    this.addStructure(this.tileTypes.VILLAGE, Math.floor(3 * multiplier));
                }
                break;
        }
        
        return this;
    }

    generateHeightMap(smoothness, seed) {
        const heightMap = Array(this.height).fill().map(() => Array(this.width).fill(0));
        
        // Çoklu oktav noise kullan (daha detaylı arazi için)
        for(let y = 0; y < this.height; y++) {
            for(let x = 0; x < this.width; x++) {
                let value = 0;
                let amplitude = 1;
                let frequency = 1/smoothness;
                let maxValue = 0;
                
                // 6 oktav kullan (daha detaylı)
                for(let i = 0; i < 6; i++) {
                    value += this.perlinNoise(x * frequency + seed, y * frequency + seed) * amplitude;
                    maxValue += amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                // Normalize et
                heightMap[y][x] = (value / maxValue + 1) / 2;
                
                // Kenarlardan uzaklaştıkça yüksekliği artır (kıtasal etki)
                const distanceFromEdge = Math.min(
                    x, y, this.width - x, this.height - y
                ) / Math.min(this.width, this.height);
                heightMap[y][x] = (heightMap[y][x] + distanceFromEdge) / 2;
            }
        }
        
        return heightMap;
    }

    generateMoistureMap(smoothness, seed) {
        const moistureMap = Array(this.height).fill().map(() => Array(this.width).fill(0));
        
        for(let y = 0; y < this.height; y++) {
            for(let x = 0; x < this.width; x++) {
                let value = 0;
                let amplitude = 1;
                let frequency = 1/smoothness;
                
                // 4 oktav kullan
                for(let i = 0; i < 4; i++) {
                    value += this.perlinNoise(x * frequency + seed, y * frequency + seed) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                moistureMap[y][x] = (value + 1) / 2;
            }
        }
        
        return moistureMap;
    }

    generateTemperatureMap(smoothness, seed) {
        const tempMap = Array(this.height).fill().map(() => Array(this.width).fill(0));
        
        for(let y = 0; y < this.height; y++) {
            for(let x = 0; x < this.width; x++) {
                // Enlem etkisi
                const latitudeEffect = Math.abs(y - this.height/2) / (this.height/2);
                
                // Perlin noise ile rastgele varyasyon
                const noiseValue = this.perlinNoise(x/smoothness + seed, y/smoothness + seed);
                
                tempMap[y][x] = (1 - latitudeEffect) * 0.7 + noiseValue * 0.3;
            }
        }
        
        return tempMap;
    }

    generateRivers(heightMap, count) {
        for(let i = 0; i < count; i++) {
            let x = Math.floor(Math.random() * this.width);
            let y = Math.floor(Math.random() * this.height);
            
            // En yüksek noktayı bul
            let highestPoint = {x: x, y: y, height: heightMap[y][x]};
            for(let dy = -5; dy <= 5; dy++) {
                for(let dx = -5; dx <= 5; dx++) {
                    const newX = x + dx;
                    const newY = y + dy;
                    if(newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
                        if(heightMap[newY][newX] > highestPoint.height) {
                            highestPoint = {x: newX, y: newY, height: heightMap[newY][newX]};
                        }
                    }
                }
            }
            
            // Nehri oluştur
            this.createRiverPath(highestPoint.x, highestPoint.y, heightMap);
        }
    }

    createRiverPath(startX, startY, heightMap) {
        let x = startX;
        let y = startY;
        let path = [];
        
        while(true) {
            path.push({x, y});
            this.tiles[y][x] = this.tileTypes.WATER;
            
            // En düşük komşuyu bul
            let lowestNeighbor = null;
            for(let dy = -1; dy <= 1; dy++) {
                for(let dx = -1; dx <= 1; dx++) {
                    if(dx === 0 && dy === 0) continue;
                    
                    const newX = x + dx;
                    const newY = y + dy;
                    
                    if(newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
                        if(!lowestNeighbor || heightMap[newY][newX] < heightMap[lowestNeighbor.y][lowestNeighbor.x]) {
                            lowestNeighbor = {x: newX, y: newY};
                        }
                    }
                }
            }
            
            if(!lowestNeighbor || heightMap[lowestNeighbor.y][lowestNeighbor.x] >= heightMap[y][x]) {
                break;
            }
            
            x = lowestNeighbor.x;
            y = lowestNeighbor.y;
        }
    }

    assignBiome(x, y, height, moisture, temperature, theme) {
        switch(theme) {
            case 'medieval':
                if(height < 0.2) {
                    this.tiles[y][x] = this.tileTypes.WATER_DEEP;
                } else if(height < 0.3) {
                    this.tiles[y][x] = this.tileTypes.WATER;
                } else if(height < 0.35) {
                    this.tiles[y][x] = this.tileTypes.SAND;
                } else if(height > 0.75) {
                    this.tiles[y][x] = temperature < 0.3 ? this.tileTypes.MOUNTAIN_SNOW : this.tileTypes.MOUNTAIN;
                } else if(moisture > 0.6) {
                    this.tiles[y][x] = this.tileTypes.FOREST;
                } else {
                    this.tiles[y][x] = this.tileTypes.GRASS;
                }
                break;

            case 'fantasy':
                if(height < 0.15) {
                    this.tiles[y][x] = this.tileTypes.WATER_DEEP;
                } else if(height < 0.25) {
                    this.tiles[y][x] = this.tileTypes.WATER;
                } else if(height > 0.8) {
                    this.tiles[y][x] = this.tileTypes.MOUNTAIN_SNOW;
                } else if(moisture > 0.7 && temperature > 0.6) {
                    this.tiles[y][x] = this.tileTypes.JUNGLE;
                } else if(moisture > 0.5) {
                    this.tiles[y][x] = this.tileTypes.FOREST;
                } else {
                    this.tiles[y][x] = this.tileTypes.GRASS;
                }
                break;

            case 'farm':
                if(height < 0.2) {
                    this.tiles[y][x] = this.tileTypes.WATER;
                } else if(height > 0.8) {
                    this.tiles[y][x] = this.tileTypes.MOUNTAIN;
                } else if(moisture > 0.7) {
                    this.tiles[y][x] = this.tileTypes.FOREST;
                } else {
                    this.tiles[y][x] = this.tileTypes.GRASS;
                }
                break;

            case 'winter':
                if(height < 0.25) {
                    this.tiles[y][x] = this.tileTypes.SNOW; // Donmuş göl
                } else if(height > 0.7) {
                    this.tiles[y][x] = this.tileTypes.MOUNTAIN_SNOW;
                } else if(moisture > 0.6) {
                    this.tiles[y][x] = Math.random() > 0.7 ? this.tileTypes.FOREST : this.tileTypes.SNOW;
                } else {
                    this.tiles[y][x] = this.tileTypes.SNOW;
                }
                break;

            case 'volcanic':
                if(height < 0.2) {
                    this.tiles[y][x] = this.tileTypes.LAVA;
                } else if(height > 0.7) {
                    this.tiles[y][x] = Math.random() > 0.6 ? this.tileTypes.MOUNTAIN : this.tileTypes.LAVA;
                } else {
                    this.tiles[y][x] = Math.random() > 0.7 ? this.tileTypes.LAVA : this.tileTypes.WASTELAND;
                }
                break;

            case 'desert':
                if(height < 0.15) {
                    this.tiles[y][x] = this.tileTypes.WATER; // Nadir vaha
                } else if(height > 0.8) {
                    this.tiles[y][x] = this.tileTypes.MOUNTAIN; // Çöl dağları
                } else if(height > 0.6) {
                    this.tiles[y][x] = this.tileTypes.DESERT; // Yüksek çöl tepeleri
                } else if(height > 0.4) {
                    this.tiles[y][x] = Math.random() > 0.7 ? this.tileTypes.DESERT : this.tileTypes.SAND; // Kumul ve çöl karışımı
                } else {
                    this.tiles[y][x] = this.tileTypes.SAND; // Düz kumul alanlar
                }
                break;

            case 'swamp':
                if(height < 0.3) {
                    this.tiles[y][x] = this.tileTypes.WATER;
                } else if(height > 0.7) {
                    this.tiles[y][x] = this.tileTypes.MOUNTAIN;
                } else if(moisture > 0.5) {
                    this.tiles[y][x] = Math.random() > 0.5 ? this.tileTypes.SWAMP : this.tileTypes.FOREST;
                } else {
                    this.tiles[y][x] = this.tileTypes.SWAMP;
                }
                break;

            default:
                // Varsayılan medieval harita
                this.assignBiome(x, y, height, moisture, temperature, 'medieval');
                break;
        }
    }

    addSpecialFeatures() {
        // Volkanlar
        if(Math.random() < 0.3) { // 30% şans
            const x = Math.floor(Math.random() * (this.width - 10)) + 5;
            const y = Math.floor(Math.random() * (this.height - 10)) + 5;
            
            this.createVolcano(x, y);
        }
    }

    createVolcano(centerX, centerY) {
        const radius = 3;
        for(let y = -radius; y <= radius; y++) {
            for(let x = -radius; x <= radius; x++) {
                const distance = Math.sqrt(x*x + y*y);
                if(distance <= radius) {
                    const worldX = centerX + x;
                    const worldY = centerY + y;
                    
                    if(worldX >= 0 && worldX < this.width && worldY >= 0 && worldY < this.height) {
                        if(distance < 1) {
                            this.tiles[worldY][worldX] = this.tileTypes.LAVA;
                        } else {
                            this.tiles[worldY][worldX] = this.tileTypes.MOUNTAIN;
                        }
                    }
                }
            }
        }
    }

    smoothTerrain(iterations) {
        const tempTiles = JSON.parse(JSON.stringify(this.tiles));

        for(let i = 0; i < iterations; i++) {
            for(let y = 1; y < this.height-1; y++) {
                for(let x = 1; x < this.width-1; x++) {
                    const neighbors = this.getNeighborTypes(x, y, tempTiles);
                    const currentTile = tempTiles[y][x];

                    // Tek başına kalmış tile'ları düzelt
                    if(this.isIsolated(currentTile, neighbors)) {
                        this.tiles[y][x] = this.getMostCommonNeighbor(neighbors);
                    }

                    // Su kenarlarını düzeltme
                    if(currentTile === this.tileTypes.WATER) {
                        if(neighbors.filter(n => n !== this.tileTypes.WATER).length >= 5) {
                            this.tiles[y][x] = this.getMostCommonNeighbor(neighbors.filter(n => n !== this.tileTypes.WATER));
                        }
                    }
                }
            }
        }
    }

    getNeighborTypes(x, y, tiles) {
        const neighbors = [];
        for(let dy = -1; dy <= 1; dy++) {
            for(let dx = -1; dx <= 1; dx++) {
                if(dx === 0 && dy === 0) continue;
                if(y+dy >= 0 && y+dy < this.height && x+dx >= 0 && x+dx < this.width) {
                    neighbors.push(tiles[y+dy][x+dx]);
                }
            }
        }
        return neighbors;
    }

    isIsolated(tileType, neighbors) {
        return neighbors.filter(n => n === tileType).length <= 2;
    }

    getMostCommonNeighbor(neighbors) {
        const counts = {};
        let maxCount = 0;
        let mostCommon = neighbors[0];

        for(const neighbor of neighbors) {
            counts[neighbor] = (counts[neighbor] || 0) + 1;
            if(counts[neighbor] > maxCount) {
                maxCount = counts[neighbor];
                mostCommon = neighbor;
            }
        }

        return mostCommon;
    }

    // Basit Perlin Noise implementasyonu
    perlinNoise(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        
        const u = this.fade(x);
        const v = this.fade(y);
        
        const A = (X + Y) & 255;
        const B = (X + Y + 1) & 255;
        
        return this.lerp(
            v,
            this.lerp(u, this.grad(A, x, y), this.grad(B, x-1, y)),
            this.lerp(u, this.grad(A+1, x, y-1), this.grad(B+1, x-1, y-1))
        );
    }

    fade(t) { 
        return t * t * t * (t * (t * 6 - 15) + 10); 
    }

    lerp(t, a, b) { 
        return a + t * (b - a); 
    }

    grad(hash, x, y) {
        const h = hash & 15;
        const grad = 1 + (h & 7);
        return ((h & 8) ? -grad : grad) * x + ((h & 4) ? -grad : grad) * y;
    }

    // Tema spesifik harita oluşturma metodları
    generateMedievalMap() {
        return this.generateTerrain(Math.random() * 1000, 60, {
            water_deep: 0.2,
            water: 0.3,
            sand: 0.35,
            grass: 0.6,
            forest: 0.8,
            mountain: 0.9,
            mountain_snow: 1.0
        });
    }

    generateFantasyMap() {
        const map = this.generateTerrain(Math.random() * 1000, 50, {
            water_deep: 0.15,
            water: 0.25,
            grass: 0.5,
            forest: 0.7,
            mountain: 0.85,
            mountain_snow: 1.0
        });
        
        // Rastgele büyülü göller ekle
        for(let i = 0; i < 3; i++) {
            const x = Math.floor(Math.random() * (this.width - 10)) + 5;
            const y = Math.floor(Math.random() * (this.height - 10)) + 5;
            this.createMagicLake(x, y);
        }
        
        return map;
    }

    generateFarmMap() {
        return this.generateTerrain(Math.random() * 1000, 45, {
            water: 0.2,
            grass: 0.8,    // Daha fazla çimen alanı
            forest: 0.9,   // Az orman
            mountain: 1.0  // Çok az dağ
        });
    }

    generateWinterMap() {
        const map = this.generateTerrain(Math.random() * 1000, 40, {
            water_deep: 0.2,
            water: 0.3,    // Donmuş göller
            snow: 0.7,     // Çoğunlukla kar
            forest: 0.85,  // Az miktarda çam ormanı
            mountain_snow: 1.0  // Karlı dağlar
        });
        
        // Tüm su karelerini donmuş göle çevir
        for(let y = 0; y < this.height; y++) {
            for(let x = 0; x < this.width; x++) {
                if(this.tiles[y][x] === this.tileTypes.WATER) {
                    this.tiles[y][x] = this.tileTypes.SNOW;
                }
            }
        }
        
        return map;
    }

    generateVolcanicMap() {
        const map = this.generateTerrain(Math.random() * 1000, 35, {
            lava: 0.3,
            wasteland: 0.6,
            mountain: 0.8,
            mountain_snow: 1.0
        });
        
        // Daha fazla volkan ve lav gölü ekle
        for(let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * (this.width - 10)) + 5;
            const y = Math.floor(Math.random() * (this.height - 10)) + 5;
            this.createVolcano(x, y);
        }
        
        // Lav nehirleri ekle
        this.generateLavaRivers(3);
        
        return map;
    }

    generateDesertMap() {
        const map = this.generateTerrain(Math.random() * 1000, 45, 'desert');
        
        // Çok nadir vahalar (1-2 tane)
        const oasisCount = Math.floor(Math.random() * 2) + 1;
        for(let i = 0; i < oasisCount; i++) {
            const x = Math.floor(Math.random() * (this.width - 4)) + 2;
            const y = Math.floor(Math.random() * (this.height - 4)) + 2;
            this.createDesertOasis(x, y);
        }
        
        return map;
    }

    generateSwampMap() {
        return this.generateTerrain(Math.random() * 1000, 35, {
            water: 0.3,
            swamp: 0.6,
            forest: 0.9,
            mountain: 1.0
        });
    }

    generateMap(theme) {
        switch(theme) {
            case 'medieval':
                return this.generateMedievalMap();
            case 'fantasy':
                return this.generateFantasyMap();
            case 'farm':
                return this.generateFarmMap();
            case 'winter':
                return this.generateWinterMap();
            case 'volcanic':
                return this.generateVolcanicMap();
            case 'desert':
                return this.generateDesertMap();
            case 'swamp':
                return this.generateSwampMap();
            default:
                return this.generateMedievalMap();
        }
    }

    // Yeni yardımcı metodlar
    createMagicLake(centerX, centerY) {
        const radius = 2;
        for(let y = -radius; y <= radius; y++) {
            for(let x = -radius; x <= radius; x++) {
                if(x*x + y*y <= radius*radius) {
                    const worldX = centerX + x;
                    const worldY = centerY + y;
                    if(this.isInBounds(worldX, worldY)) {
                        this.tiles[worldY][worldX] = this.tileTypes.WATER;
                    }
                }
            }
        }
    }

    createOasis(centerX, centerY) {
        // Küçük su birikintisi
        this.tiles[centerY][centerX] = this.tileTypes.WATER;
        
        // Etrafına çimen ve ağaçlar
        for(let y = -1; y <= 1; y++) {
            for(let x = -1; x <= 1; x++) {
                if(x === 0 && y === 0) continue;
                const worldX = centerX + x;
                const worldY = centerY + y;
                if(this.isInBounds(worldX, worldY)) {
                    this.tiles[worldY][worldX] = Math.random() < 0.5 ? 
                        this.tileTypes.GRASS : this.tileTypes.FOREST;
                }
            }
        }
    }

    generateLavaRivers(count) {
        for(let i = 0; i < count; i++) {
            let x = Math.floor(Math.random() * this.width);
            let y = Math.floor(Math.random() * this.height);
            let length = Math.floor(Math.random() * 10) + 5;
            
            for(let j = 0; j < length; j++) {
                if(this.isInBounds(x, y)) {
                    this.tiles[y][x] = this.tileTypes.LAVA;
                    x += Math.floor(Math.random() * 3) - 1;
                    y += Math.floor(Math.random() * 3) - 1;
                }
            }
        }
    }

    isInBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    // ... diğer tema metodları benzer şekilde güncellenir ...

    // Yeni yardımcı metodlar
    createMagicLakes(count) {
        for(let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * (this.width - 6)) + 3;
            const y = Math.floor(Math.random() * (this.height - 6)) + 3;
            this.createMagicLake(x, y);
        }
    }

    createVolcanoes(count) {
        for(let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * (this.width - 8)) + 4;
            const y = Math.floor(Math.random() * (this.height - 8)) + 4;
            this.createVolcano(x, y);
        }
    }

    createOases(count) {
        for(let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * (this.width - 4)) + 2;
            const y = Math.floor(Math.random() * (this.height - 4)) + 2;
            this.createOasis(x, y);
        }
    }

    createDesertOasis(centerX, centerY) {
        // Merkezdeki su birikintisi
        this.tiles[centerY][centerX] = this.tileTypes.WATER;
        
        // Etrafına sadece kum
        for(let y = -1; y <= 1; y++) {
            for(let x = -1; x <= 1; x++) {
                if(x === 0 && y === 0) continue;
                const worldX = centerX + x;
                const worldY = centerY + y;
                if(this.isInBounds(worldX, worldY)) {
                    this.tiles[worldY][worldX] = this.tileTypes.SAND;
                }
            }
        }
    }

    createCity(centerX, centerY, theme) {
        const citySize = Math.floor(Math.random() * 2) + 2; // 2-3 arası boyut
        
        switch(theme) {
            case 'medieval':
                this.createMedievalCity(centerX, centerY, citySize);
                break;
            case 'fantasy':
                this.createFantasyCity(centerX, centerY, citySize);
                break;
            case 'farm':
                this.createFarmSettlement(centerX, centerY, citySize);
                break;
            case 'winter':
                this.createWinterCity(centerX, centerY, citySize);
                break;
            case 'volcanic':
                this.createVolcanicFortress(centerX, centerY, citySize);
                break;
            case 'desert':
                this.createDesertCity(centerX, centerY, citySize);
                break;
            case 'swamp':
                this.createSwampVillage(centerX, centerY, citySize);
                break;
        }
    }

    createMedievalCity(centerX, centerY, size) {
        // Kale duvarları ve kuleler
        for(let y = -size; y <= size; y++) {
            for(let x = -size; x <= size; x++) {
                const worldX = centerX + x;
                const worldY = centerY + y;
                
                if(this.isInBounds(worldX, worldY)) {
                    if(Math.abs(x) === size || Math.abs(y) === size) {
                        // Duvarlar
                        this.tiles[worldY][worldX] = this.tileTypes.MOUNTAIN;
                    } else {
                        // İç kısım
                        this.tiles[worldY][worldX] = this.tileTypes.GRASS;
                    }
                }
            }
        }
    }

    createFantasyCity(centerX, centerY, size) {
        // Büyülü kule ve kristal yapılar
        for(let y = -size; y <= size; y++) {
            for(let x = -size; x <= size; x++) {
                const worldX = centerX + x;
                const worldY = centerY + y;
                
                if(this.isInBounds(worldX, worldY)) {
                    if(x === 0 && y === 0) {
                        // Merkez kule
                        this.tiles[worldY][worldX] = this.tileTypes.MOUNTAIN_SNOW;
                    } else if(Math.abs(x) + Math.abs(y) <= size) {
                        // Kristal yapılar
                        this.tiles[worldY][worldX] = this.tileTypes.SNOW;
                    }
                }
            }
        }
    }

    createFarmSettlement(centerX, centerY, size) {
        // Tarım alanları ve çiftlikler
        for(let y = -size; y <= size; y++) {
            for(let x = -size; x <= size; x++) {
                const worldX = centerX + x;
                const worldY = centerY + y;
                
                if(this.isInBounds(worldX, worldY)) {
                    if((x + y) % 2 === 0) {
                        this.tiles[worldY][worldX] = this.tileTypes.GRASS;
                    } else {
                        this.tiles[worldY][worldX] = this.tileTypes.SAND; // Ekilmiş tarla görünümü
                    }
                }
            }
        }
    }

    createWinterCity(centerX, centerY, size) {
        // Buzdan kaleler
        for(let y = -size; y <= size; y++) {
            for(let x = -size; x <= size; x++) {
                const worldX = centerX + x;
                const worldY = centerY + y;
                
                if(this.isInBounds(worldX, worldY)) {
                    if(Math.abs(x) === size || Math.abs(y) === size) {
                        this.tiles[worldY][worldX] = this.tileTypes.MOUNTAIN_SNOW;
                    } else {
                        this.tiles[worldY][worldX] = this.tileTypes.SNOW;
                    }
                }
            }
        }
    }

    createVolcanicFortress(centerX, centerY, size) {
        // Obsidyen kaleler
        for(let y = -size; y <= size; y++) {
            for(let x = -size; x <= size; x++) {
                const worldX = centerX + x;
                const worldY = centerY + y;
                
                if(this.isInBounds(worldX, worldY)) {
                    if(Math.abs(x) === size || Math.abs(y) === size) {
                        this.tiles[worldY][worldX] = this.tileTypes.MOUNTAIN;
                    } else {
                        this.tiles[worldY][worldX] = this.tileTypes.WASTELAND;
                    }
                }
            }
        }
    }

    createDesertCity(centerX, centerY, size) {
        // Piramit benzeri yapılar
        for(let y = -size; y <= size; y++) {
            for(let x = -size; x <= size; x++) {
                const worldX = centerX + x;
                const worldY = centerY + y;
                
                if(this.isInBounds(worldX, worldY)) {
                    if(Math.abs(x) + Math.abs(y) <= size) {
                        this.tiles[worldY][worldX] = this.tileTypes.MOUNTAIN;
                    } else {
                        this.tiles[worldY][worldX] = this.tileTypes.SAND;
                    }
                }
            }
        }
    }

    createSwampVillage(centerX, centerY, size) {
        // Bataklık köyü
        for(let y = -size; y <= size; y++) {
            for(let x = -size; x <= size; x++) {
                const worldX = centerX + x;
                const worldY = centerY + y;
                
                if(this.isInBounds(worldX, worldY)) {
                    if(Math.abs(x) + Math.abs(y) <= size) {
                        this.tiles[worldY][worldX] = this.tileTypes.GRASS;
                    }
                }
            }
        }
    }

    addCities(count, theme) {
        for(let i = 0; i < count; i++) {
            // Uygun yer bul (su üzerinde olmasın)
            let attempts = 0;
            let placed = false;
            
            while(!placed && attempts < 50) {
                const x = Math.floor(Math.random() * (this.width - 6)) + 3;
                const y = Math.floor(Math.random() * (this.height - 6)) + 3;
                
                if(this.isValidCityLocation(x, y)) {
                    this.createCity(x, y, theme);
                    placed = true;
                }
                attempts++;
            }
        }
    }

    isValidCityLocation(x, y) {
        // Su üzerinde olmamalı
        if(this.tiles[y][x] === this.tileTypes.WATER || 
           this.tiles[y][x] === this.tileTypes.WATER_DEEP ||
           this.tiles[y][x] === this.tileTypes.LAVA) {
            return false;
        }
        
        // Kenarlardan uzak olmalı
        if(x < 3 || x > this.width - 3 || y < 3 || y > this.height - 3) {
            return false;
        }
        
        // Diğer şehirlerden uzak olmalı
        for(let dy = -5; dy <= 5; dy++) {
            for(let dx = -5; dx <= 5; dx++) {
                const checkX = x + dx;
                const checkY = y + dy;
                if(this.isInBounds(checkX, checkY)) {
                    if(this.tiles[checkY][checkX] === this.tileTypes.MOUNTAIN && 
                       Math.abs(dx) <= 3 && Math.abs(dy) <= 3) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    createStructures(theme) {
        switch(theme) {
            case 'medieval':
                this.addCastles(2);
                this.addVillages(4);
                this.addTowers(3);
                this.addBridges();
                break;
            case 'fantasy':
                this.addCrystalTowers(3);
                this.addMagicTemples(2);
                this.addPortals(2);
                break;
            case 'farm':
                this.addFarms(6);
                this.addVillages(3);
                this.addWindmills(4);
                break;
            case 'winter':
                this.addIceCastles(2);
                this.addIgloos(4);
                this.addFrozenTemples(2);
                break;
            case 'volcanic':
                this.addActiveVolcanoes(3);
                this.addLavaTemples(2);
                this.addObsidianTowers(2);
                break;
            case 'desert':
                this.addPyramids(3);
                this.addOases(4);
                this.addDesertTemples(2);
                break;
            case 'swamp':
                this.addSwampHuts(4);
                this.addRuins(3);
                this.addMysteriousTowers(2);
                break;
        }
    }

    addBridges() {
        // Nehirler üzerine köprüler ekle
        for(let y = 1; y < this.height - 1; y++) {
            for(let x = 1; x < this.width - 1; x++) {
                if(this.tiles[y][x] === this.tileTypes.WATER) {
                    // Yatay köprü kontrolü
                    if(this.isLandTile(x-1, y) && this.isLandTile(x+1, y)) {
                        this.tiles[y][x] = this.tileTypes.BRIDGE;
                    }
                    // Dikey köprü kontrolü
                    else if(this.isLandTile(x, y-1) && this.isLandTile(x, y+1)) {
                        this.tiles[y][x] = this.tileTypes.BRIDGE;
                    }
                }
            }
        }
    }

    addPyramids(count) {
        for(let i = 0; i < count; i++) {
            let placed = false;
            let attempts = 0;
            while(!placed && attempts < 50) {
                const x = Math.floor(Math.random() * (this.width - 4)) + 2;
                const y = Math.floor(Math.random() * (this.height - 4)) + 2;
                
                if(this.tiles[y][x] === this.tileTypes.DESERT || 
                   this.tiles[y][x] === this.tileTypes.SAND) {
                    this.createPyramid(x, y);
                    placed = true;
                }
                attempts++;
            }
        }
    }

    createPyramid(centerX, centerY) {
        const size = 2;
        for(let y = -size; y <= size; y++) {
            for(let x = -size; x <= size; x++) {
                if(Math.abs(x) + Math.abs(y) <= size) {
                    const worldX = centerX + x;
                    const worldY = centerY + y;
                    if(this.isInBounds(worldX, worldY)) {
                        this.tiles[worldY][worldX] = this.tileTypes.PYRAMID;
                    }
                }
            }
        }
    }

    isLandTile(x, y) {
        if(!this.isInBounds(x, y)) return false;
        const tile = this.tiles[y][x];
        return tile !== this.tileTypes.WATER && 
               tile !== this.tileTypes.WATER_DEEP && 
               tile !== this.tileTypes.LAVA;
    }

    // Yeni yapı ekleme metodu
    addStructure(structureType, count) {
        for(let i = 0; i < count; i++) {
            let attempts = 0;
            let placed = false;
            
            while(!placed && attempts < 50) {
                const x = Math.floor(Math.random() * (this.width - 4)) + 2;
                const y = Math.floor(Math.random() * (this.height - 4)) + 2;
                
                if(this.isValidStructureLocation(x, y, structureType)) {
                    this.tiles[y][x] = structureType;
                    placed = true;
                }
                attempts++;
            }
        }
    }

    // Yapı yerleştirme kontrolü
    isValidStructureLocation(x, y, structureType) {
        // Su üzerinde olmamalı
        if(this.tiles[y][x] === this.tileTypes.WATER_DEEP ||
           this.tiles[y][x] === this.tileTypes.LAVA) {
            return false;
        }
        
        // Kenarlardan uzak olmalı
        if(x < 1 || x > this.width - 2 || y < 1 || y > this.height - 2) {
            return false;
        }
        
        // Diğer yapılardan uzak olmalı (daha az kısıtlayıcı)
        for(let dy = -1; dy <= 1; dy++) {
            for(let dx = -1; dx <= 1; dx++) {
                const checkX = x + dx;
                const checkY = y + dy;
                if(this.isInBounds(checkX, checkY)) {
                    const tile = this.tiles[checkY][checkX];
                    // Sadece diğer yapılarla çakışmayı kontrol et
                    if(Object.values(this.tileTypes).includes(tile) && 
                       ![this.tileTypes.WATER, this.tileTypes.WATER_DEEP, 
                         this.tileTypes.SAND, this.tileTypes.GRASS, 
                         this.tileTypes.FOREST, this.tileTypes.MOUNTAIN,
                         this.tileTypes.DESERT, this.tileTypes.SNOW,
                         this.tileTypes.WASTELAND, this.tileTypes.SWAMP,
                         this.tileTypes.JUNGLE].includes(tile)) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    // Eksik yapı ekleme metodları
    addCastles(count) {
        this.addStructure(this.tileTypes.CASTLE, count);
    }

    addVillages(count) {
        this.addStructure(this.tileTypes.VILLAGE, count);
    }

    addTowers(count) {
        this.addStructure(this.tileTypes.TOWER, count);
    }

    addCrystalTowers(count) {
        this.addStructure(this.tileTypes.CRYSTAL_TOWER, count);
    }

    addMagicTemples(count) {
        this.addStructure(this.tileTypes.TEMPLE, count);
    }

    addPortals(count) {
        this.addStructure(this.tileTypes.TEMPLE, count); // Portal için özel tile eklenene kadar temple kullan
    }

    addFarms(count) {
        this.addStructure(this.tileTypes.FARM, count);
    }

    addWindmills(count) {
        this.addStructure(this.tileTypes.TOWER, count); // Yel değirmeni için özel tile eklenene kadar tower kullan
    }

    addIceCastles(count) {
        this.addStructure(this.tileTypes.ICE_CASTLE, count);
    }

    addIgloos(count) {
        this.addStructure(this.tileTypes.VILLAGE, count);
    }

    addFrozenTemples(count) {
        this.addStructure(this.tileTypes.TEMPLE, count);
    }

    addActiveVolcanoes(count) {
        this.addStructure(this.tileTypes.VOLCANO_ACTIVE, count);
    }

    addLavaTemples(count) {
        this.addStructure(this.tileTypes.TEMPLE, count);
    }

    addObsidianTowers(count) {
        this.addStructure(this.tileTypes.TOWER, count);
    }

    addDesertTemples(count) {
        this.addStructure(this.tileTypes.TEMPLE, count);
    }

    addSwampHuts(count) {
        this.addStructure(this.tileTypes.VILLAGE, count);
    }

    addMysteriousTowers(count) {
        this.addStructure(this.tileTypes.TOWER, count);
    }
}

// Utility fonksiyonları
function updateMapSize() {
    const sizeSelect = document.getElementById('mapSize');
    const sizes = {
        'small': [30, 20],
        'medium': [50, 37],
        'large': [80, 60]
    };
    const [width, height] = sizes[sizeSelect.value];
    const canvas = document.getElementById('mapCanvas');
    const tileSize = parseInt(document.getElementById('tileSize').value);
    
    canvas.width = width * tileSize;
    canvas.height = height * tileSize;
    
    return [width, height];
}

// Haritayı PNG olarak indirme fonksiyonu
function downloadMap() {
    const canvas = document.getElementById('mapCanvas');
    const link = document.createElement('a');
    link.download = 'harita.png';
    link.href = canvas.toDataURL();
    link.click();
}

// Global değişkenleri ve ana fonksiyonları ayrı bir script dosyasına taşıyalım