YOLOv8 Segmentation Weights Directory
====================================

Place your trained YOLOv8 segmentation weights file here:
File Name: yolov8n-dental-seg.pt

Instructions:
1. Train a YOLOv8-seg model using standard teeth annotation datasets (such as Tufts Dental Database or UFBA_UESC_DENT).
2. Export the weights to PyTorch format (.pt).
3. Copy the exported weight file into this folder as 'yolov8n-dental-seg.pt'.

Fallback:
If this weights file or the 'ultralytics' library is missing, the system will automatically utilize the high-fidelity OpenCV gums masking fallback engine.
