const { Jimp } = require("jimp");

async function removeWhite() {
  const image = await Jimp.read(String.raw`C:\Users\ozgur\.gemini\antigravity\brain\90c270e7-181e-435a-886c-7211d6c4f2d3\realistic_leaf_1776825779949.png`);
  
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    // If pixel is near white
    if (r > 200 && g > 200 && b > 200) {
      this.bitmap.data[idx + 3] = 0; // Set alpha to 0
    }
  });
  
  await image.write(String.raw`c:\Users\ozgur\.gemini\antigravity\scratch\greencup\public\leaf.png`);
  console.log("Image processed successfully!");
}

removeWhite().catch(console.error);
