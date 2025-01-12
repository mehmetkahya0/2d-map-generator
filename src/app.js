// Global değişkenler
let mapRenderer = null;
let currentMap = null;
let threeDRenderer = null;
let currentMode = '2d';

// Harita boyutunu ayarlama
function updateMapSize() {
    const sizeSelect = document.getElementById('mapSize');
    const sizes = {
        'small': [30, 20],
        'medium': [50, 37],
        'large': [80, 60]
    };
    const [width, height] = sizes[sizeSelect.value];
    const canvas = document.getElementById('mapCanvas');
    const threeDCanvas = document.getElementById('threeDCanvas');
    const tileSize = parseInt(document.getElementById('tileSize').value);
    
    canvas.width = width * tileSize;
    canvas.height = height * tileSize;
    threeDCanvas.width = canvas.width;
    threeDCanvas.height = canvas.height;
    
    return [width, height];
}

// 2D harita oluşturma
function generate2DMap() {
    try {
        currentMode = '2d';
        const mapCanvas = document.getElementById('mapCanvas');
        const threeDCanvas = document.getElementById('threeDCanvas');
        
        // Canvas'ları güncelle
        mapCanvas.classList.add('active');
        threeDCanvas.classList.remove('active');
        
        if (!mapRenderer) {
            mapRenderer = new MapRenderer(mapCanvas);
        }
        
        const tileSize = document.getElementById('tileSize').value;
        mapRenderer.setTileSize(parseInt(tileSize));
        
        const [width, height] = updateMapSize();
        const theme = document.getElementById('theme').value;
        
        const mapGenerator = new MapGenerator(width, height);
        currentMap = mapGenerator.generateMap(theme);
        
        if (currentMap) {
            mapRenderer.render(currentMap);
            mapRenderer.calculateMapStats(currentMap);
        }
    } catch (error) {
        console.error('2D harita oluşturma hatası:', error);
    }
}

// 3D harita oluşturma
function generate3DMap() {
    try {
        currentMode = '3d';
        const mapCanvas = document.getElementById('mapCanvas');
        const threeDCanvas = document.getElementById('threeDCanvas');
        
        // Canvas'ları güncelle
        mapCanvas.classList.remove('active');
        threeDCanvas.classList.add('active');
        
        const [width, height] = updateMapSize();
        const theme = document.getElementById('theme').value;
        
        const mapGenerator = new MapGenerator(width, height);
        currentMap = mapGenerator.generateMap(theme);
        
        if (currentMap) {
            if (!threeDRenderer) {
                threeDRenderer = new ThreeDRenderer(threeDCanvas);
            }
            
            threeDRenderer.updateSize(threeDCanvas.width, threeDCanvas.height);
            threeDRenderer.render(currentMap);
            console.log('3D harita render edildi');
        }
    } catch (error) {
        console.error('3D harita oluşturma hatası:', error);
    }
}

// Event listeners
window.addEventListener('load', () => {
    try {
        generate2DMap();
        
        document.getElementById('theme').addEventListener('change', () => {
            if (currentMode === '2d') {
                generate2DMap();
            } else {
                generate3DMap();
            }
        });
        
        document.getElementById('mapSize').addEventListener('change', () => {
            if (currentMode === '2d') {
                generate2DMap();
            } else {
                generate3DMap();
            }
        });
        
        document.getElementById('tileSize').addEventListener('change', () => {
            if (currentMode === '2d') {
                generate2DMap();
            } else {
                generate3DMap();
            }
        });
        
        window.addEventListener('resize', () => {
            if (currentMode === '3d' && threeDRenderer) {
                const canvas = document.getElementById('threeDCanvas');
                threeDRenderer.updateSize(canvas.clientWidth, canvas.clientHeight);
            }
        });
    } catch (error) {
        console.error('Başlangıç hatası:', error);
    }
});