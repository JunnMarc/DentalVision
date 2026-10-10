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

# Configurable sensitivity thresholds (Lower confidence = detects more teeth)
FDI_CONFIDENCE = 0.08      # Lowered to 0.08 so every subtle/partial tooth is detected
FDI_OVERLAP = 0.35         # Resolves overlapping bounding boxes
SEG_CONFIDENCE = 0.08      # Lowered to 0.08 to capture all enamel crown polygons
SEG_OVERLAP = 0.40
MIN_PLAQUE_AREA = 65       # Filters out micro-speck noise/reflections (<65px)

try:
    from ultralytics import YOLO
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False

def detect_disclosing_plaque_mask(image_bgr):
    """
    Isolates two-tone and erythrosine dental disclosing dye stains
    while strictly rejecting natural white/ivory enamel and saliva glare.
    """
    h, w, _ = image_bgr.shape
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    l_chan, a_chan, b_chan = cv2.split(lab)

    # 1. Mature Acidogenic Biofilm (Thick / Deep Purple, Violet, Indigo)
    # HSV: Hue 100-165, Saturation >= 45, Value >= 30
    lower_purple = np.array([100, 45, 30])
    upper_purple = np.array([165, 255, 255])
    mask_purple = cv2.inRange(hsv, lower_purple, upper_purple)

    # 2. Fresh Plaque Biofilm (Erythrosine Pink, Vivid Magenta, Reddish)
    # HSV: Hue in 165-180 or 0-10, Saturation >= 65, Value >= 65
    lower_pink1 = np.array([165, 65, 65])
    upper_pink1 = np.array([180, 255, 255])
    mask_pink1 = cv2.inRange(hsv, lower_pink1, upper_pink1)

    lower_pink2 = np.array([0, 65, 65])
    upper_pink2 = np.array([10, 255, 255])
    mask_pink2 = cv2.inRange(hsv, lower_pink2, upper_pink2)

    mask_pink = cv2.bitwise_or(mask_pink1, mask_pink2)
    plaque_mask = cv2.bitwise_or(mask_purple, mask_pink)

    # Clean up small noise with Morphological Operations
    clean_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    plaque_mask = cv2.morphologyEx(plaque_mask, cv2.MORPH_OPEN, clean_kernel)
    plaque_mask = cv2.morphologyEx(plaque_mask, cv2.MORPH_CLOSE, clean_kernel)

    # 3. Gingival Tissue (Natural Gums) Mask using Lab a* redness channel
    _, gum_mask = cv2.threshold(a_chan, 142, 255, cv2.THRESH_BINARY)
    gum_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    gum_mask = cv2.morphologyEx(gum_mask, cv2.MORPH_CLOSE, gum_kernel)

    # Exclude extreme top and bottom border margins (lips/retractor)
    roi_mask = np.zeros((h, w), dtype=np.uint8)
    roi_top = int(h * 0.10)
    roi_bottom = int(h * 0.92)
    roi_mask[roi_top:roi_bottom, :] = 255
    plaque_mask = cv2.bitwise_and(plaque_mask, roi_mask)

    return plaque_mask, gum_mask, mask_purple

def query_roboflow_fdi_numbering(image_bytes, api_key):
    """
    Queries Roboflow model 'front-intraoral-tooth-numbering/1' with sensitivity tuning.
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

    plaque_mask, gum_mask, purple_mask = detect_disclosing_plaque_mask(processed)

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

    # Fallback to HSV / Edge teeth segmentation if remote models returned no teeth
    if len(tooth_polygons) == 0:
        hsv_full = cv2.cvtColor(processed, cv2.COLOR_BGR2HSV)
        lower_tooth = np.array([0, 0, 90])
        upper_tooth = np.array([180, 80, 255])
        raw_teeth = cv2.inRange(hsv_full, lower_tooth, upper_tooth)
        raw_teeth = cv2.bitwise_and(raw_teeth, cv2.bitwise_not(gum_mask))
        t_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        raw_teeth = cv2.morphologyEx(raw_teeth, cv2.MORPH_OPEN, t_kernel)
        raw_teeth = cv2.morphologyEx(raw_teeth, cv2.MORPH_CLOSE, t_kernel)
        
        cnts, _ = cv2.findContours(raw_teeth, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in cnts:
            if cv2.contourArea(c) > 600:
                c_hull = cv2.convexHull(c)
                M = cv2.moments(c_hull)
                if M["m00"] > 0:
                    cx = M["m10"] / M["m00"]
                    cy = M["m01"] / M["m00"]
                    tooth_polygons.append({
                        "polygon": c_hull.reshape(-1, 2),
                        "cx": cx,
                        "cy": cy,
                        "confidence": 0.85
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
                if dist < min_dist and dist < max(fw, fh, 75):
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
    total_plaque_pixels = 0

    # Process each tooth crown with dynamic gumline boundary extraction
    for tooth in ordered_teeth:
        poly = tooth["polygon"]
        tooth_num = tooth.get("tooth_num", 11)
        is_upper = tooth.get("arch", "Upper") == "Upper"

        tooth_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillPoly(tooth_mask, [poly], 255)

        pts_indices = np.where(tooth_mask > 0)
        if len(pts_indices[0]) == 0:
            continue

        ymin_t = int(np.min(pts_indices[0]))
        ymax_t = int(np.max(pts_indices[0]))
        xmin_t = int(np.min(pts_indices[1]))
        xmax_t = int(np.max(pts_indices[1]))
        tooth_h = max(1, ymax_t - ymin_t)
        tooth_w = max(1, xmax_t - xmin_t)

        # Dynamic Gumline (Gingival Margin) Interface Detection
        dilated_gums = cv2.dilate(gum_mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)), iterations=1)
        gumline_interface = cv2.bitwise_and(tooth_mask, dilated_gums)

        # Distance transform from gumline
        if cv2.countNonZero(gumline_interface) > 0:
            dist_from_gum = cv2.distanceTransform(cv2.bitwise_not(gumline_interface), cv2.DIST_L2, 5)
        else:
            dist_from_gum = np.zeros((h, w), dtype=np.float32)
            for y_p in range(ymin_t, ymax_t + 1):
                dist_val = (y_p - ymin_t) if is_upper else (ymax_t - y_p)
                dist_from_gum[y_p, xmin_t:xmax_t + 1] = float(dist_val)

        # Cervical Zone = closest 35% to the gingival margin
        cervical_threshold = tooth_h * 0.35
        cervical_zone = np.where((dist_from_gum <= cervical_threshold) & (tooth_mask > 0), 255, 0).astype(np.uint8)

        # Interproximal Zone = outer 20% along lateral margins (mesial/distal edges)
        proximal_zone = np.zeros((h, w), dtype=np.uint8)
        prox_w = int(tooth_w * 0.20)
        proximal_zone[:, xmin_t:min(w, xmin_t + prox_w)] = 255
        proximal_zone[:, max(0, xmax_t - prox_w):xmax_t] = 255
        proximal_zone = cv2.bitwise_and(proximal_zone, tooth_mask)

        # Plaque on this tooth crown
        tooth_plaque = cv2.bitwise_and(plaque_mask, tooth_mask)
        t_area = cv2.countNonZero(tooth_mask)
        p_area = cv2.countNonZero(tooth_plaque)

        total_enamel_pixels += t_area
        total_plaque_pixels += p_area

        if p_area == 0:
            continue

        # Find individual plaque stain contours (Filtered against micro-specks)
        contours, _ = cv2.findContours(tooth_plaque, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            cnt = cv2.convexHull(cnt)
            cnt_area = cv2.contourArea(cnt)
            if cnt_area < MIN_PLAQUE_AREA:
                continue

            epsilon = 0.015 * cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, epsilon, True)

            coords = []
            for pt in approx:
                pt_x, pt_y = pt[0]
                coords.append({
                    "x": int((pt_x / w) * 600),
                    "y": int((pt_y / h) * 400)
                })

            # Check if this contour is mature purple vs fresh pink
            cnt_mask = np.zeros((h, w), dtype=np.uint8)
            cv2.drawContours(cnt_mask, [cnt], -1, 255, -1)
            purple_pixels = cv2.countNonZero(cv2.bitwise_and(cnt_mask, purple_mask))
            is_mature_purple = (purple_pixels / max(1, cnt_area)) > 0.35

            # Plaque Severity Classification
            stain_ratio = (cnt_area / max(1, t_area)) * 100
            if is_mature_purple or stain_ratio > 18 or cnt_area > 300:
                plaque_level = "High"
            elif stain_ratio > 6 or cnt_area > 100:
                plaque_level = "Medium"
            else:
                plaque_level = "Low"

            # Check overlap with Cervical (Gumline) Zone vs Interproximal vs Crown
            cervical_overlap = cv2.countNonZero(cv2.bitwise_and(cnt_mask, cervical_zone))
            proximal_overlap = cv2.countNonZero(cv2.bitwise_and(cnt_mask, proximal_zone))

            if cervical_overlap > (cnt_area * 0.25):
                region = "Gumline (Cervical)"
            elif proximal_overlap > (cnt_area * 0.25):
                region = "Interproximal"
            else:
                region = "Crown Surface"

            mappings.append({
                "toothNumber": tooth_num,
                "plaqueLevel": plaque_level,
                "gumlineRegion": region,
                "coordinates": coords
            })

    # Overall Plaque Index Percentage
    coverage_percent = round((total_plaque_pixels / max(1, total_enamel_pixels)) * 100, 1)
    if coverage_percent > 100.0:
        coverage_percent = 100.0

    avg_conf = 0.92
    if len(ordered_teeth) > 0:
        avg_conf = round(float(np.mean([t["confidence"] for t in ordered_teeth])), 2)

    return {
        "status": "success",
        "engine": "DentalVision Hybrid Engine (front-intraoral-tooth-numbering/1 + Biofilm Scanner)",
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
