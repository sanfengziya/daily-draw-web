// 卡包图片缓存
let cardPackImages: string[] = [];
let isLoaded = false;

// 从API获取卡包图片列表
export async function loadCardPackImages(): Promise<string[]> {
  if (isLoaded && cardPackImages.length > 0) {
    return cardPackImages;
  }
  
  try {
    const response = await fetch('/api/card-packs');
    if (!response.ok) {
      throw new Error('获取卡包图片失败');
    }
    
    const data = await response.json();
    cardPackImages = data.images || [];
    isLoaded = true;
    
    // 预加载图片
    preloadCardPackImages();
    
    return cardPackImages;
  } catch (error) {
    console.error('加载卡包图片失败:', error);
    // 如果API失败，使用默认图片
    cardPackImages = ['/card_packs/chiikawa.png'];
    return cardPackImages;
  }
}

// 获取随机卡包图片
export async function getRandomCardPackImage(): Promise<string> {
  const images = await loadCardPackImages();
  
  if (images.length === 0) {
    return '/card_packs/chiikawa.png'; // 默认图片
  }
  
  // 随机选择一张图片
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
}

// 预加载卡包图片
function preloadCardPackImages(): void {
  cardPackImages.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}