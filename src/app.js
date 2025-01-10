// Global değişkenler
let mapRenderer = null;
let currentMap = null;

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

// Ana fonksiyon
function generateNewMap() {
    try {
        const canvas = document.getElementById('mapCanvas');
        if (!canvas) {
            console.error('Canvas bulunamadı!');
            return;
        }

        if (!mapRenderer) {
            mapRenderer = new MapRenderer(canvas);
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
        } else {
            console.error('Harita oluşturulamadı!');
        }
    } catch (error) {
        console.error('Hata:', error);
    }
}

// Event listeners
window.addEventListener('load', () => {
    try {
        generateNewMap();
        
        document.getElementById('theme').addEventListener('change', generateNewMap);
        document.getElementById('mapSize').addEventListener('change', generateNewMap);
        document.getElementById('tileSize').addEventListener('change', generateNewMap);
        
        // Görünüm modu değişikliğini dinle
        document.getElementById('viewMode').addEventListener('change', (e) => {
            if (mapRenderer) {
                mapRenderer.setViewMode(e.target.value);
            }
        });
    } catch (error) {
        console.error('Başlangıç hatası:', error);
    }
});