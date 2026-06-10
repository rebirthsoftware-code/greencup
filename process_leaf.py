from PIL import Image

def remove_white_background(input_path, output_path, tolerance=220):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Check if the pixel is close to white
        if item[0] > tolerance and item[1] > tolerance and item[2] > tolerance:
            # Check for alpha blending at the edges if possible, but simple thresholding works for now
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

remove_white_background(
    r"C:\Users\ozgur\.gemini\antigravity\brain\90c270e7-181e-435a-886c-7211d6c4f2d3\realistic_leaf_1776825779949.png",
    r"c:\Users\ozgur\.gemini\antigravity\scratch\greencup\public\leaf.png"
)
