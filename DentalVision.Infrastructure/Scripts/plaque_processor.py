import cv2
import numpy as np
import json
import argparse
import sys
import os
import urllib.request
import urllib.error
import base64
import traceback
from enum import Enum

class SegmentationMode(Enum):
    AUTO = "AUTO"
    ROBOFLOW = "ROBOFLOW"
    YOLO = "YOLO"
    OPENCV = "OPENCV"
    COLOR_TEETH = "COLOR_TEETH"

ACTIVE_MODE = SegmentationMode.AUTO 

FDI_CONFIDENCE = 0.08
FDI_OVERLAP = 0.35
SEG_CONFIDENCE = 0.08
SEG_OVERLAP = 0.40

try:
    from ultralytics import YOLO
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False

def detect_natural_gums_and_dye(image_bgr):
    """
    1. Segments natural gingival tissue (coral pink/warm red gums).
    2. Segments dental disclosing dye (purple/indigo mature plaque & magenta fresh plaque).
    """
    h, w, _ = image_bgr.shape
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    l_chan, a_chan, b_chan = cv2.split(lab)

    # 1. Natural Gingival Mucosa (Gums) - Warm red/pink (Hue 0-22, Saturation 25-115, warm b* >= 126)
    lower_gum = np.array([0, 25, 40])
    upper_gum = np.array([22, 115, 255])
    gum_hsv = cv2.inRange(hsv, lower_gum, upper_gum)
    gum_lab = cv2.inRange(b_chan, 126, 255)
    gum_mask = cv2.bitwise_and(gum_hsv, gum_lab)
    gum_mask = cv2.morphologyEx(gum_mask, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))

    # 2. Mature Acidogenic Plaque Dye (Deep Purple, Violet, Indigo: Hue 105-165, S >= 45, V >= 30)
    lower_purple = np.array([105, 45, 30])
    upper_purple = np.array([165, 255, 255])
    mask_purple = cv2.inRange(hsv, lower_purple, upper_purple)

    # 3. Fresh Plaque Biofilm (Erythrosine Pink, Vivid Magenta: S >= 65, V >= 60)
    lower_pink1 = np.array([165, 65, 60])
    upper_pink1 = np.array([180, 255, 255])
    mask_pink1 = cv2.inRange(hsv, lower_pink1, upper_pink1)

    lower_pink2 = np.array([0, 65, 60])
    upper_pink2 = np.array([10, 255, 255])
    mask_pink2 = cv2.inRange(hsv, lower_pink2, upper_pink2)

    mask_pink = cv2.bitwise_or(mask_pink1, mask_pink2)
    plaque_dye_mask = cv2.bitwise_or(mask_purple, mask_pink)

    # Clean dye mask
    clean_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    plaque_dye_mask = cv2.morphologyEx(plaque_dye_mask, cv2.MORPH_OPEN, clean_k)

    return gum_mask, plaque_dye_mask, mask_purple

def query_roboflow_fdi_numbering(image_bytes, api_key):
    """
    Queries Roboflow model 'front-intraoral-tooth-numbering/1' via Serverless API.
    """
    url = f"https://serverless.roboflow.com/front-intraoral-tooth-numbering/1?confidence={FDI_CONFIDENCE}&overlap={FDI_OVERLAP}"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": f"Bearer {api_key}"
    }
    try:
        req = urllib.request.Request(url, data=image_bytes, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            return res_json.get("predictions", [])
    except Exception:
        try:
            url_fallback = f"https://detect.roboflow.com/front-intraoral-tooth-numbering/1?api_key={api_key}&confidence={FDI_CONFIDENCE}&overlap={FDI_OVERLAP}"
            req2 = urllib.request.Request(url_fallback, data=image_bytes, headers={"Content-Type": "application/x-www-form-urlencoded"})
            with urllib.request.urlopen(req2, timeout=15) as response2:
                res_body2 = response2.read().decode("utf-8")
                res_json2 = json.loads(res_body2)
                return res_json2.get("predictions", [])
        except Exception:
            return []

def query_roboflow_teeth_segmentation(image_bytes, api_key):
    """
    Queries Roboflow model 'teeth-hpjzi/1' for tooth crown instance polygon segmentation.
    """
    url = f"https://detect.roboflow.com/teeth-hpjzi/1?api_key={api_key}&confidence={SEG_CONFIDENCE}&overlap={SEG_OVERLAP}"
    headers = {"Content-Type": "text/plain"}
    try:
        req = urllib.request.Request(url, data=image_bytes, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            return res_json.get("predictions", [])
    except Exception:
        return []

def analyze_plaque(image_path, brightness=0, contrast=1.0, denoise_radius=3):
    if not os.path.exists(image_path):
        return {"status": "error", "message": f"File not found: {image_path}"}

    img = cv2.imread(image_path)
    if img is None:
        return {"status": "error", "message": "Failed to read dental image file"}

    h, w, _ = img.shape

    # Preprocessing
    adjusted = cv2.convertScaleAbs(img, alpha=float(contrast), beta=int(brightness))
    if denoise_radius > 0:
        k_size = int(denoise_radius)
        if k_size % 2 == 0:
            k_size += 1
        processed = cv2.medianBlur(adjusted, k_size)
    else:
        processed = adjusted

    gum_mask, plaque_dye_mask, purple_mask = detect_natural_gums_and_dye(processed)

    # Read image bytes for Roboflow API
    with open(image_path, "rb") as f:
        raw_b64 = base64.b64encode(f.read())

    api_key = os.environ.get("ROBOFLOW_API_KEY", "nKbu7rSZH2yUbPiKsN76")
    
    # 1. Query FDI Tooth Numbering Model (front-intraoral-tooth-numbering/1)
    fdi_predictions = query_roboflow_fdi_numbering(raw_b64, api_key)

    # 2. Query Teeth Crown Segmentation Model (teeth-hpjzi/1)
    seg_predictions = query_roboflow_teeth_segmentation(raw_b64, api_key)

    # Extract Tooth Polygons from Segmentation
    tooth_polygons = []
    if len(seg_predictions) > 0:
        for pred in seg_predictions:
            pts_list = pred.get("points", [])
            if len(pts_list) >= 3:
                poly = np.array([[int(p["x"]), int(p["y"])] for p in pts_list], dtype=np.int32)
                cx = float(pred.get("x", np.mean(poly[:, 0])))
                cy = float(pred.get("y", np.mean(poly[:, 1])))
                tooth_polygons.append({
                    "polygon": poly,
                    "cx": cx,
                    "cy": cy,
                    "confidence": float(pred.get("confidence", 0.90))
                })

    # Sort tooth crowns: Upper Arch (left to right), then Lower Arch (left to right)
    upper_teeth = sorted([t for t in tooth_polygons if t["cy"] < (h * 0.55)], key=lambda t: t["cx"])
    lower_teeth = sorted([t for t in tooth_polygons if t["cy"] >= (h * 0.55)], key=lambda t: t["cx"])

    # Match each tooth crown with authentic FDI prediction from front-intraoral-tooth-numbering
    for tooth in upper_teeth + lower_teeth:
        tcx, tcy = tooth["cx"], tooth["cy"]
        best_match_fdi = None
        min_dist = float("inf")

        for fdi_p in fdi_predictions:
            f_cls = str(fdi_p.get("class", "")).strip()
            if f_cls.isdigit() and 11 <= int(f_cls) <= 48:
                fx = float(fdi_p.get("x", 0))
                fy = float(fdi_p.get("y", 0))
                fw = float(fdi_p.get("width", 0))
                fh = float(fdi_p.get("height", 0))

                dist = np.sqrt((tcx - fx) ** 2 + (tcy - fy) ** 2)
                if dist < min_dist and dist < max(fw, fh, 80):
                    min_dist = dist
                    best_match_fdi = int(f_cls)

        tooth["matched_fdi"] = best_match_fdi

    ordered_teeth = []
    # Upper Arch Assignment
    n_up = len(upper_teeth)
    if n_up > 0:
        mid_idx = n_up // 2
        for idx, t in enumerate(upper_teeth):
            if t.get("matched_fdi"):
                t["tooth_num"] = t["matched_fdi"]
            else:
                t["tooth_num"] = 11 + (mid_idx - 1 - idx) if idx < mid_idx else 21 + (idx - mid_idx)
            t["arch"] = "Upper"
            ordered_teeth.append(t)

    # Lower Arch Assignment
    n_low = len(lower_teeth)
    if n_low > 0:
        mid_idx_low = n_low // 2
        for idx, t in enumerate(lower_teeth):
            if t.get("matched_fdi"):
                t["tooth_num"] = t["matched_fdi"]
            else:
                t["tooth_num"] = 41 + (mid_idx_low - 1 - idx) if idx < mid_idx_low else 31 + (idx - mid_idx_low)
            t["arch"] = "Lower"
            ordered_teeth.append(t)

    mappings = []
    total_enamel_pixels = 0
    total_gumline_plaque_pixels = 0

    # Dilate natural gum tissue slightly to find the exact boundary where tooth enamel meets gums
    dilated_gums = cv2.dilate(gum_mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)), iterations=1)

    # Process each tooth: delete all pixels EXCEPT the gum-tooth contact margin, then detect dye color
    for tooth in ordered_teeth:
        poly = tooth["polygon"]
        tooth_num = tooth.get("tooth_num", 11)

        tooth_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillPoly(tooth_mask, [poly], 255)

        t_area = cv2.countNonZero(tooth_mask)
        if t_area < 200:
            continue

        # 1. Real mathematical contact edge where tooth touches the gum
        contact_edge = cv2.bitwise_and(tooth_mask, dilated_gums)

        # 2. Extract anatomical gumline margin (expand contact edge 12px into the tooth)
        # All other tooth pixels (middle third and biting edges) are DELETED/IGNORED
        gumline_margin_band = cv2.dilate(contact_edge, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)), iterations=1)
        gumline_margin_band = cv2.bitwise_and(gumline_margin_band, tooth_mask)

        # 3. Detect disclosing dye color STRICTLY on this gumline margin band
        stains_on_gumline = cv2.bitwise_and(plaque_dye_mask, gumline_margin_band)

        p_area = cv2.countNonZero(stains_on_gumline)
        total_enamel_pixels += t_area
        total_gumline_plaque_pixels += p_area

        if p_area == 0:
            continue

        # 4. Find individual stain contours strictly on the gumline
        contours, _ = cv2.findContours(stains_on_gumline, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            cnt_area = cv2.contourArea(cnt)
            if cnt_area < 25:
                continue

            cnt_hull = cv2.convexHull(cnt)
            epsilon = 0.015 * cv2.arcLength(cnt_hull, True)
            approx = cv2.approxPolyDP(cnt_hull, epsilon, True)

            coords = []
            for pt in approx:
                pt_x, pt_y = pt[0]
                coords.append({
                    "x": int((pt_x / w) * 600),
                    "y": int((pt_y / h) * 400)
                })

            # Check if this contour is mature purple vs fresh pink
            cnt_mask = np.zeros((h, w), dtype=np.uint8)
            cv2.drawContours(cnt_mask, [cnt_hull], -1, 255, -1)
            purple_pixels = cv2.countNonZero(cv2.bitwise_and(cnt_mask, purple_mask))
            is_mature_purple = (purple_pixels / max(1, cnt_area)) > 0.35

            stain_ratio = (cnt_area / max(1, t_area)) * 100
            if is_mature_purple or stain_ratio > 10 or cnt_area > 150:
                plaque_level = "High"
            elif stain_ratio > 3 or cnt_area > 50:
                plaque_level = "Medium"
            else:
                plaque_level = "Low"

            mappings.append({
                "toothNumber": tooth_num,
                "plaqueLevel": plaque_level,
                "gumlineRegion": "Gumline (Cervical)",
                "coordinates": coords
            })

    # Overall Plaque Index Percentage
    coverage_percent = round((total_gumline_plaque_pixels / max(1, total_enamel_pixels)) * 100, 1)
    if coverage_percent > 100.0:
        coverage_percent = 100.0

    avg_conf = 0.92
    if len(ordered_teeth) > 0:
        avg_conf = round(float(np.mean([t["confidence"] for t in ordered_teeth])), 2)

    return {
        "status": "success",
        "engine": "DentalVision Morphological Gumline Plaque Engine (front-intraoral-tooth-numbering/1)",
        "coverage_percentage": coverage_percent,
        "confidence_score": avg_conf,
        "mappings": mappings
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DentalVision Automated Plaque Image Processor.")
    parser.add_argument("--image", required=True, help="Path to intraoral input image")
    parser.add_argument("--brightness", type=int, default=0, help="Brightness adjustment (-100 to 100)")
    parser.add_argument("--contrast", type=float, default=1.0, help="Contrast adjustment (1.0 to 3.0)")
    parser.add_argument("--denoise", type=int, default=3, help="Median filter kernel denoise size")

    args = parser.parse_args()

    try:
        results = analyze_plaque(args.image, args.brightness, args.contrast, args.denoise)
        print(json.dumps(results))
    except Exception as e:
        error_res = {
            "status": "error",
            "message": str(e)
        }
        print(json.dumps(error_res))
