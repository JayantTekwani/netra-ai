import cv2
import os

input_path = "frontend/public/cctv_delhi.mp4"
output_path = "frontend/public/cctv_delhi_processed.mp4"

if not os.path.exists(input_path):
    print(f"Error: {input_path} not found")
    exit(1)

cap = cv2.VideoCapture(input_path)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)

fourcc = cv2.VideoWriter_fourcc(*'avc1')
out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
fullbody_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_fullbody.xml')

frame_count = 0
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
        
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Detect faces
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    # Detect bodies if no faces (some CCTV angles hide faces)
    if len(faces) == 0:
        faces = fullbody_cascade.detectMultiScale(gray, 1.1, 4)
        
    for (x, y, w, h) in faces:
        # Draw bounding box
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
        
        # Add Hacker Text
        text = "ID: 889104 | MATCH: 98%"
        cv2.putText(frame, text, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        # Draw corners for spy aesthetic
        cv2.line(frame, (x, y), (x+15, y), (0, 255, 0), 4)
        cv2.line(frame, (x, y), (x, y+15), (0, 255, 0), 4)
        cv2.line(frame, (x+w, y), (x+w-15, y), (0, 255, 0), 4)
        cv2.line(frame, (x+w, y), (x+w, y+15), (0, 255, 0), 4)
        cv2.line(frame, (x, y+h), (x+15, y+h), (0, 255, 0), 4)
        cv2.line(frame, (x, y+h), (x, y+h-15), (0, 255, 0), 4)
        cv2.line(frame, (x+w, y+h), (x+w-15, y+h), (0, 255, 0), 4)
        cv2.line(frame, (x+w, y+h), (x+w, y+h-15), (0, 255, 0), 4)
        
    out.write(frame)
    frame_count += 1
    if frame_count >= 200:
        break

cap.release()
out.release()
print(f"Processed {frame_count} frames. Output saved to {output_path}")
