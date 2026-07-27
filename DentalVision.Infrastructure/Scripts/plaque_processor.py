import cv2
import numpy as np
import json
import argparse
import sys
import os

from enum import Enum

class SegmentationMode(Enum):
    AUTO = "AUTO"
    ROBOFLOW = "ROBOFLOW"
    YOLO = "YOLO"
    OPENCV = "OPENCV"
    COLOR_TEETH = "COLOR_TEETH"

# EDIT THIS CONFIGURATION TO ENFORCE SPECIFIC MODES DURING TESTING
ACTIVE_MODE = SegmentationMode.AUTO 

try:
    from ultralytics import YOLO
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False

def analyze_plaque(image_path, brightness=0, contrast=1.0, denoise_radius=3):
    if not os.path.exists(image_path):
        return {
            "status": "error",
            "message": f"File not found: {image_path}"
        }

    # 1. Load the raw intraoral photo
    img = cv2.imread(image_path)
    
    # Segmentation parameters (Adjust confidence and overlap/IoU threshold here)
    CONFIDENCE_THRESHOLD = 0.25  # Lower this (e.g., to 0.15 or 0.10) if some teeth are missed
    OVERLAP_THRESHOLD = 0.50     # Adjust IoU (e.g., to 0.30 or 0.45) to resolve overlapping detections
    ENABLE_LOCAL_YOLO = False    # Set to True to enable local YOLOv8-seg edge inference fallback
    
    if img is None:
        return {
            "status": "error",
            "message": "Failed to read dental image files"
        }

    h, w, _ = img.shape

    # 2. Image Preprocessing: Brightness & Contrast adjustment
    # alpha = contrast, beta = brightness
    adjusted = cv2.convertScaleAbs(img, alpha=float(contrast), beta=int(brightness))

    # 3. Image Preprocessing: Noise Reduction (Median Blur)
    if denoise_radius > 0:
        k_size = int(denoise_radius)
        if k_size % 2 == 0:
            k_size += 1
        processed = cv2.medianBlur(adjusted, k_size)
    else:
        processed = adjusted

    hsv = cv2.cvtColor(processed, cv2.COLOR_BGR2HSV)

    # 4. Define Plaque Color Mask Boundaries (Two-tone erythrosine solution)
    # Pink/Magenta/Red (fresh plaque)
    # Red/Pink wraps around the 0-180 Hue scale in OpenCV
    lower_pink1 = np.array([140, 85, 60])
    upper_pink1 = np.array([180, 255, 255])
    mask_pink1 = cv2.inRange(hsv, lower_pink1, upper_pink1)

    lower_pink2 = np.array([0, 85, 60])
    upper_pink2 = np.array([10, 255, 255])
    mask_pink2 = cv2.inRange(hsv, lower_pink2, upper_pink2)
    mask_pink = cv2.bitwise_or(mask_pink1, mask_pink2)

    # Blue/Purple (mature/thick plaque)
    lower_blue = np.array([90, 85, 50])
    upper_blue = np.array([135, 255, 255])
    mask_blue = cv2.inRange(hsv, lower_blue, upper_blue)

    # Segment natural gums to prevent segmentation bleeding into gum tissue
    lower_gum = np.array([0, 30, 30])
    upper_gum = np.array([20, 135, 255])
    gum_mask = cv2.inRange(hsv, lower_gum, upper_gum)

    # Combine fresh and mature plaque masks
    plaque_mask = cv2.bitwise_or(mask_pink, mask_blue)

    # Clean up noise with Morphological Operations (Opening and Closing)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    plaque_mask = cv2.morphologyEx(plaque_mask, cv2.MORPH_CLOSE, kernel)
    plaque_mask = cv2.morphologyEx(plaque_mask, cv2.MORPH_OPEN, kernel)
    
    # FIX: Force subtract natural gum tissue colors from the plaque profiles
    plaque_mask = cv2.bitwise_and(plaque_mask, cv2.bitwise_not(gum_mask))

    # Create a vertical Region of Interest (ROI) mask to exclude lips and border margins
    # The teeth are always centered vertically. We ignore the top 24% and bottom 14% of the image.
    roi_mask = np.zeros(processed.shape[:2], dtype=np.uint8)
    roi_top = int(h * 0.24)
    roi_bottom = int(h * 0.86)
    roi_mask[roi_top:roi_bottom, :] = 255

    # Intersect plaque mask with vertical ROI
    plaque_mask = cv2.bitwise_and(plaque_mask, roi_mask)

    # Determine weight path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    weights_path = os.path.join(script_dir, "..", "Weights", "yolov8n-dental-seg.pt")
    if not os.path.exists(weights_path):
        weights_path = os.path.join(script_dir, "weights", "yolov8n-dental-seg.pt")

    # 5. Segmentation Pipeline (Enforces ACTIVE_MODE)
    if ACTIVE_MODE == SegmentationMode.COLOR_TEETH:
        # Teeth HSV threshold: low saturation, high brightness
        lower_tooth_hsv = np.array([0, 0, 100])
        upper_tooth_hsv = np.array([180, 80, 255])
        teeth_mask = cv2.inRange(hsv, lower_tooth_hsv, upper_tooth_hsv)
        
        # Subtract gums
        teeth_mask = cv2.bitwise_and(teeth_mask, cv2.bitwise_not(gum_mask))
        
        # Cleanup
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        teeth_mask = cv2.morphologyEx(teeth_mask, cv2.MORPH_OPEN, kernel)
        teeth_mask = cv2.morphologyEx(teeth_mask, cv2.MORPH_CLOSE, kernel)
        
        # Find individual tooth contours
        contours, _ = cv2.findContours(teeth_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        mappings = []
        total_teeth_pixels = 0
        total_plaque_pixels = 0
        
        for idx, cnt in enumerate(contours):
            cnt = cv2.convexHull(cnt)
            area = cv2.contourArea(cnt)
            if area < 500: # Ignore noise
                continue
                
            # Get centroid of tooth
            M = cv2.moments(cnt)
            if M["m00"] == 0:
                continue
            tcx = int(M["m10"] / M["m00"])
            tcy = int(M["m01"] / M["m00"])
            
            x_ratio = tcx / w
            y_ratio = tcy / h
            
            # Map FDI tooth number based on space
            if y_ratio < 0.58:
                if x_ratio < 0.5:
                    tooth_num = 18 - int(x_ratio * 2 * 7.9)
                else:
                    tooth_num = 21 + int((x_ratio - 0.5) * 2 * 7.9)
            else:
                if x_ratio < 0.5:
                    tooth_num = 48 - int(x_ratio * 2 * 7.9)
                else:
                    tooth_num = 31 + int((x_ratio - 0.5) * 2 * 7.9)
                    
            if y_ratio < 0.58:
                tooth_num = max(11, min(28, tooth_num))
            else:
                tooth_num = max(31, min(48, tooth_num))
                
            # Create single tooth mask
            single_tooth_mask = np.zeros(processed.shape[:2], dtype=np.uint8)
            cv2.drawContours(single_tooth_mask, [cnt], -1, 255, -1)
            
            # Find localized vertical bounds of this specific tooth crown
            pts_indices = np.where(single_tooth_mask > 0)
            if len(pts_indices[0]) > 0:
                ymin_t = int(np.min(pts_indices[0]))
                ymax_t = int(np.max(pts_indices[0]))
            else:
                ymin_t, ymax_t = int(tcy - 10), int(tcy + 10)
                
            tooth_h = ymax_t - ymin_t

            # Create a cervical-third (gumline) mask for this tooth
            cervical_mask = np.zeros_like(single_tooth_mask)
            if y_ratio < 0.58:
                # Upper teeth: Top third is cervical (gumline)
                cervical_boundary = ymin_t + int(tooth_h * 0.33)
                cervical_mask[ymin_t:max(ymin_t + 1, cervical_boundary), :] = 255
            else:
                # Lower teeth: Bottom third is cervical (gumline)
                cervical_boundary = ymax_t - int(tooth_h * 0.33)
                cervical_mask[min(ymax_t - 1, cervical_boundary):ymax_t, :] = 255

            # Restrict the tooth mask to ONLY the cervical third
            cervical_tooth_mask = cv2.bitwise_and(single_tooth_mask, cervical_mask)

            # Calculate plaque pixels strictly inside the cervical third (gumline)
            tooth_plaque = cv2.bitwise_and(plaque_mask, cervical_tooth_mask)
            
            t_area = cv2.countNonZero(cervical_tooth_mask)
            p_area = cv2.countNonZero(tooth_plaque)
            
            total_teeth_pixels += t_area
            total_plaque_pixels += p_area
            
            # Find plaque contours strictly local to this tooth crown
            plaque_cnts, _ = cv2.findContours(tooth_plaque, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for pcnt in plaque_cnts:
                pcnt = cv2.convexHull(pcnt)
                p_cnt_area = cv2.contourArea(pcnt)
                if p_cnt_area < 20:
                    continue
                    
                epsilon = 0.015 * cv2.arcLength(pcnt, True)
                approx = cv2.approxPolyDP(pcnt, epsilon, True)
                
                coords = []
                for pt in approx:
                    pt_x, pt_y = pt[0]
                    coords.append({
                        "x": int((pt_x / w) * 600),
                        "y": int((pt_y / h) * 400)
                    })
                    
                plaque_ratio = (p_area / max(1, t_area)) * 100
                plaque_level = "Low"
                if plaque_ratio > 30:
                    plaque_level = "High"
                elif plaque_ratio > 10:
                    plaque_level = "Medium"
                    
                # Determine anatomical thirds
                M_cnt = cv2.moments(pcnt)
                cy_mom = int(M_cnt["m01"] / M_cnt["m00"]) if M_cnt["m00"] > 0 else int(approx[0][0][1])
                rel_y = (cy_mom - ymin_t) / max(1, tooth_h)
                
                region = "Cervical"
                if y_ratio < 0.58:
                    if rel_y >= 0.66:
                        region = "Incisal"
                    elif rel_y >= 0.33:
                        region = "Middle"
                else:
                    if rel_y < 0.33:
                        region = "Incisal"
                    elif rel_y < 0.66:
                        region = "Middle"
                        
                mappings.append({
                    "toothNumber": tooth_num,
                    "plaqueLevel": plaque_level,
                    "gumlineRegion": region,
                    "coordinates": coords
                })
                
        coverage_percent = round((total_plaque_pixels / max(1, total_teeth_pixels)) * 100, 1)
        return {
            "status": "success",
            "engine": "OpenCV (Color-Based Teeth Segmentation)",
            "coverage_percentage": coverage_percent,
            "confidence_score": 0.85,
            "mappings": mappings
        }

    # Roboflow pipeline check
    api_key = os.environ.get("ROBOFLOW_API_KEY", "yQHvjs9GBBuMd1jodvqI")
    if ACTIVE_MODE in [SegmentationMode.AUTO, SegmentationMode.ROBOFLOW] and api_key:
        try:
            import urllib.request
            import urllib.error
            import base64
            import traceback
            
            url = f"https://detect.roboflow.com/teeth-hpjzi/1?api_key={api_key}&confidence={CONFIDENCE_THRESHOLD}&overlap={OVERLAP_THRESHOLD}"
            with open(image_path, "rb") as f:
                base64_image = base64.b64encode(f.read())
                
            req = urllib.request.Request(
                url, 
                data=base64_image, 
                headers={"Content-Type": "text/plain"}
            )
            
            with urllib.request.urlopen(req, timeout=20) as response:
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)
                
            predictions = res_json.get("predictions", [])
            if len(predictions) > 0:
                mappings = []
                total_teeth_pixels = 0
                total_plaque_pixels = 0
                global_assigned_mask = np.zeros(processed.shape[:2], dtype=np.uint8)
                
                for idx, pred in enumerate(predictions):
                    conf = float(pred.get("confidence", 0.90))
                    cx = float(pred.get("x", w / 2))
                    cy = float(pred.get("y", h / 2))
                    
                    # Filter out horizontal ghost shards in interdental gaps
                    pred_w = float(pred.get("width", 1))
                    pred_h = float(pred.get("height", 1))
                    if pred_w / max(1, pred_h) > 1.8:
                        continue
                    
                    # Resolve FDI Label spatially
                    x_ratio = cx / w
                    y_ratio = cy / h
                    
                    if y_ratio < 0.58:
                        if x_ratio < 0.5:
                            tooth_num = 18 - int(x_ratio * 2 * 7.9)
                        else:
                            tooth_num = 21 + int((x_ratio - 0.5) * 2 * 7.9)
                    else:
                        if x_ratio < 0.5:
                            tooth_num = 48 - int(x_ratio * 2 * 7.9)
                        else:
                            tooth_num = 31 + int((x_ratio - 0.5) * 2 * 7.9)
                            
                    if y_ratio < 0.58:
                        tooth_num = max(11, min(28, tooth_num))
                    else:
                        tooth_num = max(31, min(48, tooth_num))
                        
                    # Extract polygon points and fill mask
                    pts_list = pred.get("points", [])
                    if len(pts_list) < 3:
                        continue
                        
                    poly_pts = []
                    for pt in pts_list:
                        poly_pts.append([int(pt["x"]), int(pt["y"])])
                    poly_pts = np.array(poly_pts, dtype=np.int32)
                    
                    # FIX 1: Apply a Convex Hull ONLY if solidity is low (solidity < 0.8)
                    # This prevents artificially expanding already-accurate tooth profiles.
                    raw_area = cv2.contourArea(poly_pts.reshape(-1, 1, 2))
                    hull_pts = cv2.convexHull(poly_pts)
                    hull_area = cv2.contourArea(hull_pts.reshape(-1, 1, 2))
                    solidity = float(raw_area) / hull_area if hull_area > 0 else 1.0
                    
                    if solidity < 0.8:
                        optimized_pts = hull_pts
                    else:
                        optimized_pts = poly_pts
                    
                    # 2. Generate the single tooth mask
                    single_tooth_mask = np.zeros(processed.shape[:2], dtype=np.uint8)
                    cv2.fillPoly(single_tooth_mask, [optimized_pts], 255)
                    
                    # FIX 2: Create a Dynamic Hard Boundary to chop off gum bleeding
                    # Using the bounding box height to prevent masks from morphing into long vertical columns
                    ymin, xmin, ymax, xmax = float('inf'), float('inf'), float('-inf'), float('-inf')
                    for pt in poly_pts:
                        xmin, ymin = min(xmin, pt[0]), min(ymin, pt[1])
                        xmax, ymax = max(xmax, pt[0]), max(ymax, pt[1])

                    box_h = ymax - ymin
                    cy_box = ymin + (box_h / 2)

                    # Dynamic clipping mask based on localized tooth height bounds
                    clipping_mask = np.zeros(processed.shape[:2], dtype=np.uint8)
                    if y_ratio < 0.58:
                        # Upper teeth: Clip anything excessively high up into the upper gums
                        clip_top = max(0, int(cy_box - (box_h * 0.6)))
                        clipping_mask[clip_top:h, :] = 255
                    else:
                        # Lower teeth (like #41): Clip anything bleeding deep down into the lower gums
                        clip_bottom = min(h, int(cy_box + (box_h * 0.6)))
                        clipping_mask[0:clip_bottom, :] = 255

                    # Apply the vertical boundary constraint and subtract neighbors/gums
                    single_tooth_mask = cv2.bitwise_and(single_tooth_mask, clipping_mask)
                    single_tooth_mask = cv2.bitwise_and(single_tooth_mask, cv2.bitwise_not(global_assigned_mask))
                    single_tooth_mask = cv2.bitwise_and(single_tooth_mask, cv2.bitwise_not(gum_mask))
                    global_assigned_mask = cv2.bitwise_or(global_assigned_mask, single_tooth_mask)
                    
                    # Find localized bounds of this specific single tooth mask
                    pts_indices = np.where(single_tooth_mask > 0)
                    if len(pts_indices[0]) > 0:
                        ymin_t = int(np.min(pts_indices[0]))
                        ymax_t = int(np.max(pts_indices[0]))
                    else:
                        ymin_t, ymax_t = ymin, ymax
                        
                    tooth_h = ymax_t - ymin_t

                    # Create a cervical-third (gumline) mask for this tooth
                    cervical_mask = np.zeros_like(single_tooth_mask)
                    if y_ratio < 0.58:
                        # Upper teeth: Top third is cervical (gumline)
                        cervical_boundary = ymin_t + int(tooth_h * 0.33)
                        cervical_mask[ymin_t:max(ymin_t + 1, cervical_boundary), :] = 255
                    else:
                        # Lower teeth: Bottom third is cervical (gumline)
                        cervical_boundary = ymax_t - int(tooth_h * 0.33)
                        cervical_mask[min(ymax_t - 1, cervical_boundary):ymax_t, :] = 255

                    # Restrict the tooth mask to ONLY the cervical third
                    cervical_tooth_mask = cv2.bitwise_and(single_tooth_mask, cervical_mask)

                    # Calculate plaque pixels strictly inside the cervical third (gumline)
                    tooth_plaque = cv2.bitwise_and(plaque_mask, cervical_tooth_mask)
                    
                    tooth_area = cv2.countNonZero(cervical_tooth_mask)
                    plaque_area = cv2.countNonZero(tooth_plaque)
                    
                    total_teeth_pixels += tooth_area
                    total_plaque_pixels += plaque_area
                    
                    # Find plaque contours strictly local to this tooth crown
                    contours, _ = cv2.findContours(tooth_plaque, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    for cnt in contours:
                        cnt = cv2.convexHull(cnt) # Smooth the plaque contour spikes!
                        area = cv2.contourArea(cnt)
                        if area < 30:
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
                            
                        plaque_ratio = (plaque_area / max(1, tooth_area)) * 100
                        plaque_level = "Low"
                        if plaque_ratio > 30:
                            plaque_level = "High"
                        elif plaque_ratio > 10:
                            plaque_level = "Medium"
                            
                        M_cnt = cv2.moments(cnt)
                        cy_mom = int(M_cnt["m01"] / M_cnt["m00"]) if M_cnt["m00"] > 0 else int(approx[0][0][1])
                        
                        # Determine anatomical thirds
                        rel_y = (cy_mom - ymin_t) / max(1, tooth_h)
                        if y_ratio < 0.58:
                            # Upper teeth: Top is cervical (gumline), bottom is incisal edge
                            if rel_y < 0.33:
                                region = "Cervical"
                            elif rel_y < 0.66:
                                region = "Middle"
                            else:
                                region = "Incisal"
                        else:
                            # Lower teeth: Top is incisal edge, bottom is cervical (gumline)
                            if rel_y < 0.33:
                                region = "Incisal"
                            elif rel_y < 0.66:
                                region = "Middle"
                            else:
                                region = "Cervical"
                        
                        mappings.append({
                            "toothNumber": tooth_num,
                            "plaqueLevel": plaque_level,
                            "gumlineRegion": region,
                            "coordinates": coords
                        })
                        
                coverage_percent = round((total_plaque_pixels / max(1, total_teeth_pixels)) * 100, 1)
                confidences = [float(p.get("confidence", 0.90)) for p in predictions]
                avg_confidence = round(float(np.mean(confidences)), 2) if len(confidences) > 0 else 0.90
                
                return {
                    "status": "success",
                    "engine": "Roboflow Serverless API",
                    "coverage_percentage": coverage_percent,
                    "confidence_score": avg_confidence,
                    "mappings": mappings
                }
        except Exception as rf_err:
            traceback.print_exc()
            print(f"[plaque_processor] Roboflow API error: {rf_err}. Falling back to standard mode.", file=sys.stderr)
            if ACTIVE_MODE == SegmentationMode.ROBOFLOW:
                raise rf_err
            pass

    if (ENABLE_LOCAL_YOLO or ACTIVE_MODE == SegmentationMode.YOLO) and ACTIVE_MODE in [SegmentationMode.AUTO, SegmentationMode.YOLO] and HAS_YOLO and os.path.exists(weights_path):
        try:
            # Stage 1: Tooth Instance Segmentation using YOLOv8-seg model
            model = YOLO(weights_path)
            results = model(processed, verbose=False, conf=CONFIDENCE_THRESHOLD, iou=OVERLAP_THRESHOLD)[0]
            
            if results.masks is not None and len(results.masks) > 0:
                mappings = []
                total_teeth_pixels = 0
                total_plaque_pixels = 0
                
                # Standard FDI Class mapping (index 0-31 to tooth code)
                fdi_mapping = [
                    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,  # Upper Arch
                    38, 37, 36, 35, 34, 33, 32, 31, 48, 47, 46, 45, 44, 43, 42, 41   # Lower Arch
                ]
                
                global_assigned_mask = np.zeros(processed.shape[:2], dtype=np.uint8)
                
                for idx, box in enumerate(results.boxes):
                    class_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    # Resolve FDI Label
                    class_name = results.names[class_id]
                    if class_name.isdigit() and 11 <= int(class_name) <= 48:
                        tooth_num = int(class_name)
                    elif class_id < len(fdi_mapping):
                        tooth_num = fdi_mapping[class_id]
                    else:
                        tooth_num = 11 # Default fallback
                        
                    # Extract polygon points and fill mask
                    poly_pts = results.masks.xy[idx].astype(np.int32)
                    if len(poly_pts) < 3:
                        continue
                        
                    # FIX 1: Apply a Convex Hull ONLY if solidity is low (solidity < 0.8)
                    # This prevents artificially expanding already-accurate tooth profiles.
                    raw_area = cv2.contourArea(poly_pts.reshape(-1, 1, 2))
                    hull_pts = cv2.convexHull(poly_pts)
                    hull_area = cv2.contourArea(hull_pts.reshape(-1, 1, 2))
                    solidity = float(raw_area) / hull_area if hull_area > 0 else 1.0
                    
                    if solidity < 0.8:
                        optimized_pts = hull_pts
                    else:
                        optimized_pts = poly_pts
                    
                    # 2. Generate the single tooth mask
                    single_tooth_mask = np.zeros(processed.shape[:2], dtype=np.uint8)
                    cv2.fillPoly(single_tooth_mask, [optimized_pts], 255)
                    
                    # FIX 2: Create a Dynamic Hard Boundary to chop off gum bleeding
                    # Using the bounding box height to prevent masks from morphing into long vertical columns
                    ymin, xmin, ymax, xmax = float('inf'), float('inf'), float('-inf'), float('-inf')
                    for pt in poly_pts:
                        xmin, ymin = min(xmin, pt[0]), min(ymin, pt[1])
                        xmax, ymax = max(xmax, pt[0]), max(ymax, pt[1])

                    box_h = ymax - ymin
                    cy_box = ymin + (box_h / 2)

                    # Dynamic clipping mask based on localized tooth height bounds
                    clipping_mask = np.zeros(processed.shape[:2], dtype=np.uint8)
                    if y_ratio < 0.58:
                        # Upper teeth: Clip anything excessively high up into the upper gums
                        clip_top = max(0, int(cy_box - (box_h * 0.6)))
                        clipping_mask[clip_top:h, :] = 255
                    else:
                        # Lower teeth (like #41): Clip anything bleeding deep down into the lower gums
                        clip_bottom = min(h, int(cy_box + (box_h * 0.6)))
                        clipping_mask[0:clip_bottom, :] = 255

                    # Apply the vertical boundary constraint and subtract neighbors/gums
                    single_tooth_mask = cv2.bitwise_and(single_tooth_mask, clipping_mask)
                    single_tooth_mask = cv2.bitwise_and(single_tooth_mask, cv2.bitwise_not(global_assigned_mask))
                    single_tooth_mask = cv2.bitwise_and(single_tooth_mask, cv2.bitwise_not(gum_mask))
                    global_assigned_mask = cv2.bitwise_or(global_assigned_mask, single_tooth_mask)
                    
                    # Find localized bounds of this specific single tooth mask
                    pts_indices = np.where(single_tooth_mask > 0)
                    if len(pts_indices[0]) > 0:
                        ymin_t = int(np.min(pts_indices[0]))
                        ymax_t = int(np.max(pts_indices[0]))
                    else:
                        ymin_t, ymax_t = ymin, ymax
                        
                    tooth_h = ymax_t - ymin_t

                    # Create a cervical-third (gumline) mask for this tooth
                    cervical_mask = np.zeros_like(single_tooth_mask)
                    if y_ratio < 0.58:
                        # Upper teeth: Top third is cervical (gumline)
                        cervical_boundary = ymin_t + int(tooth_h * 0.33)
                        cervical_mask[ymin_t:max(ymin_t + 1, cervical_boundary), :] = 255
                    else:
                        # Lower teeth: Bottom third is cervical (gumline)
                        cervical_boundary = ymax_t - int(tooth_h * 0.33)
                        cervical_mask[min(ymax_t - 1, cervical_boundary):ymax_t, :] = 255

                    # Restrict the tooth mask to ONLY the cervical third
                    cervical_tooth_mask = cv2.bitwise_and(single_tooth_mask, cervical_mask)

                    # Calculate plaque pixels strictly inside the cervical third (gumline)
                    tooth_plaque = cv2.bitwise_and(plaque_mask, cervical_tooth_mask)
                    
                    tooth_area = cv2.countNonZero(cervical_tooth_mask)
                    plaque_area = cv2.countNonZero(tooth_plaque)
                    
                    total_teeth_pixels += tooth_area
                    total_plaque_pixels += plaque_area
                    
                    # Find plaque contours strictly local to this tooth crown
                    contours, _ = cv2.findContours(tooth_plaque, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    for cnt in contours:
                        cnt = cv2.convexHull(cnt) # Smooth the plaque contour spikes!
                        area = cv2.contourArea(cnt)
                        if area < 30:
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
                            
                        plaque_ratio = (plaque_area / max(1, tooth_area)) * 100
                        plaque_level = "Low"
                        if plaque_ratio > 30:
                            plaque_level = "High"
                        elif plaque_ratio > 10:
                            plaque_level = "Medium"
                            
                        M_cnt = cv2.moments(cnt)
                        cy_mom = int(M_cnt["m01"] / M_cnt["m00"]) if M_cnt["m00"] > 0 else int(approx[0][0][1])
                        
                        # Determine anatomical thirds
                        rel_y = (cy_mom - ymin_t) / max(1, tooth_h)
                        if y_ratio < 0.58:
                            # Upper teeth: Top is cervical (gumline), bottom is incisal edge
                            if rel_y < 0.33:
                                region = "Cervical"
                            elif rel_y < 0.66:
                                region = "Middle"
                            else:
                                region = "Incisal"
                        else:
                            # Lower teeth: Top is incisal edge, bottom is cervical (gumline)
                            if rel_y < 0.33:
                                region = "Incisal"
                            elif rel_y < 0.66:
                                region = "Middle"
                            else:
                                region = "Cervical"
                        
                        mappings.append({
                            "toothNumber": tooth_num,
                            "plaqueLevel": plaque_level,
                            "gumlineRegion": region,
                            "coordinates": coords
                        })
                        
                coverage_percent = round((total_plaque_pixels / max(1, total_teeth_pixels)) * 100, 1)
                avg_confidence = round(float(np.mean([float(b.conf[0]) for b in results.boxes])), 2)
                
                return {
                    "status": "success",
                    "engine": "YOLOv8-seg (Local Edge)",
                    "coverage_percentage": coverage_percent,
                    "confidence_score": avg_confidence,
                    "mappings": mappings
                }
        except Exception as ml_err:
            # Fall back to CV mode silently on any YOLO loading/execution errors
            if ACTIVE_MODE == SegmentationMode.YOLO:
                raise ml_err
            pass

    # Stage 2 Fallback: CV-based Thresholding and Boundary Masking
    # Segment natural gums and lips (Red/Orange hues in HSV 0 to 18, low-to-medium saturation 40-125)
    lower_gum = np.array([0, 40, 40])
    upper_gum = np.array([18, 125, 255])
    gum_mask = cv2.inRange(hsv, lower_gum, upper_gum)

    boundary_gums_mask = np.zeros(processed.shape[:2], dtype=np.uint8)
    boundary_gums_mask[0:int(h * 0.32), :] = 255
    boundary_gums_mask[int(h * 0.72):h, :] = 255
    gum_mask = cv2.bitwise_and(gum_mask, boundary_gums_mask)

    gum_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    gum_mask = cv2.dilate(gum_mask, gum_kernel, iterations=1)
    teeth_crown_mask = cv2.bitwise_not(gum_mask)

    plaque_mask = cv2.bitwise_and(plaque_mask, teeth_crown_mask)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    plaque_mask = cv2.morphologyEx(plaque_mask, cv2.MORPH_OPEN, kernel)
    plaque_mask = cv2.morphologyEx(plaque_mask, cv2.MORPH_CLOSE, kernel)

    gray = cv2.cvtColor(processed, cv2.COLOR_BGR2GRAY)
    _, active_mouth_mask = cv2.threshold(gray, 20, 255, cv2.THRESH_BINARY)
    active_teeth_mask = cv2.bitwise_and(active_mouth_mask, teeth_crown_mask)
    active_teeth_mask = cv2.bitwise_and(active_teeth_mask, roi_mask)
    
    total_teeth_pixels = cv2.countNonZero(active_teeth_mask)
    plaque_pixels = cv2.countNonZero(plaque_mask)

    coverage_percent = 0.0
    if total_teeth_pixels > 0:
        coverage_percent = round((plaque_pixels / total_teeth_pixels) * 100, 1)

    contours, _ = cv2.findContours(plaque_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    mappings = []
    confidence_score_sum = 0.0
    valid_contour_count = 0

    for idx, cnt in enumerate(contours):
        cnt = cv2.convexHull(cnt) # Smooth the plaque contour spikes!
        area = cv2.contourArea(cnt)
        if area < 120:
            continue

        valid_contour_count += 1
        epsilon = 0.015 * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, epsilon, True)
        
        coords = []
        for pt in approx:
            pt_x, pt_y = pt[0]
            coords.append({
                "x": int((pt_x / w) * 600),
                "y": int((pt_y / h) * 400)
            })

        M = cv2.moments(cnt)
        cx = int(M["m10"] / M["m00"]) if M["m00"] > 0 else int(approx[0][0][0])
        cy = int(M["m01"] / M["m00"]) if M["m00"] > 0 else int(approx[0][0][1])

        x_ratio = cx / w
        y_ratio = cy / h
        
        if y_ratio < 0.58:
            if x_ratio < 0.5:
                tooth_num = 18 - int(x_ratio * 2 * 7.9)
            else:
                tooth_num = 21 + int((x_ratio - 0.5) * 2 * 7.9)
        else:
            if x_ratio < 0.5:
                tooth_num = 48 - int(x_ratio * 2 * 7.9)
            else:
                tooth_num = 31 + int((x_ratio - 0.5) * 2 * 7.9)
        
        if y_ratio < 0.58:
            tooth_num = max(11, min(28, tooth_num))
        else:
            tooth_num = max(31, min(48, tooth_num))

        if area > 1000:
            plaque_level = "High"
            weight = 0.94
        elif area > 350:
            plaque_level = "Medium"
            weight = 0.88
        else:
            plaque_level = "Low"
            weight = 0.81

        confidence_score_sum += weight
        region = "Cervical" if cy > (h * 0.4) else "Margin"

        mappings.append({
            "toothNumber": tooth_num,
            "plaqueLevel": plaque_level,
            "gumlineRegion": region,
            "coordinates": coords
        })

    avg_confidence = round(confidence_score_sum / max(1, valid_contour_count), 2)
    if valid_contour_count == 0:
        avg_confidence = 0.90

    return {
        "status": "success",
        "engine": "OpenCV (HSV Fallback)",
        "coverage_percentage": coverage_percent,
        "confidence_score": avg_confidence,
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
