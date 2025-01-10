class MapRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = 16;
        this.viewMode = 'normal';
        this.setupEventListeners();
        this.setupColorScale();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.tileSize);
            const y = Math.floor((e.clientY - rect.top) / this.tileSize);
            
            if (currentMap && currentMap.tiles[y] && currentMap.tiles[y][x]) {
                const tile = currentMap.tiles[y][x];
                document.getElementById('hoverInfo').textContent = 
                    `Kare Bilgisi: ${x},${y} - Tür: ${tile}`;
            }
        });
    }

    setupColorScale() {
        this.colorScale = document.querySelector('.color-scale');
        this.scaleBar = document.querySelector('.scale-bar');
        this.scaleTitle = document.querySelector('.scale-title');
    }

    setTileSize(size) {
        this.tileSize = parseInt(size);
        if (currentMap) {
            this.render(currentMap);
        }
    }

    setViewMode(mode) {
        this.viewMode = mode;
        this.updateColorScale(mode);
        if (currentMap) {
            this.render(currentMap);
        }
    }

    updateColorScale(mode) {
        if (!this.colorScale) return;

        // Skala barını göster/gizle
        this.colorScale.style.display = mode === 'normal' ? 'none' : 'block';

        // Gradient ve başlığı ayarla
        switch(mode) {
            case 'height':
                this.scaleBar.style.background = 'linear-gradient(to bottom, white, black)';
                this.scaleTitle.textContent = 'Yükseklik';
                this.updateScaleLabels(['Dağ', 'Ova', 'Deniz']);
                break;
            case 'temperature':
                this.scaleBar.style.background = 'linear-gradient(to bottom, red, blue)';
                this.scaleTitle.textContent = 'Sıcaklık';
                this.updateScaleLabels(['Sıcak', 'Ilıman', 'Soğuk']);
                break;
            case 'moisture':
                this.scaleBar.style.background = 'linear-gradient(to bottom, blue, white)';
                this.scaleTitle.textContent = 'Nem';
                this.updateScaleLabels(['Islak', 'Nemli', 'Kuru']);
                break;
        }
    }

    updateScaleLabels(labels) {
        const labelContainer = document.querySelector('.scale-labels');
        if (!labelContainer) return;

        labelContainer.innerHTML = labels.map(label => `<span>${label}</span>`).join('');
    }

    render(map) {
        if (!map) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        switch(this.viewMode) {
            case 'height':
                this.renderHeightMap(map);
                break;
            case 'temperature':
                this.renderTemperatureMap(map);
                break;
            case 'moisture':
                this.renderMoistureMap(map);
                break;
            default:
                this.renderNormalMap(map);
        }
    }

    renderHeightMap(map) {
        for(let y = 0; y < map.height; y++) {
            for(let x = 0; x < map.width; x++) {
                const tile = map.tiles[y][x];
                const height = this.getTileHeight(tile);
                const color = this.getHeightColor(height);
                this.drawBasicTile(x, y, color);
            }
        }
    }

    renderTemperatureMap(map) {
        for(let y = 0; y < map.height; y++) {
            for(let x = 0; x < map.width; x++) {
                const tile = map.tiles[y][x];
                const temp = this.getTileTemperature(tile);
                const color = this.getTemperatureColor(temp);
                this.drawBasicTile(x, y, color);
            }
        }
    }

    renderMoistureMap(map) {
        for(let y = 0; y < map.height; y++) {
            for(let x = 0; x < map.width; x++) {
                const tile = map.tiles[y][x];
                const moisture = this.getTileMoisture(tile);
                const color = this.getMoistureColor(moisture);
                this.drawBasicTile(x, y, color);
            }
        }
    }

    renderNormalMap(map) {
        for(let y = 0; y < map.height; y++) {
            for(let x = 0; x < map.width; x++) {
                const tile = map.tiles[y][x];
                this.drawTile(x, y, tile);
            }
        }
    }

    getTileHeight(tile) {
        const heightMap = {
            'water_deep': 0.1,
            'water': 0.2,
            'sand': 0.3,
            'grass': 0.4,
            'forest': 0.5,
            'swamp': 0.3,
            'desert': 0.4,
            'jungle': 0.5,
            'mountain': 0.8,
            'mountain_snow': 0.9,
            'snow': 0.7,
            'lava': 0.6,
            'wasteland': 0.5
        };
        return heightMap[tile] || 0.5;
    }

    getTileTemperature(tile) {
        const tempMap = {
            'water_deep': 0.4,
            'water': 0.5,
            'sand': 0.7,
            'grass': 0.6,
            'forest': 0.5,
            'swamp': 0.6,
            'desert': 0.9,
            'jungle': 0.8,
            'mountain': 0.3,
            'mountain_snow': 0.1,
            'snow': 0.1,
            'lava': 1.0,
            'wasteland': 0.8
        };
        return tempMap[tile] || 0.5;
    }

    getTileMoisture(tile) {
        const moistureMap = {
            'water_deep': 1.0,
            'water': 0.9,
            'sand': 0.2,
            'grass': 0.5,
            'forest': 0.7,
            'swamp': 0.9,
            'desert': 0.1,
            'jungle': 0.8,
            'mountain': 0.4,
            'mountain_snow': 0.6,
            'snow': 0.6,
            'lava': 0.0,
            'wasteland': 0.2
        };
        return moistureMap[tile] || 0.5;
    }

    getHeightColor(height) {
        const h = Math.floor(height * 255);
        return `rgb(${h},${h},${h})`;
    }

    getTemperatureColor(temp) {
        const r = Math.floor(temp * 255);
        const b = Math.floor((1 - temp) * 255);
        return `rgb(${r},0,${b})`;
    }

    getMoistureColor(moisture) {
        const b = Math.floor(moisture * 255);
        return `rgb(0,0,${b})`;
    }

    drawBasicTile(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.tileSize,
            y * this.tileSize,
            this.tileSize,
            this.tileSize
        );
    }

    drawTile(x, y, tileType) {
        const colors = {
            'water_deep': '#004080',    // Koyu mavi
            'water': '#0066FF',         // Normal mavi
            'sand': '#FFE4B5',          // Kum rengi
            'grass': '#33CC33',         // Yeşil
            'forest': '#006600',        // Koyu yeşil
            'mountain': '#996633',      // Kahverengi
            'mountain_snow': '#FFFFFF', // Beyaz
            'desert': '#FFD700',        // Altın sarısı
            'snow': '#F0F8FF',         // Buz beyazı
            'lava': '#FF3300',         // Kırmızı
            'wasteland': '#663300',    // Koyu kahve
            'swamp': '#336666',        // Yeşil-gri
            'jungle': '#004D00',        // Çok koyu yeşil
            'castle': '#808080',        // Gri
            'village': '#DEB887',       // Kahverengi
            'tower': '#A0522D',         // Koyu kahverengi
            'ruins': '#696969',         // Koyu gri
            'temple': '#FFD700',        // Altın
            'port': '#4682B4',          // Çelik mavisi
            'bridge': '#8B4513',        // Sedir ağacı rengi
            'cave': '#2F4F4F',          // Koyu arduvaz grisi
            'mine': '#CD853F',          // Peru kahvesi
            'farm': '#DAA520',          // Altın yaldız
            'oasis': '#98FB98',         // Açık yeşil
            'volcano_active': '#FF4500', // Turuncu kırmızı
            'ice_castle': '#F0FFFF',    // Buz mavisi
            'crystal_tower': '#E6E6FA', // Lavanta
            'pyramid': '#DEB887'        // Burlywood
        };

        // Ana tile'ı çiz - varsayılan olarak gri kullan
        this.ctx.fillStyle = colors[tileType] || colors.default;
        this.ctx.fillRect(
            x * this.tileSize, 
            y * this.tileSize, 
            this.tileSize, 
            this.tileSize
        );

        // Detay ve gölgelendirme ekle
        switch(tileType) {
            case 'mountain':
                this.addMountainDetail(x, y);
                break;
            case 'forest':
                this.addForestDetail(x, y);
                break;
            case 'water':
                this.addWaterDetail(x, y);
                break;
            case 'desert':
                this.addDesertDetail(x, y);
                break;
            case 'snow':
                this.addSnowDetail(x, y);
                break;
            case 'lava':
                this.addLavaDetail(x, y);
                break;
            case 'swamp':
                this.addSwampDetail(x, y);
                break;
            case 'castle':
                this.addCastleDetail(x, y);
                break;
            case 'village':
                this.addVillageDetail(x, y);
                break;
            case 'tower':
                this.addTowerDetail(x, y);
                break;
            case 'ruins':
                this.addRuinsDetail(x, y);
                break;
            case 'temple':
                this.addTempleDetail(x, y);
                break;
            case 'port':
                this.addPortDetail(x, y);
                break;
            case 'bridge':
                this.addBridgeDetail(x, y);
                break;
            case 'cave':
                this.addCaveDetail(x, y);
                break;
            case 'mine':
                this.addMineDetail(x, y);
                break;
            case 'farm':
                this.addFarmDetail(x, y);
                break;
            case 'oasis':
                this.addOasisDetail(x, y);
                break;
            case 'volcano_active':
                this.addVolcanoActiveDetail(x, y);
                break;
            case 'ice_castle':
                this.addIceCastleDetail(x, y);
                break;
            case 'crystal_tower':
                this.addCrystalTowerDetail(x, y);
                break;
            case 'pyramid':
                this.addPyramidDetail(x, y);
                break;
        }
    }

    // Geliştirilmiş detay metodları
    addMountainDetail(x, y) {
        // Dağ zirvesi efekti
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.beginPath();
        this.ctx.moveTo(x * this.tileSize, (y + 1) * this.tileSize);
        this.ctx.lineTo((x + 0.5) * this.tileSize, y * this.tileSize);
        this.ctx.lineTo((x + 1) * this.tileSize, (y + 1) * this.tileSize);
        this.ctx.fill();

        // Gölge efekti
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.beginPath();
        this.ctx.moveTo((x + 1) * this.tileSize, (y + 1) * this.tileSize);
        this.ctx.lineTo((x + 0.5) * this.tileSize, y * this.tileSize);
        this.ctx.lineTo(x * this.tileSize, (y + 1) * this.tileSize);
        this.ctx.fill();
    }

    addForestDetail(x, y) {
        // Ağaç gövdesi
        this.ctx.fillStyle = '#4D3300';
        this.ctx.fillRect(
            (x + 0.4) * this.tileSize,
            (y + 0.5) * this.tileSize,
            this.tileSize * 0.2,
            this.tileSize * 0.5
        );

        // Ağaç tepesi
        this.ctx.fillStyle = '#004D00';
        this.ctx.beginPath();
        this.ctx.moveTo((x + 0.2) * this.tileSize, (y + 0.6) * this.tileSize);
        this.ctx.lineTo((x + 0.5) * this.tileSize, (y + 0.1) * this.tileSize);
        this.ctx.lineTo((x + 0.8) * this.tileSize, (y + 0.6) * this.tileSize);
        this.ctx.fill();
    }

    addWaterDetail(x, y) {
        // Dalga efekti
        this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        this.ctx.beginPath();
        for(let i = 0; i < 3; i++) {
            this.ctx.moveTo(
                x * this.tileSize, 
                (y + 0.3 + i * 0.2) * this.tileSize
            );
            this.ctx.quadraticCurveTo(
                (x + 0.5) * this.tileSize, 
                (y + 0.2 + i * 0.2) * this.tileSize,
                (x + 1) * this.tileSize, 
                (y + 0.3 + i * 0.2) * this.tileSize
            );
        }
        this.ctx.stroke();
    }

    addDesertDetail(x, y) {
        // Kum tepecikleri
        this.ctx.fillStyle = 'rgba(255,204,102,0.5)';
        for(let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.arc(
                (x + 0.3 + i * 0.2) * this.tileSize,
                (y + 0.5) * this.tileSize,
                this.tileSize * 0.15,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
    }

    addSnowDetail(x, y) {
        // Kar parıltısı
        for(let i = 0; i < 4; i++) {
            if(Math.random() > 0.5) {
                this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
                this.ctx.beginPath();
                this.ctx.arc(
                    x * this.tileSize + Math.random() * this.tileSize,
                    y * this.tileSize + Math.random() * this.tileSize,
                    1,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
        }
    }

    addLavaDetail(x, y) {
        // Lav parlaması
        const gradient = this.ctx.createRadialGradient(
            (x + 0.5) * this.tileSize,
            (y + 0.5) * this.tileSize,
            0,
            (x + 0.5) * this.tileSize,
            (y + 0.5) * this.tileSize,
            this.tileSize * 0.8
        );
        gradient.addColorStop(0, 'rgba(255,255,0,0.4)');
        gradient.addColorStop(1, 'rgba(255,0,0,0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            x * this.tileSize,
            y * this.tileSize,
            this.tileSize,
            this.tileSize
        );
    }

    addSwampDetail(x, y) {
        // Bataklık dokusu
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        for(let i = 0; i < 5; i++) {
            this.ctx.beginPath();
            this.ctx.arc(
                x * this.tileSize + Math.random() * this.tileSize,
                y * this.tileSize + Math.random() * this.tileSize,
                this.tileSize * 0.1,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
    }

    addCastleDetail(x, y) {
        // Kale kuleleri
        this.ctx.fillStyle = '#696969';
        this.ctx.beginPath();
        this.ctx.moveTo(x * this.tileSize, y * this.tileSize);
        this.ctx.lineTo((x + 1) * this.tileSize, y * this.tileSize);
        this.ctx.lineTo((x + 0.5) * this.tileSize, (y - 0.3) * this.tileSize);
        this.ctx.fill();
    }

    addBridgeDetail(x, y) {
        // Köprü korkulukları
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x * this.tileSize, y * this.tileSize);
        this.ctx.lineTo((x + 1) * this.tileSize, y * this.tileSize);
        this.ctx.stroke();
    }

    addPyramidDetail(x, y) {
        // Piramit gölgelendirme
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.beginPath();
        this.ctx.moveTo(x * this.tileSize, (y + 1) * this.tileSize);
        this.ctx.lineTo((x + 0.5) * this.tileSize, y * this.tileSize);
        this.ctx.lineTo((x + 1) * this.tileSize, (y + 1) * this.tileSize);
        this.ctx.fill();
    }

    calculateMapStats(map) {
        const stats = {};
        for(let y = 0; y < map.height; y++) {
            for(let x = 0; x < map.width; x++) {
                const tile = map.tiles[y][x];
                stats[tile] = (stats[tile] || 0) + 1;
            }
        }

        const total = map.width * map.height;
        let statsHtml = 'Harita İstatistikleri:<br>';
        for (let tile in stats) {
            const percentage = ((stats[tile] / total) * 100).toFixed(1);
            statsHtml += `${tile}: ${percentage}% (${stats[tile]} kare)<br>`;
        }
        document.getElementById('mapStats').innerHTML = statsHtml;
    }

    addTempleDetail(x, y) {
        // Tapınak çatısı
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.moveTo(x * this.tileSize, (y + 1) * this.tileSize);
        this.ctx.lineTo((x + 0.5) * this.tileSize, y * this.tileSize);
        this.ctx.lineTo((x + 1) * this.tileSize, (y + 1) * this.tileSize);
        this.ctx.fill();

        // Sütunlar
        this.ctx.fillStyle = '#DAA520';
        this.ctx.fillRect(
            (x + 0.2) * this.tileSize,
            (y + 0.5) * this.tileSize,
            this.tileSize * 0.15,
            this.tileSize * 0.5
        );
        this.ctx.fillRect(
            (x + 0.65) * this.tileSize,
            (y + 0.5) * this.tileSize,
            this.tileSize * 0.15,
            this.tileSize * 0.5
        );
    }

    addVillageDetail(x, y) {
        // Ev çatısı
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.moveTo(x * this.tileSize, (y + 0.6) * this.tileSize);
        this.ctx.lineTo((x + 0.5) * this.tileSize, y * this.tileSize);
        this.ctx.lineTo((x + 1) * this.tileSize, (y + 0.6) * this.tileSize);
        this.ctx.fill();

        // Ev gövdesi
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(
            (x + 0.1) * this.tileSize,
            (y + 0.6) * this.tileSize,
            this.tileSize * 0.8,
            this.tileSize * 0.4
        );
    }

    addTowerDetail(x, y) {
        // Kule gövdesi
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(
            (x + 0.25) * this.tileSize,
            (y + 0.2) * this.tileSize,
            this.tileSize * 0.5,
            this.tileSize * 0.8
        );

        // Kule tepesi
        this.ctx.fillStyle = '#A0522D';
        this.ctx.beginPath();
        this.ctx.moveTo((x + 0.15) * this.tileSize, (y + 0.2) * this.tileSize);
        this.ctx.lineTo((x + 0.5) * this.tileSize, y * this.tileSize);
        this.ctx.lineTo((x + 0.85) * this.tileSize, (y + 0.2) * this.tileSize);
        this.ctx.fill();
    }

    addRuinsDetail(x, y) {
        // Yıkık duvarlar
        this.ctx.fillStyle = '#696969';
        for(let i = 0; i < 3; i++) {
            const height = 0.3 + Math.random() * 0.4;
            this.ctx.fillRect(
                (x + 0.2 + i * 0.3) * this.tileSize,
                (y + 1 - height) * this.tileSize,
                this.tileSize * 0.15,
                this.tileSize * height
            );
        }
    }

    addCaveDetail(x, y) {
        // Mağara girişi
        this.ctx.fillStyle = '#2F4F4F';
        this.ctx.beginPath();
        this.ctx.arc(
            (x + 0.5) * this.tileSize,
            (y + 0.6) * this.tileSize,
            this.tileSize * 0.3,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Gölgelendirme
        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.ctx.beginPath();
        this.ctx.arc(
            (x + 0.5) * this.tileSize,
            (y + 0.6) * this.tileSize,
            this.tileSize * 0.2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    addFarmDetail(x, y) {
        // Tarla deseni
        this.ctx.fillStyle = '#DAA520';
        for(let i = 0; i < 3; i++) {
            this.ctx.fillRect(
                x * this.tileSize,
                (y + 0.3 * i) * this.tileSize,
                this.tileSize,
                this.tileSize * 0.1
            );
        }
    }

    addOasisDetail(x, y) {
        // Su birikintisi
        this.ctx.fillStyle = '#4682B4';
        this.ctx.beginPath();
        this.ctx.arc(
            (x + 0.5) * this.tileSize,
            (y + 0.5) * this.tileSize,
            this.tileSize * 0.3,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Palmiye
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.arc(
            (x + 0.5) * this.tileSize,
            (y + 0.3) * this.tileSize,
            this.tileSize * 0.2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    addVolcanoActiveDetail(x, y) {
        // Volkan konisi
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.moveTo(x * this.tileSize, (y + 1) * this.tileSize);
        this.ctx.lineTo((x + 0.5) * this.tileSize, y * this.tileSize);
        this.ctx.lineTo((x + 1) * this.tileSize, (y + 1) * this.tileSize);
        this.ctx.fill();

        // Lav
        this.ctx.fillStyle = '#FF4500';
        this.ctx.beginPath();
        this.ctx.arc(
            (x + 0.5) * this.tileSize,
            (y + 0.3) * this.tileSize,
            this.tileSize * 0.15,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    addIceCastleDetail(x, y) {
        // Buz kule
        this.ctx.fillStyle = '#F0FFFF';
        this.ctx.fillRect(
            (x + 0.2) * this.tileSize,
            (y + 0.2) * this.tileSize,
            this.tileSize * 0.6,
            this.tileSize * 0.8
        );

        // Buz süslemeler
        this.ctx.fillStyle = '#E0FFFF';
        this.ctx.beginPath();
        this.ctx.moveTo((x + 0.2) * this.tileSize, (y + 0.2) * this.tileSize);
        this.ctx.lineTo((x + 0.5) * this.tileSize, y * this.tileSize);
        this.ctx.lineTo((x + 0.8) * this.tileSize, (y + 0.2) * this.tileSize);
        this.ctx.fill();
    }

    addCrystalTowerDetail(x, y) {
        // Kristal kule
        this.ctx.fillStyle = '#E6E6FA';
        this.ctx.beginPath();
        this.ctx.moveTo((x + 0.5) * this.tileSize, y * this.tileSize);
        this.ctx.lineTo((x + 0.8) * this.tileSize, (y + 0.6) * this.tileSize);
        this.ctx.lineTo((x + 0.5) * this.tileSize, (y + 1) * this.tileSize);
        this.ctx.lineTo((x + 0.2) * this.tileSize, (y + 0.6) * this.tileSize);
        this.ctx.fill();

        // Parıltı efekti
        this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
        this.ctx.beginPath();
        this.ctx.arc(
            (x + 0.5) * this.tileSize,
            (y + 0.4) * this.tileSize,
            this.tileSize * 0.1,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    addPyramidDetail(x, y) {
        // Piramit gövdesi
        this.ctx.fillStyle = '#DEB887';
        this.ctx.beginPath();
        this.ctx.moveTo(x * this.tileSize, (y + 1) * this.tileSize);
        this.ctx.lineTo((x + 0.5) * this.tileSize, y * this.tileSize);
        this.ctx.lineTo((x + 1) * this.tileSize, (y + 1) * this.tileSize);
        this.ctx.fill();

        // Gölgelendirme
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.beginPath();
        this.ctx.moveTo((x + 0.5) * this.tileSize, y * this.tileSize);
        this.ctx.lineTo((x + 1) * this.tileSize, (y + 1) * this.tileSize);
        this.ctx.lineTo((x + 0.5) * this.tileSize, (y + 1) * this.tileSize);
        this.ctx.fill();
    }
} 