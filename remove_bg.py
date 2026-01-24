from PIL import Image
import sys
import os

def remove_background(input_path, output_path):
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Change all white (also shades of whites)
            # to transparent
            if item[0] > 220 and item[1] > 220 and item[2] > 220:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Successfully removed background from {input_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

if __name__ == "__main__":
    files = ["public/pixelplacelogo.png", "public/pixelplaceicon.png"]
    for f in files:
        if os.path.exists(f):
            remove_background(f, f)
        else:
            print(f"File not found: {f}")
